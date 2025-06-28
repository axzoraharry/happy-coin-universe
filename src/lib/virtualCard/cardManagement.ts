
import { supabase } from '@/integrations/supabase/client';
import { VirtualCard, CardIssuanceResult, CardStatusUpdateResult, CardDeleteResult } from './types';

export class CardManagementService {
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
  static async deleteVirtualCard(cardId: string): Promise<CardDeleteResult> {
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
}
