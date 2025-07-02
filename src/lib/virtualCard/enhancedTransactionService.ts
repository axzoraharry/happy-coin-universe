
import { supabase } from '@/integrations/supabase/client';

export interface TransactionRequest {
  card_id: string;
  transaction_type: 'purchase' | 'refund' | 'validation' | 'activation' | 'deactivation';
  amount?: number;
  description?: string;
  merchant_info?: Record<string, any>;
  reference_id?: string;
}

export interface ValidationRequest {
  card_id: string;
  amount: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  daily_remaining?: number;
  monthly_remaining?: number;
  daily_limit?: number;
}

export interface TransactionResult {
  success: boolean;
  transaction_id?: string;
  error?: string;
  daily_remaining?: number;
  monthly_remaining?: number;
}

export class EnhancedTransactionService {
  private static readonly API_BASE_URL = `https://zygpupmeradizrachnqj.supabase.co/functions/v1`;

  private static async getApiKey(): Promise<string | null> {
    try {
      // In a production environment, you would get this from your API key management system
      // For now, we'll use a placeholder that would be replaced with actual API key management
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      // This would typically fetch the user's API key from their settings
      // For demo purposes, we'll use a mock API key
      return 'demo_api_key_' + user.id.substring(0, 8);
    } catch (error) {
      console.error('Failed to get API key:', error);
      return null;
    }
  }

  private static async makeApiRequest(endpoint: string, method: string = 'POST', data?: any): Promise<any> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('Authentication required - please set up your API key');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    };

    const requestOptions: RequestInit = {
      method,
      headers,
    };

    if (data && method !== 'GET') {
      requestOptions.body = JSON.stringify(data);
    }

    const url = method === 'GET' && data ? 
      `${this.API_BASE_URL}${endpoint}?${new URLSearchParams(data).toString()}` :
      `${this.API_BASE_URL}${endpoint}`;

    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  static async processTransaction(request: TransactionRequest): Promise<TransactionResult> {
    try {
      console.log('Processing transaction via API:', request);
      
      const result = await this.makeApiRequest(
        '/card-transaction-api/process-transaction',
        'POST',
        request
      );

      console.log('Transaction API result:', result);
      return result;
    } catch (error) {
      console.error('Transaction processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async validateTransactionLimits(request: ValidationRequest): Promise<ValidationResult> {
    try {
      console.log('Validating transaction limits via API:', request);
      
      const result = await this.makeApiRequest(
        '/card-transaction-api/validate-limits',
        'POST',
        request
      );

      console.log('Validation API result:', result);
      return result;
    } catch (error) {
      console.error('Transaction validation failed:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async validateCard(request: {
    card_number: string;
    pin: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<any> {
    try {
      console.log('Validating card via API');
      
      const result = await this.makeApiRequest(
        '/card-transaction-api/validate-card',
        'POST',
        request
      );

      console.log('Card validation API result:', result);
      return result;
    } catch (error) {
      console.error('Card validation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getCardDetails(cardId: string, userPin?: string): Promise<any> {
    try {
      console.log('Getting card details via API:', cardId);
      
      const result = await this.makeApiRequest(
        '/card-transaction-api/get-card-details',
        'POST',
        { card_id: cardId, user_pin: userPin }
      );

      console.log('Card details API result:', result);
      return result;
    } catch (error) {
      console.error('Get card details failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getTransactions(cardId: string, limit: number = 50): Promise<any> {
    try {
      console.log('Getting transactions via API:', cardId);
      
      const result = await this.makeApiRequest(
        '/card-transaction-api/get-transactions',
        'GET',
        { card_id: cardId, limit: limit.toString() }
      );

      console.log('Transactions API result:', result);
      return result;
    } catch (error) {
      console.error('Get transactions failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        transactions: []
      };
    }
  }

  static async issueCard(request: {
    user_id: string;
    pin: string;
    daily_limit?: number;
    monthly_limit?: number;
  }): Promise<any> {
    try {
      console.log('Issuing card via API:', request);
      
      const result = await this.makeApiRequest(
        '/card-transaction-api/issue-card',
        'POST',
        request
      );

      console.log('Card issuance API result:', result);
      return result;
    } catch (error) {
      console.error('Card issuance failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
