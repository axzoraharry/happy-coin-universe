
import { supabase } from '@/integrations/supabase/client';

interface TransactionRequest {
  card_number: string;
  transaction_type: 'purchase' | 'refund' | 'validation' | 'activation' | 'deactivation';
  amount?: number;
  description?: string;
  merchant_info?: Record<string, any>;
  reference_id?: string;
  user_id?: string;
}

interface TransactionResponse {
  success: boolean;
  error?: string;
  transaction_id?: string;
  card_id?: string;
  daily_remaining?: number;
  monthly_remaining?: number;
}

interface ValidationRequest {
  card_number: string;
  amount: number;
  user_id?: string;
}

interface ValidationResponse {
  valid: boolean;
  error?: string;
  daily_remaining?: number;
  monthly_remaining?: number;
  daily_limit?: number;
}

export class EnhancedTransactionService {
  /**
   * Process a transaction using card number instead of card ID
   */
  static async processTransaction(params: TransactionRequest): Promise<TransactionResponse> {
    try {
      console.log('Processing transaction:', params);

      const { data, error } = await supabase.rpc('process_card_transaction_by_number', {
        p_card_number: params.card_number,
        p_transaction_type: params.transaction_type,
        p_amount: params.amount || 0,
        p_description: params.description || '',
        p_merchant_info: params.merchant_info || {},
        p_reference_id: params.reference_id || null,
        p_user_id: params.user_id || null
      });

      if (error) {
        console.error('Transaction processing error:', error);
        throw error;
      }

      console.log('Transaction result:', data);
      return data as TransactionResponse;
    } catch (error: any) {
      console.error('Enhanced transaction service error:', error);
      return {
        success: false,
        error: error.message || 'Transaction processing failed'
      };
    }
  }

  /**
   * Validate transaction limits using card number
   */
  static async validateTransactionLimits(params: ValidationRequest): Promise<ValidationResponse> {
    try {
      console.log('Validating transaction limits:', params);

      const { data, error } = await supabase.rpc('validate_transaction_limits_by_number', {
        p_card_number: params.card_number,
        p_amount: params.amount,
        p_user_id: params.user_id || null
      });

      if (error) {
        console.error('Validation error:', error);
        throw error;
      }

      console.log('Validation result:', data);
      return data as ValidationResponse;
    } catch (error: any) {
      console.error('Enhanced validation service error:', error);
      return {
        valid: false,
        error: error.message || 'Validation failed'
      };
    }
  }

  /**
   * Get card details by card number (for authenticated users)
   */
  static async getCardByNumber(cardNumber: string, userId?: string): Promise<any> {
    try {
      console.log('Getting card by number:', { cardNumber: cardNumber.slice(-4), userId });

      const { data, error } = await supabase.rpc('get_card_by_number', {
        p_card_number: cardNumber,
        p_user_id: userId || null
      });

      if (error) {
        console.error('Get card by number error:', error);
        throw error;
      }

      console.log('Card lookup result:', data);
      return data;
    } catch (error: any) {
      console.error('Enhanced card lookup service error:', error);
      throw error;
    }
  }
}
