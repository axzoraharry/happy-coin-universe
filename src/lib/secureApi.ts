
import { supabase } from '@/integrations/supabase/client';
import { 
  transferRequestSchema, 
  paymentRequestSchema, 
  isRateLimited, 
  sanitizeInput, 
  TransferResponse, 
  PaymentResponse,
  logSecurityEvent,
  validateInput
} from './validation';

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
    logSecurityEvent('transfer_attempt', { 
      recipientEmail: options.recipientEmail, 
      amount: options.amount 
    });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logSecurityEvent('transfer_auth_failed', { error: authError?.message });
      throw new Error('Authentication required');
    }

    // Rate limiting check
    if (isRateLimited(`transfer_${user.id}`, 5, 300000)) { // 5 transfers per 5 minutes
      logSecurityEvent('transfer_rate_limited', { userId: user.id });
      throw new Error('Rate limit exceeded. Please wait before making another transfer.');
    }

    // Input validation
    try {
      const validatedData = transferRequestSchema.parse({
        recipientEmail: sanitizeInput(options.recipientEmail),
        amount: options.amount,
        description: options.description ? sanitizeInput(options.description) : undefined,
        pin: options.pin
      });

      // Additional validation
      if (!validateInput.email(validatedData.recipientEmail)) {
        throw new Error('Invalid email format');
      }

      if (!validateInput.amount(validatedData.amount)) {
        throw new Error('Invalid transfer amount');
      }

      // Find recipient user
      const { data: recipientProfile, error: recipientError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', validatedData.recipientEmail)
        .single();

      if (recipientError || !recipientProfile) {
        logSecurityEvent('transfer_recipient_not_found', { email: validatedData.recipientEmail });
        throw new Error('Recipient not found');
      }

      if (recipientProfile.id === user.id) {
        logSecurityEvent('transfer_self_attempt', { userId: user.id });
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

      if (error) {
        logSecurityEvent('transfer_db_error', { error: error.message });
        throw new Error(error.message);
      }
      
      // Safely cast the response
      const result = data as unknown as TransferResponse;
      if (!result?.success) {
        logSecurityEvent('transfer_failed', { error: result?.error });
        throw new Error(result?.error || 'Transfer failed');
      }

      logSecurityEvent('transfer_success', { 
        referenceId: result.reference_id,
        pinVerified: result.pin_verified 
      });

      return result;
    } catch (validationError: any) {
      logSecurityEvent('transfer_validation_error', { error: validationError.message });
      throw validationError;
    }
  }

  async secureExternalPayment(options: SecurePaymentOptions): Promise<PaymentResponse> {
    logSecurityEvent('payment_attempt', { 
      orderId: options.external_order_id,
      userEmail: options.user_email,
      amount: options.amount 
    });

    // Input validation
    try {
      const validatedData = paymentRequestSchema.parse({
        external_order_id: sanitizeInput(options.external_order_id),
        user_email: sanitizeInput(options.user_email),
        amount: options.amount,
        description: options.description ? sanitizeInput(options.description) : undefined,
        callback_url: options.callback_url,
        user_pin: options.user_pin
      });

      // API key validation
      if (!validateInput.apiKey(options.apiKey)) {
        logSecurityEvent('payment_invalid_api_key', { apiKey: options.apiKey.substring(0, 10) + '...' });
        throw new Error('Invalid API key format');
      }

      // Rate limiting
      if (isRateLimited(`payment_${validatedData.user_email}`, 10, 60000)) { // 10 payments per minute
        logSecurityEvent('payment_rate_limited', { userEmail: validatedData.user_email });
        throw new Error('Rate limit exceeded for payment requests');
      }

      const { data, error } = await supabase.functions.invoke('wallet-payment', {
        body: validatedData,
        headers: {
          'x-api-key': options.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        logSecurityEvent('payment_edge_function_error', { error: error.message });
        throw error;
      }
      
      // Safely cast the response
      const result = data as unknown as PaymentResponse;
      
      if (result?.success) {
        logSecurityEvent('payment_success', { 
          paymentRequestId: result.payment_request_id,
          transactionId: result.transaction_id 
        });
      } else {
        logSecurityEvent('payment_failed', { error: result?.error });
      }

      return result;
    } catch (validationError: any) {
      logSecurityEvent('payment_validation_error', { error: validationError.message });
      throw validationError;
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      if (!validateInput.apiKey(apiKey)) {
        return false;
      }

      const { data } = await supabase.rpc('validate_api_key_format', {
        p_api_key: apiKey
      });
      
      const isValid = data === true;
      logSecurityEvent('api_key_validation', { 
        apiKey: apiKey.substring(0, 10) + '...', 
        isValid 
      });
      
      return isValid;
    } catch (error) {
      logSecurityEvent('api_key_validation_error', { 
        apiKey: apiKey.substring(0, 10) + '...', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }
}

export const secureApi = SecureApiClient.getInstance();
