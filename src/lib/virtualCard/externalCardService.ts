
import { supabase } from '@/integrations/supabase/client';

export interface ExternalCardDetails {
  id: string;
  user_id: string;
  masked_card_number: string;
  expiry_date: string;
  status: string;
  card_type: string;
  issuer_name: string;
  daily_limit: number;
  monthly_limit: number;
  current_daily_spent: number;
  current_monthly_spent: number;
  daily_remaining: number;
  monthly_remaining: number;
  is_transaction_ready: boolean;
  last_used_at?: string;
  created_at: string;
  metadata: Record<string, any>;
}

export interface ExternalCardResponse {
  success: boolean;
  card?: ExternalCardDetails;
  total_active_cards?: number;
  error?: string;
  has_cards?: boolean;
  total_cards?: number;
}

export class ExternalCardService {
  private static readonly SUPABASE_URL = 'https://zygpupmeradizrachnqj.supabase.co';
  private static readonly API_ENDPOINT = `${this.SUPABASE_URL}/functions/v1/get-active-virtual-card`;

  /**
   * Get active virtual card details for external applications
   * This method uses the shared authentication system
   */
  static async getActiveVirtualCard(): Promise<ExternalCardResponse> {
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      // Make API call to get active card
      const response = await fetch(this.API_ENDPOINT, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to fetch active card',
          has_cards: data.has_cards,
          total_cards: data.total_cards
        };
      }

      return data;
    } catch (error) {
      console.error('External card service error:', error);
      return {
        success: false,
        error: 'Network error occurred'
      };
    }
  }

  /**
   * Check if user has any active cards ready for transactions
   */
  static async hasActiveCard(): Promise<boolean> {
    const result = await this.getActiveVirtualCard();
    return result.success && result.card?.is_transaction_ready === true;
  }

  /**
   * Get card spending limits and current usage
   */
  static async getCardLimits(): Promise<{
    daily_limit: number;
    monthly_limit: number;
    daily_remaining: number;
    monthly_remaining: number;
  } | null> {
    const result = await this.getActiveVirtualCard();
    
    if (!result.success || !result.card) {
      return null;
    }

    return {
      daily_limit: result.card.daily_limit,
      monthly_limit: result.card.monthly_limit,
      daily_remaining: result.card.daily_remaining,
      monthly_remaining: result.card.monthly_remaining
    };
  }

  /**
   * Validate if a transaction amount is within limits
   */
  static async validateTransactionAmount(amount: number): Promise<{
    valid: boolean;
    error?: string;
    limits?: {
      daily_remaining: number;
      monthly_remaining: number;
    };
  }> {
    const limits = await this.getCardLimits();
    
    if (!limits) {
      return {
        valid: false,
        error: 'No active card found'
      };
    }

    if (amount > limits.daily_remaining) {
      return {
        valid: false,
        error: 'Amount exceeds daily spending limit',
        limits: {
          daily_remaining: limits.daily_remaining,
          monthly_remaining: limits.monthly_remaining
        }
      };
    }

    if (amount > limits.monthly_remaining) {
      return {
        valid: false,
        error: 'Amount exceeds monthly spending limit',
        limits: {
          daily_remaining: limits.daily_remaining,
          monthly_remaining: limits.monthly_remaining
        }
      };
    }

    return {
      valid: true,
      limits: {
        daily_remaining: limits.daily_remaining,
        monthly_remaining: limits.monthly_remaining
      }
    };
  }
}
