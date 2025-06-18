
import { supabase } from '@/integrations/supabase/client';
import { transferRequestSchema, paymentRequestSchema, isRateLimited, sanitizeInput, TransferResponse, PaymentResponse } from './validation';

interface SecureTransferOptions {
  recipientEmail: string;
  amount: number;
  description?: string;
  pin?: string;
}

interface SecurePaymentOptions {
  apiKey: string;
  external_order_id: string;
  user_email: string;
  amount: number;
  description?: string;
  callback_url?: string;
  user_pin?: string;
}

export class SecureApiClient {
  private static instance: SecureApiClient;

  static getInstance(): SecureApiClient {
    if (!SecureApiClient.instance) {
      SecureApiClient.instance = new SecureApiClient();
    }
    return SecureApiClient.instance;
  }

  async secureTransfer(options: SecureTransferOptions): Promise<TransferResponse> {
    // Rate limiting check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    if (isRateLimited(`transfer_${user.id}`, 5, 300000)) { // 5 transfers per 5 minutes
      throw new Error('Rate limit exceeded. Please wait before making another transfer.');
    }

    // Input validation
    const validatedData = transferRequestSchema.parse({
      recipientEmail: sanitizeInput(options.recipientEmail),
      amount: options.amount,
      description: options.description ? sanitizeInput(options.description) : undefined,
      pin: options.pin
    });

    // Find recipient user
    const { data: recipientProfile, error: recipientError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', validatedData.recipientEmail)
      .single();

    if (recipientError || !recipientProfile) {
      throw new Error('Recipient not found');
    }

    if (recipientProfile.id === user.id) {
      throw new Error('Cannot transfer to yourself');
    }

    // Use secure database function
    const { data, error } = await supabase.rpc('process_secure_wallet_transfer_v2', {
      sender_id: user.id,
      recipient_id: recipientProfile.id,
      transfer_amount: validatedData.amount,
      transfer_description: validatedData.description || 'Transfer',
      sender_pin: validatedData.pin || null
    });

    if (error) throw new Error(error.message);
    
    // Safely cast the response by first going through unknown
    const result = data as unknown as TransferResponse;
    if (!result?.success) throw new Error(result?.error || 'Transfer failed');

    return result;
  }

  async secureExternalPayment(options: SecurePaymentOptions): Promise<PaymentResponse> {
    // Input validation
    const validatedData = paymentRequestSchema.parse({
      external_order_id: sanitizeInput(options.external_order_id),
      user_email: sanitizeInput(options.user_email),
      amount: options.amount,
      description: options.description ? sanitizeInput(options.description) : undefined,
      callback_url: options.callback_url,
      user_pin: options.user_pin
    });

    // Rate limiting
    if (isRateLimited(`payment_${validatedData.user_email}`, 10, 60000)) { // 10 payments per minute
      throw new Error('Rate limit exceeded for payment requests');
    }

    const { data, error } = await supabase.functions.invoke('wallet-payment', {
      body: validatedData,
      headers: {
        'x-api-key': options.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (error) throw error;
    
    // Safely cast the response by first going through unknown
    return data as unknown as PaymentResponse;
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const { data } = await supabase.rpc('validate_api_key_format', {
        p_api_key: apiKey
      });
      return data === true;
    } catch {
      return false;
    }
  }
}

export const secureApi = SecureApiClient.getInstance();
