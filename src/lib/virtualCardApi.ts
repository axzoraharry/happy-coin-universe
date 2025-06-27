
import { supabase } from '@/integrations/supabase/client';

export interface VirtualCard {
  id: string;
  user_id: string;
  card_number?: string; // Only available during issuance
  cvv?: string; // Only available during issuance
  expiry_date: string;
  status: 'active' | 'inactive' | 'blocked' | 'expired';
  card_type: 'virtual' | 'physical';
  issuer_name: string;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
  activation_date?: string;
  daily_limit: number;
  monthly_limit: number;
  current_daily_spent: number;
  current_monthly_spent: number;
  metadata: Record<string, any>;
}

export interface VirtualCardTransaction {
  id: string;
  card_id: string;
  user_id: string;
  transaction_type: 'purchase' | 'refund' | 'validation' | 'activation' | 'deactivation';
  amount: number;
  description?: string;
  merchant_info: Record<string, any>;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference_id?: string;
  created_at: string;
  metadata: Record<string, any>;
}

export interface CardValidationResult {
  success: boolean;
  card_id?: string;
  user_id?: string;
  status?: string;
  daily_limit?: number;
  monthly_limit?: number;
  daily_spent?: number;
  monthly_spent?: number;
  error?: string;
}

export class VirtualCardAPI {
  
  // Issue a new virtual card
  static async issueVirtualCard(params: {
    pin: string;
    daily_limit?: number;
    monthly_limit?: number;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.rpc('issue_virtual_card', {
      p_user_id: user.id,
      p_pin: params.pin,
      p_daily_limit: params.daily_limit || 5000.00,
      p_monthly_limit: params.monthly_limit || 50000.00
    });

    if (error) throw error;
    return data;
  }

  // Get user's virtual cards
  static async getUserCards(): Promise<VirtualCard[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('virtual_cards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Validate card number and PIN
  static async validateCard(params: {
    card_number: string;
    pin: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<CardValidationResult> {
    const { data, error } = await supabase.rpc('validate_virtual_card', {
      p_card_number: params.card_number,
      p_pin: params.pin,
      p_ip_address: params.ip_address,
      p_user_agent: params.user_agent
    });

    if (error) throw error;
    return data;
  }

  // Update card status
  static async updateCardStatus(cardId: string, newStatus: 'active' | 'inactive' | 'blocked' | 'expired') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.rpc('update_card_status', {
      p_user_id: user.id,
      p_card_id: cardId,
      p_new_status: newStatus
    });

    if (error) throw error;
    return data;
  }

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
    return data || [];
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
}
