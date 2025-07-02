
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

interface CardValidationRequest {
  card_number: string;
  pin: string;
  ip_address?: string;
  user_agent?: string;
}

interface CardValidationResponse {
  success: boolean;
  error?: string;
  card_id?: string;
  user_id?: string;
  status?: string;
  daily_limit?: number;
  monthly_limit?: number;
  daily_spent?: number;
  monthly_spent?: number;
}

interface CardDetailsResponse {
  success: boolean;
  error?: string;
  card?: any;
}

interface TransactionsResponse {
  success: boolean;
  error?: string;
  transactions?: any[];
}

interface IssueCardRequest {
  user_id: string;
  pin: string;
  daily_limit: number;
  monthly_limit: number;
}

interface IssueCardResponse {
  success: boolean;
  error?: string;
  card_id?: string;
  card_number?: string;
  cvv?: string;
  expiry_date?: string;
  masked_card_number?: string;
  status?: string;
  daily_limit?: number;
  monthly_limit?: number;
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
      return data as unknown as TransactionResponse;
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
      return data as unknown as ValidationResponse;
    } catch (error: any) {
      console.error('Enhanced validation service error:', error);
      return {
        valid: false,
        error: error.message || 'Validation failed'
      };
    }
  }

  /**
   * Validate card credentials
   */
  static async validateCard(params: CardValidationRequest): Promise<CardValidationResponse> {
    try {
      console.log('Validating card:', { card_number: params.card_number.slice(-4) });

      const { data, error } = await supabase.rpc('validate_virtual_card', {
        p_card_number: params.card_number,
        p_pin: params.pin,
        p_ip_address: params.ip_address || null,
        p_user_agent: params.user_agent || null
      });

      if (error) {
        console.error('Card validation error:', error);
        throw error;
      }

      console.log('Card validation result:', data);
      return data as unknown as CardValidationResponse;
    } catch (error: any) {
      console.error('Enhanced card validation service error:', error);
      return {
        success: false,
        error: error.message || 'Card validation failed'
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

  /**
   * Get card details using card number and pin
   */
  static async getCardDetails(cardNumber: string, pin?: string, userId?: string): Promise<CardDetailsResponse> {
    try {
      console.log('Getting card details:', { cardNumber: cardNumber.slice(-4), userId });

      // First get basic card info
      const cardData = await this.getCardByNumber(cardNumber, userId);
      
      if (!cardData || cardData.length === 0) {
        return {
          success: false,
          error: 'Card not found or access denied'
        };
      }

      return {
        success: true,
        card: cardData[0]
      };
    } catch (error: any) {
      console.error('Enhanced card details service error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get card details'
      };
    }
  }

  /**
   * Get transactions for a card using card number
   */
  static async getTransactions(cardNumber: string, limit: number = 10, userId?: string): Promise<TransactionsResponse> {
    try {
      console.log('Getting transactions for card:', { cardNumber: cardNumber.slice(-4), limit, userId });

      // First get card info to get the card ID
      const cardData = await this.getCardByNumber(cardNumber, userId);
      
      if (!cardData || cardData.length === 0) {
        return {
          success: false,
          error: 'Card not found or access denied'
        };
      }

      const cardId = cardData[0].card_id;

      const { data: transactions, error } = await supabase
        .from('virtual_card_transactions')
        .select('*')
        .eq('card_id', cardId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Transactions fetch error:', error);
        throw error;
      }

      return {
        success: true,
        transactions: transactions || []
      };
    } catch (error: any) {
      console.error('Enhanced transactions service error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get transactions'
      };
    }
  }

  /**
   * Issue a new virtual card
   */
  static async issueCard(params: IssueCardRequest): Promise<IssueCardResponse> {
    try {
      console.log('Issuing new card for user:', params.user_id);

      const { data, error } = await supabase.rpc('issue_virtual_card', {
        p_user_id: params.user_id,
        p_pin: params.pin,
        p_daily_limit: params.daily_limit,
        p_monthly_limit: params.monthly_limit
      });

      if (error) {
        console.error('Card issuance error:', error);
        throw error;
      }

      console.log('Card issuance result:', data);
      return data as unknown as IssueCardResponse;
    } catch (error: any) {
      console.error('Enhanced card issuance service error:', error);
      return {
        success: false,
        error: error.message || 'Card issuance failed'
      };
    }
  }
}
