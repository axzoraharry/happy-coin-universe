
import { useToast } from '@/hooks/use-toast';

const HAPPY_PAISA_LEDGER_URL = 'http://localhost:8004';

export interface HappyPaisaBalance {
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
}

export interface HappyPaisaTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  description: string;
  recipient_id?: string;
  reference_id?: string;
  status: string;
  created_at: string;
}

export interface TransferRequest {
  from_user_id: string;
  to_user_id: string;
  amount: number;
  description?: string;
  reference_id?: string;
}

export interface AddFundsRequest {
  user_id: string;
  amount: number;
  source: string;
  reference_id?: string;
}

export interface TransactionResponse {
  success: boolean;
  transaction_id?: string;
  message: string;
  balance?: number;
  transaction?: HappyPaisaTransaction;
}

class HappyPaisaAPI {
  private baseUrl: string;

  constructor(baseUrl: string = HAPPY_PAISA_LEDGER_URL) {
    this.baseUrl = baseUrl;
  }

  async getBalance(userId: string): Promise<HappyPaisaBalance> {
    const response = await fetch(`${this.baseUrl}/api/v1/balance/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to get balance: ${response.statusText}`);
    }
    return response.json();
  }

  async addFunds(request: AddFundsRequest): Promise<TransactionResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/add-funds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `Failed to add funds: ${response.statusText}`);
    }
    return result;
  }

  async transfer(request: TransferRequest): Promise<TransactionResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `Failed to transfer funds: ${response.statusText}`);
    }
    return result;
  }

  async getTransactions(userId: string, limit: number = 50): Promise<HappyPaisaTransaction[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/transactions/${userId}?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to get transactions: ${response.statusText}`);
    }
    return response.json();
  }

  async createWallet(userId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create wallet: ${response.statusText}`);
    }
    return response.json();
  }

  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  }
}

export const happyPaisaApi = new HappyPaisaAPI();
