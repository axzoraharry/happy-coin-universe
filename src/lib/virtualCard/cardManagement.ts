
import { supabase } from '@/integrations/supabase/client';
import { VirtualCard, CardIssuanceResult, CardStatusUpdateResult, CardDeleteResult } from './types';
import { SecureCardService } from './secureCardService';

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
        current_monthly_spent: Number(card.current_monthly_spent),
        // Include the new masked_card_number field
        masked_card_number: card.masked_card_number
      }));
    } catch (error) {
      console.error('Failed to fetch user cards:', error);
      throw error;
    }
  }

  // Update card status with audit logging
  static async updateCardStatus(
    cardId: string, 
    newStatus: 'active' | 'inactive' | 'blocked' | 'expired'
  ): Promise<CardStatusUpdateResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Log the status change action
      await SecureCardService.logCardAction(cardId, 'status_change');

      const { data, error } = await supabase.rpc('update_card_status', {
        p_user_id: user.id,
        p_card_id: cardId,
        p_new_status: newStatus
      });

      if (error) throw error;
      
      const result = data as unknown as CardStatusUpdateResult;
      return result;
    } catch (error) {
      console.error('Failed to update card status:', error);
      throw error;
    }
  }

  // Delete/Remove a virtual card with improved error handling and transaction management
  static async deleteVirtualCard(cardId: string): Promise<CardDeleteResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Attempting to delete virtual card:', cardId, 'for user:', user.id);

      // First verify the card exists and belongs to the user
      const { data: cardExists, error: checkError } = await supabase
        .from('virtual_cards')
        .select('id, status')
        .eq('id', cardId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking card existence:', checkError);
        return {
          success: false,
          error: 'Failed to verify card: ' + checkError.message
        };
      }

      if (!cardExists) {
        console.warn('Card not found or does not belong to user:', cardId);
        return {
          success: false,
          error: 'Card not found or you do not have permission to delete it'
        };
      }

      // Log the deletion attempt
      await SecureCardService.logCardAction(cardId, 'delete');

      // Use a transaction to ensure all related data is deleted properly
      const { error: transactionError } = await supabase
        .rpc('delete_virtual_card_with_related_data', {
          p_card_id: cardId,
          p_user_id: user.id
        });

      if (transactionError) {
        console.error('Transaction deletion failed:', transactionError);
        
        // Fallback to manual deletion if the RPC function doesn't exist
        console.log('Attempting manual deletion as fallback...');
        
        // Delete related records first
        const { error: deleteTransactionsError } = await supabase
          .from('virtual_card_transactions')
          .delete()
          .eq('card_id', cardId)
          .eq('user_id', user.id);

        if (deleteTransactionsError) {
          console.error('Failed to delete card transactions:', deleteTransactionsError);
        }

        const { error: deleteLogsError } = await supabase
          .from('card_access_logs')
          .delete()
          .eq('card_id', cardId)
          .eq('user_id', user.id);

        if (deleteLogsError) {
          console.error('Failed to delete card access logs:', deleteLogsError);
        }

        // Finally delete the card
        const { error: deleteCardError } = await supabase
          .from('virtual_cards')
          .delete()
          .eq('id', cardId)
          .eq('user_id', user.id);

        if (deleteCardError) {
          console.error('Failed to delete card:', deleteCardError);
          return {
            success: false,
            error: 'Failed to delete virtual card: ' + deleteCardError.message
          };
        }
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
