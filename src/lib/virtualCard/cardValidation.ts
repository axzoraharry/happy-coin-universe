
import { supabase } from '@/integrations/supabase/client';
import { CardValidationResult, VirtualCard, CardStatusResult } from './types';

export class CardValidationService {
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

  // Enhanced method to get detailed card status
  static async getCardStatus(cardId: string): Promise<CardStatusResult> {
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
