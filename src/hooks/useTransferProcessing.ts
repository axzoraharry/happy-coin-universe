
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
  sender_new_balance?: number;
  recipient_new_balance?: number;
  reference_id?: string;
}

export function useTransferProcessing() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const processTransfer = async (
    recipient: RecipientInfo,
    amount: string,
    description: string
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

      console.log('Processing transfer from user:', user.id, 'to recipient:', recipient.id);

      if (recipient.id === user.id) {
        toast({
          title: "Invalid Transfer",
          description: "You cannot transfer money to yourself",
          variant: "destructive",
        });
        return false;
      }

      const transferAmount = parseFloat(amount);

      // Call the database function to process the transfer atomically
      const { data: rawResult, error: transferError } = await supabase.rpc('process_wallet_transfer', {
        sender_id: user.id,
        recipient_id: recipient.id,
        transfer_amount: transferAmount,
        transfer_description: description || `Transfer to ${recipient.email}`
      });

      if (transferError) {
        console.error('Transfer error:', transferError);
        throw transferError;
      }

      // Type-safe handling of the result
      const result = rawResult as TransferResult;

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
            title: 'Transfer Sent',
            message: `${amount} HC sent to ${recipient.full_name || recipient.email}`,
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
        // Don't fail the transfer if notifications fail
      }

      toast({
        title: "Transfer Successful",
        description: `${amount} HC sent to ${recipient.full_name || recipient.email}`,
      });

      // Refresh page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);

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
