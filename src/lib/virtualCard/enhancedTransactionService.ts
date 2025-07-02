import { supabase } from '@/integrations/supabase/client';

export interface TransactionAnalytics {
  card_id: string;
  user_id: string;
  masked_card_number: string;
  card_status: string;
  total_transactions: number;
  total_purchases: number;
  total_refunds: number;
  daily_spent: number;
  monthly_spent: number;
  last_transaction_at: string | null;
  failed_transactions: number;
  daily_transactions: number;
}

export interface ProcessTransactionRequest {
  card_id: string;
  transaction_type: 'purchase' | 'refund' | 'validation' | 'activation' | 'deactivation';
  amount?: number;
  description?: string;
  merchant_info?: Record<string, any>;
  reference_id?: string;
}

export interface ProcessPaymentRequest {
  card_number: string;
  pin: string;
  amount: number;
  merchant_id: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface LimitValidationRequest {
  card_id: string;
  amount: number;
}

export interface LimitValidationResponse {
  valid: boolean;
  daily_remaining: number;
  monthly_remaining: number;
  daily_limit: number;
  monthly_limit: number;
  daily_spent: number;
  monthly_spent: number;
  error?: string;
}

export class EnhancedTransactionService {
  private static readonly FUNCTION_NAME = 'card-transaction-api';

  /**
   * Get authentication headers for API calls
   */
  private static async getAuthHeaders() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required. Please log in.');
      }

      return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.error('Failed to get auth headers:', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Process a card transaction using the enhanced API
   */
  static async processTransaction(request: ProcessTransactionRequest) {
    try {
      const headers = await this.getAuthHeaders();
      
      const { data, error } = await supabase.functions.invoke(this.FUNCTION_NAME, {
        body: {
          endpoint: 'process-transaction',
          ...request
        },
        headers
      });

      if (error) {
        console.error('Transaction processing error:', error);
        throw new Error(error.message || 'Failed to process transaction');
      }

      return data;
    } catch (error) {
      console.error('Enhanced transaction service error:', error);
      throw error;
    }
  }

  /**
   * Process a payment with card validation
   */
  static async processPayment(request: ProcessPaymentRequest) {
    try {
      const headers = await this.getAuthHeaders();
      
      const { data, error } = await supabase.functions.invoke(this.FUNCTION_NAME, {
        body: {
          endpoint: 'process-payment',
          ...request
        },
        headers
      });

      if (error) {
        console.error('Payment processing error:', error);
        throw new Error(error.message || 'Failed to process payment');
      }

      return data;
    } catch (error) {
      console.error('Enhanced payment service error:', error);
      throw error;
    }
  }

  /**
   * Get transaction analytics for cards
   */
  static async getTransactionAnalytics(cardId?: string): Promise<TransactionAnalytics[]> {
    try {
      const headers = await this.getAuthHeaders();
      
      const { data, error } = await supabase.functions.invoke(this.FUNCTION_NAME, {
        body: {
          endpoint: 'get-analytics',
          card_id: cardId
        },
        headers
      });

      if (error) {
        console.error('Analytics fetch error:', error);
        throw new Error(error.message || 'Failed to fetch analytics');
      }

      return data?.analytics || [];
    } catch (error) {
      console.error('Enhanced analytics service error:', error);
      throw error;
    }
  }

  /**
   * Get paginated card transactions
   */
  static async getTransactions(cardId?: string, limit: number = 50, offset: number = 0) {
    try {
      const headers = await this.getAuthHeaders();
      
      const { data, error } = await supabase.functions.invoke(this.FUNCTION_NAME, {
        body: {
          endpoint: 'get-transactions',
          card_id: cardId,
          limit,
          offset
        },
        headers
      });

      if (error) {
        console.error('Transactions fetch error:', error);
        throw new Error(error.message || 'Failed to fetch transactions');
      }

      return data?.transactions || [];
    } catch (error) {
      console.error('Enhanced transactions service error:', error);
      throw error;
    }
  }

  /**
   * Validate transaction amount against card limits
   */
  static async validateTransactionLimits(request: LimitValidationRequest): Promise<LimitValidationResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const { data, error } = await supabase.functions.invoke(this.FUNCTION_NAME, {
        body: {
          endpoint: 'validate-limits',
          ...request
        },
        headers
      });

      if (error) {
        console.error('Limit validation error:', error);
        throw new Error(error.message || 'Failed to validate limits');
      }

      return data.validation;
    } catch (error) {
      console.error('Enhanced limit validation service error:', error);
      throw error;
    }
  }

  /**
   * Get real-time spending summary for a card
   */
  static async getSpendingSummary(cardId: string) {
    try {
      const analytics = await this.getTransactionAnalytics(cardId);
      const cardAnalytics = analytics.find(a => a.card_id === cardId);
      
      if (!cardAnalytics) {
        throw new Error('Card analytics not found');
      }

      return {
        total_transactions: cardAnalytics.total_transactions,
        total_purchases: cardAnalytics.total_purchases,
        total_refunds: cardAnalytics.total_refunds,
        daily_spent: cardAnalytics.daily_spent,
        monthly_spent: cardAnalytics.monthly_spent,
        failed_transactions: cardAnalytics.failed_transactions,
        last_transaction_at: cardAnalytics.last_transaction_at,
        success_rate: cardAnalytics.total_transactions > 0 
          ? ((cardAnalytics.total_transactions - cardAnalytics.failed_transactions) / cardAnalytics.total_transactions * 100).toFixed(2)
          : '0'
      };
    } catch (error) {
      console.error('Spending summary error:', error);
      throw error;
    }
  }

  /**
   * Create a purchase transaction
   */
  static async createPurchase(cardId: string, amount: number, description: string, merchantInfo: Record<string, any> = {}) {
    return this.processTransaction({
      card_id: cardId,
      transaction_type: 'purchase',
      amount,
      description,
      merchant_info: merchantInfo
    });
  }

  /**
   * Create a refund transaction
   */
  static async createRefund(cardId: string, amount: number, description: string, originalTransactionId?: string) {
    return this.processTransaction({
      card_id: cardId,
      transaction_type: 'refund',
      amount,
      description,
      reference_id: originalTransactionId
    });
  }
}
