
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RecipientInfo {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
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

      if (recipient.id === user.id) {
        toast({
          title: "Invalid Transfer",
          description: "You cannot transfer money to yourself",
          variant: "destructive",
        });
        return false;
      }

      // Get sender's wallet
      const { data: senderWallet, error: senderWalletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (senderWalletError) throw senderWalletError;

      // Get recipient's wallet
      const { data: recipientWallet, error: recipientWalletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', recipient.id)
        .single();

      if (recipientWalletError) throw recipientWalletError;

      const transferAmount = parseFloat(amount);
      const senderBalance = parseFloat(senderWallet.balance.toString());

      if (transferAmount > senderBalance) {
        toast({
          title: "Insufficient Funds",
          description: "You don't have enough balance for this transfer",
          variant: "destructive",
        });
        return false;
      }

      // Update sender's balance
      await supabase
        .from('wallets')
        .update({ 
          balance: senderBalance - transferAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', senderWallet.id);

      // Update recipient's balance
      const recipientBalance = parseFloat(recipientWallet.balance.toString());
      await supabase
        .from('wallets')
        .update({ 
          balance: recipientBalance + transferAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', recipientWallet.id);

      // Create transaction records
      const referenceId = `TXN-${Date.now()}`;
      await supabase
        .from('transactions')
        .insert([
          {
            wallet_id: senderWallet.id,
            user_id: user.id,
            transaction_type: 'transfer_out',
            amount: transferAmount,
            description: description || `Transfer to ${recipient.email}`,
            recipient_id: recipient.id,
            reference_id: referenceId,
            status: 'completed'
          },
          {
            wallet_id: recipientWallet.id,
            user_id: recipient.id,
            transaction_type: 'transfer_in',
            amount: transferAmount,
            description: description || `Transfer from ${user.email}`,
            recipient_id: user.id,
            reference_id: referenceId,
            status: 'completed'
          }
        ]);

      // Create notifications
      await supabase
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
