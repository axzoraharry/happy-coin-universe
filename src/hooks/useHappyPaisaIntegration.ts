
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { happyPaisaApi, type HappyPaisaBalance, type HappyPaisaTransaction } from '@/lib/happyPaisaApi';
import { useToast } from '@/hooks/use-toast';

export function useHappyPaisaIntegration() {
  const [balance, setBalance] = useState<HappyPaisaBalance | null>(null);
  const [transactions, setTransactions] = useState<HappyPaisaTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [isServiceAvailable, setIsServiceAvailable] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkServiceHealth();
    fetchUserData();
  }, []);

  const checkServiceHealth = async () => {
    try {
      await happyPaisaApi.healthCheck();
      setIsServiceAvailable(true);
    } catch (error) {
      console.warn('Happy Paisa Ledger service unavailable:', error);
      setIsServiceAvailable(false);
      // Quietly degrade without spamming a destructive toast; UI will offer fallback flows

    }
  };

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isServiceAvailable) return;

      setLoading(true);

      // Ensure wallet exists
      await happyPaisaApi.createWallet(user.id);

      // Fetch balance and transactions
      const [balanceData, transactionsData] = await Promise.all([
        happyPaisaApi.getBalance(user.id),
        happyPaisaApi.getTransactions(user.id, 10)
      ]);

      setBalance(balanceData);
      setTransactions(transactionsData);

      // Sync balance with Supabase wallet
      await syncWithSupabaseWallet(user.id, balanceData.balance);
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch wallet data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncWithSupabaseWallet = async (userId: string, ledgerBalance: number) => {
    try {
      // Update Supabase wallet to match ledger balance
      const { error } = await supabase
        .from('wallets')
        .upsert({
          user_id: userId,
          balance: ledgerBalance,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error syncing with Supabase wallet:', error);
    }
  };

  const transferFunds = async (recipientEmail: string, amount: number, description?: string) => {
    if (!isServiceAvailable) {
      toast({
        title: "Service Unavailable",
        description: "Happy Paisa Ledger service is currently unavailable",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Find recipient
      const { data: recipientProfile, error: recipientError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', recipientEmail)
        .single();

      if (recipientError || !recipientProfile) {
        toast({
          title: "Recipient Not Found",
          description: "No user found with that email address",
          variant: "destructive",
        });
        return false;
      }

      // Ensure recipient has a wallet
      await happyPaisaApi.createWallet(recipientProfile.id);

      // Perform transfer via Happy Paisa Ledger
      const result = await happyPaisaApi.transfer({
        from_user_id: user.id,
        to_user_id: recipientProfile.id,
        amount,
        description: description || `Transfer to ${recipientEmail}`,
        reference_id: `TXN-${Date.now()}`
      });

      if (result.success) {
        toast({
          title: "Transfer Successful",
          description: `${amount} HC sent to ${recipientEmail}`,
        });

        // Refresh data
        await fetchUserData();

        // Create notifications in Supabase
        await supabase
          .from('notifications')
          .insert([
            {
              user_id: user.id,
              title: 'Transfer Sent',
              message: `${amount} HC sent to ${recipientEmail}`,
              type: 'transaction'
            },
            {
              user_id: recipientProfile.id,
              title: 'Transfer Received',
              message: `${amount} HC received from ${user.email}`,
              type: 'transaction'
            }
          ]);

        return true;
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast({
        title: "Transfer Failed",
        description: error.message || "An error occurred during the transfer",
        variant: "destructive",
      });
      return false;
    }
  };

  const addFunds = async (amount: number, source: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fallback: If ledger service is unavailable, use Stripe Checkout via Supabase
      if (!isServiceAvailable) {
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: { amount, paymentMethod: 'card' },
        });
        if (error) throw error;

        toast({
          title: 'Redirecting to Checkout',
          description: `Buying ${amount} HC via Stripe`,
        });
        if (data?.url) {
          window.open(data.url, '_blank');
          return true;
        }
        throw new Error('Failed to get checkout URL');
      }

      // Primary path: Use Happy Paisa Ledger when available
      const result = await happyPaisaApi.addFunds({
        user_id: user.id,
        amount,
        source,
        reference_id: `ADD-${Date.now()}`
      });

      if (result.success) {
        toast({
          title: 'Funds Added',
          description: `${amount} HC added to your wallet`,
        });
        await fetchUserData();
        return true;
      }
      throw new Error(result.message);
    } catch (error: any) {
      console.error('Add funds error:', error);
      toast({
        title: 'Failed to Add Funds',
        description: error.message || 'An error occurred while adding funds',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    balance,
    transactions,
    loading,
    isServiceAvailable,
    transferFunds,
    addFunds,
    refreshData: fetchUserData
  };
}
