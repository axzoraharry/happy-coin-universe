
import { supabase } from '@/integrations/supabase/client';

export interface SecureCardDetails {
  success: boolean;
  card_number?: string;
  cvv?: string;
  cardholder_name?: string;
  expires_at?: string;
  error?: string;
  pin_required?: boolean;
}

export interface CardActionLog {
  success: boolean;
  error?: string;
}

export class SecureCardService {
  // Get secure card details with PIN verification
  static async getSecureCardDetails(
    cardId: string, 
    pin: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SecureCardDetails> {
    try {
      const { data, error } = await supabase.rpc('get_card_secure_details', {
        p_card_id: cardId,
        p_user_pin: pin,
        p_ip_address: ipAddress || this.getClientIP(),
        p_user_agent: userAgent || navigator.userAgent
      });

      if (error) {
        console.error('Error getting secure card details:', error);
        throw error;
      }

      // Properly type the response from the RPC function
      return data as unknown as SecureCardDetails;
    } catch (error) {
      console.error('Failed to get secure card details:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Log card action for audit trail
  static async logCardAction(
    cardId: string,
    actionType: 'view_details' | 'copy_number' | 'copy_cvv' | 'status_change' | 'delete',
    ipAddress?: string,
    userAgent?: string
  ): Promise<CardActionLog> {
    try {
      const { data, error } = await supabase.rpc('log_card_action', {
        p_card_id: cardId,
        p_action_type: actionType,
        p_ip_address: ipAddress || this.getClientIP(),
        p_user_agent: userAgent || navigator.userAgent
      });

      if (error) {
        console.error('Error logging card action:', error);
        throw error;
      }

      return { success: data === true };
    } catch (error) {
      console.error('Failed to log card action:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get client IP address (simplified version)
  private static getClientIP(): string {
    // In a real application, you'd get this from headers or a service
    return 'client-ip';
  }

  // Copy to clipboard with audit logging
  static async copyToClipboardSecure(
    text: string,
    label: string,
    cardId: string,
    actionType: 'copy_number' | 'copy_cvv'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await navigator.clipboard.writeText(text);
      
      // Log the copy action
      await this.logCardAction(cardId, actionType);
      
      return { success: true };
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      return {
        success: false,
        error: 'Unable to copy to clipboard'
      };
    }
  }
}
