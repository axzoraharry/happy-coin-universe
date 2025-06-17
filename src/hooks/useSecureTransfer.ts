
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAccountStatus } from '@/hooks/useAccountStatus';

interface SecureTransferResult {
  success: boolean;
  error?: string;
  pin_verified?: boolean;
  reference_id?: string;
}

const MINIMUM_TRANSFER_AMOUNT = 1; // 1 Happy Coin
const MINIMUM_ACCOUNT_BALANCE = 1; // 1 Happy Coin

export function useSecureTransfer() {
  const [loading, setLoading] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<any>(null);
  const { toast } = useToast();
  const { isActive, showDeactivatedAccountError } = useAccountStatus();

  const initiateTransfer = async (transferData: {
    recipientId: string;
    amount: string;
    description: string;
  }) => {
    if (!isActive) {
      showDeactivatedAccountError();
      return;
    }

    const transferAmount = parseFloat(transferData.amount);

    // Check minimum transfer amount
    if (transferAmount < MINIMUM_TRANSFER_AMOUNT) {
      toast({
        title: "Transfer Amount Too Low",
        description: `Minimum transfer amount is ${MINIMUM_TRANSFER_AMOUNT} HC`,
        variant: "destructive",
      });
      return;
    }

    // Check if user has sufficient balance (including minimum balance requirement)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: wallet, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const currentBalance = parseFloat(wallet.balance.toString());
      const balanceAfterTransfer = currentBalance - transferAmount;

      if (currentBalance < MINIMUM_ACCOUNT_BALANCE) {
        toast({
          title: "Insufficient Balance",
          description: `Your account must have at least ${MINIMUM_ACCOUNT_BALANCE} HC minimum balance`,
          variant: "destructive",
        });
        return;
      }

      if (balanceAfterTransfer < MINIMUM_ACCOUNT_BALANCE) {
        toast({
          title: "Transfer Not Allowed",
          description: `Transfer would leave your account below the minimum balance of ${MINIMUM_ACCOUNT_BALANCE} HC`,
          variant: "destructive",
        });
        return;
      }

      if (currentBalance < transferAmount) {
        toast({
          title: "Insufficient Funds",
          description: "You don't have enough balance for this transfer",
          variant: "destructive",
        });
        return;
      }

      setPendingTransfer(transferData);
      setShowPinInput(true);
    } catch (error: any) {
      console.error('Error checking balance:', error);
      toast({
        title: "Error",
        description: "Failed to verify account balance",
        variant: "destructive",
      });
    }
  };

  const executeTransfer = async (pin: string) => {
    if (!isActive) {
      showDeactivatedAccountError();
      return false;
    }

    if (!pendingTransfer) return false;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: rawResult, error } = await supabase.rpc('process_secure_wallet_transfer' as any, {
        sender_id: user.id,
        recipient_id: pendingTransfer.recipientId,
        transfer_amount: parseFloat(pendingTransfer.amount),
        transfer_description: pendingTransfer.description,
        sender_pin: pin
      });

      if (error) throw error;

      const result = rawResult as unknown as SecureTransferResult;

      if (!result.success) {
        toast({
          title: "Transfer Failed",
          description: result.error || "An error occurred during the transfer",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Transfer Successful",
        description: `Transfer completed successfully. Reference: ${result.reference_id}`,
      });

      // Reset state
      setPendingTransfer(null);
      setShowPinInput(false);
      
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

  const cancelTransfer = () => {
    setPendingTransfer(null);
    setShowPinInput(false);
  };

  return {
    loading,
    showPinInput,
    pendingTransfer,
    initiateTransfer,
    executeTransfer,
    cancelTransfer,
    MINIMUM_TRANSFER_AMOUNT,
    MINIMUM_ACCOUNT_BALANCE
  };
}
