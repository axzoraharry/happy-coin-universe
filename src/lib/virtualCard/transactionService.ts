
import { supabase } from '@/integrations/supabase/client';
import { VirtualCardTransaction, CardBalanceResult, PaymentResult } from './types';
import { CardValidationService } from './cardValidation';

export class TransactionService {
  // Get card transactions
  static async getCardTransactions(cardId?: string): Promise<VirtualCardTransaction[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('virtual_card_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (cardId) {
      query = query.eq('card_id', cardId);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    return (data || []).map(transaction => ({
      ...transaction,
      transaction_type: transaction.transaction_type as 'purchase' | 'refund' | 'validation' | 'activation' | 'deactivation',
      status: transaction.status as 'pending' | 'completed' | 'failed' | 'cancelled',
      merchant_info: typeof transaction.merchant_info === 'object' ? transaction.merchant_info as Record<string, any> : {},
      metadata: typeof transaction.metadata === 'object' ? transaction.metadata as Record<string, any> : {},
      amount: Number(transaction.amount)
    }));
  }

  // Create a transaction record
  static async recordTransaction(params: {
    card_id: string;
    transaction_type: 'purchase' | 'refund' | 'validation' | 'activation' | 'deactivation';
    amount?: number;
    description?: string;
    merchant_info?: Record<string, any>;
    reference_id?: string;
    metadata?: Record<string, any>;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('virtual_card_transactions')
      .insert({
        card_id: params.card_id,
        user_id: user.id,
        transaction_type: params.transaction_type,
        amount: params.amount || 0,
        description: params.description,
        merchant_info: params.merchant_info || {},
        reference_id: params.reference_id,
        metadata: params.metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Process card payment (enhanced API functionality)
  static async processPayment(params: {
    card_number: string;
    pin: string;
    amount: number;
    merchant_id: string;
    description?: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<PaymentResult> {
    try {
      const validation = await CardValidationService.validateCard({
        card_number: params.card_number,
        pin: params.pin,
        ip_address: params.ip_address,
        user_agent: params.user_agent
      });

      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      const dailyRemaining = (validation.daily_limit || 0) - (validation.daily_spent || 0);
      const monthlyRemaining = (validation.monthly_limit || 0) - (validation.monthly_spent || 0);

      if (params.amount > dailyRemaining) {
        return { 
          success: false, 
          error: 'Daily spending limit exceeded' 
        };
      }

      if (params.amount > monthlyRemaining) {
        return { 
          success: false, 
          error: 'Monthly spending limit exceeded' 
        };
      }

      const transaction = await this.recordTransaction({
        card_id: validation.card_id!,
        transaction_type: 'purchase',
        amount: params.amount,
        description: params.description || `Payment to merchant ${params.merchant_id}`,
        merchant_info: {
          merchant_id: params.merchant_id,
          ip_address: params.ip_address,
          user_agent: params.user_agent
        },
        reference_id: `PAY_${Date.now()}_${validation.card_id?.substring(0, 8)}`
      });

      return {
        success: true,
        transaction_id: transaction.id
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  // Get card balance and limits
  static async getCardBalance(cardId: string): Promise<CardBalanceResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('virtual_cards')
        .select('daily_limit, monthly_limit, current_daily_spent, current_monthly_spent')
        .eq('id', cardId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (!data) return { success: false, error: 'Card not found' };

      const daily_limit = Number(data.daily_limit);
      const monthly_limit = Number(data.monthly_limit);
      const daily_spent = Number(data.current_daily_spent);
      const monthly_spent = Number(data.current_monthly_spent);

      return {
        success: true,
        daily_limit,
        monthly_limit,
        daily_spent,
        monthly_spent,
        daily_remaining: daily_limit - daily_spent,
        monthly_remaining: monthly_limit - monthly_spent
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get card balance'
      };
    }
  }
}
