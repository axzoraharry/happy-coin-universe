
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RecipientInfo {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
}

interface TransferResult {
  success: boolean;
  error?: string;
  pin_verified?: boolean;
  reference_id?: string;
}

export function useTransferProcessing() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const processTransfer = async (
    recipient: RecipientInfo,
    amount: string,
    description: string,
    pin?: string
  ) => {
    if (!recipient) {
      toast({
        title: "No Recipient",
        description: "Please search and select a recipient first",
        variant: "destructive",
      });
      return false;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Processing secure transfer from user:', user.id, 'to recipient:', recipient.id);

      if (recipient.id === user.id) {
        toast({
          title: "Invalid Transfer",
          description: "You cannot transfer money to yourself",
          variant: "destructive",
        });
        return false;
      }

      const transferAmount = parseFloat(amount);

      // Use the new secure transfer function
      const { data: rawResult, error: transferError } = await supabase.rpc('process_secure_wallet_transfer', {
        sender_id: user.id,
        recipient_id: recipient.id,
        transfer_amount: transferAmount,
        transfer_description: description || `Transfer to ${recipient.email}`,
        sender_pin: pin || null
      });

      if (transferError) {
        console.error('Transfer error:', transferError);
        throw transferError;
      }

      const result = rawResult as unknown as TransferResult;

      if (!result?.success) {
        toast({
          title: "Transfer Failed",
          description: result?.error || "An error occurred during the transfer",
          variant: "destructive",
        });
        return false;
      }

      // Create notifications after successful transfer
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: user.id,
            title: 'Secure Transfer Sent',
            message: `${amount} HC securely sent to ${recipient.full_name || recipient.email}${result.pin_verified ? ' (PIN verified)' : ''}`,
            type: 'transaction'
          },
          {
            user_id: recipient.id,
            title: 'Transfer Received',
            message: `${amount} HC received from ${user.email}`,
            type: 'transaction'
          }
        ]);

      if (notificationError) {
        console.warn('Failed to create notifications:', notificationError);
      }

      toast({
        title: "Transfer Successful",
        description: `${amount} HC securely sent to ${recipient.full_name || recipient.email}`,
      });

      return true;
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast({
        title: "Transfer Failed",
        description: error.message || "An error occurred during the transfer",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { processTransfer, loading };
}
