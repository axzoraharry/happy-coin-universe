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
  cards_checked?: number;
  error?: string;
}

export interface CardIssuanceResult {
  success: boolean;
  card_id?: string;
  card_number?: string;
  cvv?: string;
  expiry_date?: string;
  status?: string;
  daily_limit?: number;
  monthly_limit?: number;
  error?: string;
}

export interface CardStatusUpdateResult {
  success: boolean;
  card_id?: string;
  new_status?: string;
  updated_at?: string;
  error?: string;
}

export class VirtualCardAPI {
  
  // Issue a new virtual card with enhanced error handling
  static async issueVirtualCard(params: {
    pin: string;
    daily_limit?: number;
    monthly_limit?: number;
  }): Promise<CardIssuanceResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Issuing virtual card for user:', user.id);

      const { data, error } = await supabase.rpc('issue_virtual_card', {
        p_user_id: user.id,
        p_pin: params.pin,
        p_daily_limit: params.daily_limit || 5000.00,
        p_monthly_limit: params.monthly_limit || 50000.00
      });

      if (error) {
        console.error('Database error during card issuance:', error);
        throw error;
      }
      
      console.log('Card issuance result:', data);
      // Type assertion with proper error handling
      const result = data as unknown as CardIssuanceResult;
      return result;
    } catch (error) {
      console.error('Card issuance failed:', error);
      throw error;
    }
  }

  // Get user's virtual cards with better error handling
  static async getUserCards(): Promise<VirtualCard[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Fetching cards for user:', user.id);

      const { data, error } = await supabase
        .from('virtual_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error fetching cards:', error);
        throw error;
      }
      
      console.log('Retrieved cards:', data?.length || 0);
      
      // Transform the data to match our interface
      return (data || []).map(card => ({
        ...card,
        status: card.status as 'active' | 'inactive' | 'blocked' | 'expired',
        card_type: card.card_type as 'virtual' | 'physical',
        metadata: typeof card.metadata === 'object' ? card.metadata as Record<string, any> : {},
        daily_limit: Number(card.daily_limit),
        monthly_limit: Number(card.monthly_limit),
        current_daily_spent: Number(card.current_daily_spent),
        current_monthly_spent: Number(card.current_monthly_spent)
      }));
    } catch (error) {
      console.error('Failed to fetch user cards:', error);
      throw error;
    }
  }

  // Validate card number and PIN with enhanced logging
  static async validateCard(params: {
    card_number: string;
    pin: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<CardValidationResult> {
    try {
      console.log('Validating card:', {
        card_number: params.card_number.substring(0, 4) + '****',
        ip_address: params.ip_address,
        user_agent: params.user_agent?.substring(0, 50) + '...'
      });

      const { data, error } = await supabase.rpc('validate_virtual_card', {
        p_card_number: params.card_number,
        p_pin: params.pin,
        p_ip_address: params.ip_address,
        p_user_agent: params.user_agent
      });

      if (error) {
        console.error('Database error during validation:', error);
        throw error;
      }
      
      // Type assertion with proper validation
      const result = data as unknown;
      if (typeof result === 'object' && result !== null) {
        const validationResult = result as CardValidationResult;
        console.log('Validation result:', {
          success: validationResult.success,
          cards_checked: validationResult.cards_checked,
          error: validationResult.error
        });
        return validationResult;
      }
      
      // Fallback for unexpected response format
      return {
        success: false,
        error: 'Invalid response format from validation'
      };
    } catch (error) {
      console.error('Card validation failed:', error);
      throw error;
    }
  }

  // Update card status
  static async updateCardStatus(
    cardId: string, 
    newStatus: 'active' | 'inactive' | 'blocked' | 'expired'
  ): Promise<CardStatusUpdateResult> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.rpc('update_card_status', {
      p_user_id: user.id,
      p_card_id: cardId,
      p_new_status: newStatus
    });

    if (error) throw error;
    
    const result = data as unknown as CardStatusUpdateResult;
    return result;
  }

  // Delete/Remove a virtual card
  static async deleteVirtualCard(cardId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Deleting virtual card:', cardId);

      // First, check if the card exists and belongs to the user
      const { data: cardData, error: cardError } = await supabase
        .from('virtual_cards')
        .select('id, status')
        .eq('id', cardId)
        .eq('user_id', user.id)
        .single();

      if (cardError || !cardData) {
        console.error('Card not found or access denied:', cardError);
        return {
          success: false,
          error: 'Card not found or you do not have permission to delete it'
        };
      }

      // Record deletion transaction before deleting the card
      const { error: transactionError } = await supabase
        .from('virtual_card_transactions')
        .insert({
          card_id: cardId,
          user_id: user.id,
          transaction_type: 'deactivation',
          description: 'Virtual card deleted by user',
          amount: 0
        });

      if (transactionError) {
        console.error('Failed to record deletion transaction:', transactionError);
        // Continue with deletion even if transaction recording fails
      }

      // Delete all related transactions first
      const { error: deleteTransactionsError } = await supabase
        .from('virtual_card_transactions')
        .delete()
        .eq('card_id', cardId)
        .eq('user_id', user.id);

      if (deleteTransactionsError) {
        console.error('Failed to delete card transactions:', deleteTransactionsError);
        return {
          success: false,
          error: 'Failed to delete card transactions'
        };
      }

      // Delete the card
      const { error: deleteError } = await supabase
        .from('virtual_cards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Failed to delete card:', deleteError);
        return {
          success: false,
          error: 'Failed to delete virtual card'
        };
      }

      console.log('Virtual card deleted successfully:', cardId);
      return {
        success: true,
        message: 'Virtual card deleted successfully'
      };

    } catch (error) {
      console.error('Card deletion failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
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
  }): Promise<{ success: boolean; transaction_id?: string; error?: string }> {
    try {
      const validation = await this.validateCard({
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
  static async getCardBalance(cardId: string): Promise<{
    success: boolean;
    daily_limit?: number;
    monthly_limit?: number;
    daily_spent?: number;
    monthly_spent?: number;
    daily_remaining?: number;
    monthly_remaining?: number;
    error?: string;
  }> {
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

  // Enhanced method to get detailed card status
  static async getCardStatus(cardId: string): Promise<{
    success: boolean;
    card?: VirtualCard;
    validation_attempts_today?: number;
    last_validation?: string;
    error?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: cardData, error: cardError } = await supabase
        .from('virtual_cards')
        .select('*')
        .eq('id', cardId)
        .eq('user_id', user.id)
        .single();

      if (cardError) throw cardError;
      if (!cardData) return { success: false, error: 'Card not found' };

      const today = new Date().toISOString().split('T')[0];
      const { data: validationData, error: validationError } = await supabase
        .from('card_validation_attempts')
        .select('created_at, success')
        .gte('created_at', today)
        .order('created_at', { ascending: false })
        .limit(1);

      return {
        success: true,
        card: {
          ...cardData,
          status: cardData.status as 'active' | 'inactive' | 'blocked' | 'expired',
          card_type: cardData.card_type as 'virtual' | 'physical',
          metadata: typeof cardData.metadata === 'object' ? cardData.metadata as Record<string, any> : {},
          daily_limit: Number(cardData.daily_limit),
          monthly_limit: Number(cardData.monthly_limit),
          current_daily_spent: Number(cardData.current_daily_spent),
          current_monthly_spent: Number(cardData.current_monthly_spent)
        },
        validation_attempts_today: validationData?.length || 0,
        last_validation: validationData?.[0]?.created_at
      };
    } catch (error) {
      console.error('Failed to get card status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
