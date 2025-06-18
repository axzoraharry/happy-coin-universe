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
import { securityMonitor } from './securityMonitor';

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
    // Record security event
    securityMonitor.recordSecurityEvent({
      eventType: 'transfer_attempt',
      severity: 'low',
      details: { 
        recipientEmail: options.recipientEmail, 
        amount: options.amount 
      }
    });

    logSecurityEvent('transfer_attempt', { 
      recipientEmail: options.recipientEmail, 
      amount: options.amount 
    });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      securityMonitor.recordSecurityEvent({
        eventType: 'transfer_auth_failed',
        severity: 'medium',
        details: { error: authError?.message },
        userId: user?.id
      });
      logSecurityEvent('transfer_auth_failed', { error: authError?.message });
      throw new Error('Authentication required');
    }

    // Rate limiting check
    if (isRateLimited(`transfer_${user.id}`, 5, 300000)) { // 5 transfers per 5 minutes
      securityMonitor.recordSecurityEvent({
        eventType: 'transfer_rate_limited',
        severity: 'high',
        details: { userId: user.id },
        userId: user.id
      });
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

      // Detect unusual transfer amounts
      if (validatedData.amount > 5000) {
        securityMonitor.recordSecurityEvent({
          eventType: 'unusual_transfer_amount',
          severity: 'medium',
          details: { amount: validatedData.amount, recipientEmail: validatedData.recipientEmail },
          userId: user.id
        });
      }

      // Find recipient user
      const { data: recipientProfile, error: recipientError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', validatedData.recipientEmail)
        .single();

      if (recipientError || !recipientProfile) {
        securityMonitor.recordSecurityEvent({
          eventType: 'transfer_recipient_not_found',
          severity: 'low',
          details: { email: validatedData.recipientEmail },
          userId: user.id
        });
        logSecurityEvent('transfer_recipient_not_found', { email: validatedData.recipientEmail });
        throw new Error('Recipient not found');
      }

      if (recipientProfile.id === user.id) {
        securityMonitor.recordSecurityEvent({
          eventType: 'transfer_self_attempt',
          severity: 'medium',
          details: { userId: user.id },
          userId: user.id
        });
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
        securityMonitor.recordSecurityEvent({
          eventType: 'transfer_db_error',
          severity: 'high',
          details: { error: error.message },
          userId: user.id
        });
        logSecurityEvent('transfer_db_error', { error: error.message });
        throw new Error(error.message);
      }
      
      // Safely cast the response
      const result = data as unknown as TransferResponse;
      if (!result?.success) {
        securityMonitor.recordSecurityEvent({
          eventType: 'transfer_failed',
          severity: 'medium',
          details: { error: result?.error },
          userId: user.id
        });
        logSecurityEvent('transfer_failed', { error: result?.error });
        throw new Error(result?.error || 'Transfer failed');
      }

      securityMonitor.recordSecurityEvent({
        eventType: 'transfer_success',
        severity: 'low',
        details: { 
          referenceId: result.reference_id,
          pinVerified: result.pin_verified,
          amount: validatedData.amount
        },
        userId: user.id
      });

      logSecurityEvent('transfer_success', { 
        referenceId: result.reference_id,
        pinVerified: result.pin_verified 
      });

      return result;
    } catch (validationError: any) {
      securityMonitor.recordSecurityEvent({
        eventType: 'transfer_validation_error',
        severity: 'low',
        details: { error: validationError.message },
        userId: user?.id
      });
      logSecurityEvent('transfer_validation_error', { error: validationError.message });
      throw validationError;
    }
  }

  async secureExternalPayment(options: SecurePaymentOptions): Promise<PaymentResponse> {
    securityMonitor.recordSecurityEvent({
      eventType: 'payment_attempt',
      severity: 'low',
      details: { 
        orderId: options.external_order_id,
        userEmail: options.user_email,
        amount: options.amount 
      }
    });

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
        securityMonitor.recordSecurityEvent({
          eventType: 'payment_invalid_api_key',
          severity: 'high',
          details: { apiKey: options.apiKey.substring(0, 10) + '...' }
        });
        logSecurityEvent('payment_invalid_api_key', { apiKey: options.apiKey.substring(0, 10) + '...' });
        throw new Error('Invalid API key format');
      }

      // Rate limiting
      if (isRateLimited(`payment_${validatedData.user_email}`, 10, 60000)) { // 10 payments per minute
        securityMonitor.recordSecurityEvent({
          eventType: 'payment_rate_limited',
          severity: 'high',
          details: { userEmail: validatedData.user_email }
        });
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
        securityMonitor.recordSecurityEvent({
          eventType: 'payment_edge_function_error',
          severity: 'high',
          details: { error: error.message }
        });
        logSecurityEvent('payment_edge_function_error', { error: error.message });
        throw error;
      }
      
      // Safely cast the response
      const result = data as unknown as PaymentResponse;
      
      if (result?.success) {
        securityMonitor.recordSecurityEvent({
          eventType: 'payment_success',
          severity: 'low',
          details: { 
            paymentRequestId: result.payment_request_id,
            transactionId: result.transaction_id 
          }
        });
        logSecurityEvent('payment_success', { 
          paymentRequestId: result.payment_request_id,
          transactionId: result.transaction_id 
        });
      } else {
        securityMonitor.recordSecurityEvent({
          eventType: 'payment_failed',
          severity: 'medium',
          details: { error: result?.error }
        });
        logSecurityEvent('payment_failed', { error: result?.error });
      }

      return result;
    } catch (validationError: any) {
      securityMonitor.recordSecurityEvent({
        eventType: 'payment_validation_error',
        severity: 'low',
        details: { error: validationError.message }
      });
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
      securityMonitor.recordSecurityEvent({
        eventType: 'api_key_validation',
        severity: 'low',
        details: { 
          apiKey: apiKey.substring(0, 10) + '...', 
          isValid 
        }
      });
      
      logSecurityEvent('api_key_validation', { 
        apiKey: apiKey.substring(0, 10) + '...', 
        isValid 
      });
      
      return isValid;
    } catch (error) {
      securityMonitor.recordSecurityEvent({
        eventType: 'api_key_validation_error',
        severity: 'medium',
        details: { 
          apiKey: apiKey.substring(0, 10) + '...', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      });
      logSecurityEvent('api_key_validation_error', { 
        apiKey: apiKey.substring(0, 10) + '...', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }
}

export const secureApi = SecureApiClient.getInstance();
