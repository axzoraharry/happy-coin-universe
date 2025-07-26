import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import StellarService from '@/lib/stellar/stellarService';

interface HappyPaisaAccount {
  id: string;
  user_id: string;
  stellar_address: string;
  stellar_secret_encrypted: string;
  hp_balance: number;
  inr_equivalent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface HPTransaction {
  id: string;
  user_id: string;
  stellar_transaction_id: string;
  transaction_type: string;
  hp_amount: number;
  inr_amount: number | null;
  fee_hp: number;
  from_address: string | null;
  to_address: string | null;
  memo: string | null;
  status: string;
  stellar_ledger: number | null;
  created_at: string;
}

export function useHappyPaisaStellar() {
  const [account, setAccount] = useState<HappyPaisaAccount | null>(null);
  const [transactions, setTransactions] = useState<HPTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stellarService, setStellarService] = useState<StellarService | null>(null);
  const [conversionRate, setConversionRate] = useState(1000); // 1 HP = 1000 INR
  const { toast } = useToast();

  useEffect(() => {
    initializeService();
    fetchUserAccount();
  }, []);

  const initializeService = async () => {
    try {
      const service = await StellarService.initializeFromSupabase();
      setStellarService(service);
    } catch (error) {
      console.error('Error initializing Stellar service:', error);
      toast({
        title: "Stellar Service Error",
        description: "Failed to initialize Stellar service",
        variant: "destructive",
      });
    }
  };

  const fetchUserAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Check if user has an HP account
      const { data: existingAccount, error: accountError } = await supabase
        .from('happy_paisa_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (accountError && accountError.code !== 'PGRST116') {
        throw accountError;
      }

      if (existingAccount) {
        setAccount(existingAccount);
        await fetchTransactions(user.id);
        if (stellarService) {
          await syncStellarBalance(existingAccount);
        }
      } else {
        // Create new HP account
        await createHPAccount(user.id);
      }
    } catch (error) {
      console.error('Error fetching HP account:', error);
      toast({
        title: "Account Error",
        description: "Failed to fetch Happy Paisa account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createHPAccount = async (userId: string) => {
    if (!stellarService) {
      toast({
        title: "Service Error",
        description: "Stellar service not initialized",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create Stellar keypair
      const { publicKey, secretKey } = await stellarService.createAccount();
      
      // Encrypt the secret key (in production, use proper encryption)
      const encryptedSecret = btoa(secretKey); // Basic encoding, replace with proper encryption
      
      // Create HP account in database
      const { data: newAccount, error } = await supabase
        .from('happy_paisa_accounts')
        .insert({
          user_id: userId,
          stellar_address: publicKey,
          stellar_secret_encrypted: encryptedSecret,
          hp_balance: 0.0,
        })
        .select()
        .single();

      if (error) throw error;

      setAccount(newAccount);
      
      // Establish trustline for HP asset
      try {
        await stellarService.establishTrustline(secretKey);
      } catch (trustlineError) {
        console.log('Trustline establishment skipped (asset not issued yet)');
      }

      toast({
        title: "Account Created",
        description: "Your Happy Paisa account has been created successfully!",
      });
    } catch (error) {
      console.error('Error creating HP account:', error);
      toast({
        title: "Account Creation Failed",
        description: "Failed to create Happy Paisa account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('hp_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching HP transactions:', error);
    }
  };

  const syncStellarBalance = async (hpAccount: HappyPaisaAccount) => {
    if (!stellarService) return;

    try {
      const stellarBalance = await stellarService.getAccountBalance(hpAccount.stellar_address);
      
      if (stellarBalance !== hpAccount.hp_balance) {
        // Update database with Stellar balance
        const { error } = await supabase
          .from('happy_paisa_accounts')
          .update({ 
            hp_balance: stellarBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', hpAccount.id);

        if (!error) {
          setAccount(prev => prev ? { 
            ...prev, 
            hp_balance: stellarBalance,
            inr_equivalent: stellarBalance * conversionRate
          } : null);
        }
      }
    } catch (error) {
      console.error('Error syncing Stellar balance:', error);
    }
  };

  const sendHP = async (params: {
    toAddress: string;
    amount: number;
    memo?: string;
  }) => {
    if (!stellarService || !account) {
      toast({
        title: "Error",
        description: "Service not available",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      
      // Decrypt secret key (implement proper decryption)
      const secretKey = atob(account.stellar_secret_encrypted);
      
      const result = await stellarService.sendPayment({
        fromSecretKey: secretKey,
        toPublicKey: params.toAddress,
        amount: params.amount.toString(),
        memo: params.memo
      });

      // Record transaction in database
      const { error } = await supabase
        .from('hp_transactions')
        .insert({
          user_id: account.user_id,
          stellar_transaction_id: result.transactionId,
          transaction_type: 'send',
          hp_amount: params.amount,
          from_address: account.stellar_address,
          to_address: params.toAddress,
          memo: params.memo,
          status: 'completed',
          stellar_ledger: result.ledger
        });

      if (error) throw error;

      toast({
        title: "Payment Sent",
        description: `Successfully sent ${params.amount} HP`,
      });

      // Refresh account data
      await fetchUserAccount();
      return true;
    } catch (error) {
      console.error('Error sending HP:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to send Happy Paisa",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const buyHP = async (inrAmount: number) => {
    if (!account) {
      toast({
        title: "Error",
        description: "No account found",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      
      const hpAmount = inrAmount / conversionRate;
      
      // In a real implementation, this would integrate with payment gateway
      // For now, we'll simulate the purchase
      
      const { error } = await supabase
        .from('hp_transactions')
        .insert({
          user_id: account.user_id,
          stellar_transaction_id: `buy_${Date.now()}`,
          transaction_type: 'buy_hp',
          hp_amount: hpAmount,
          inr_amount: inrAmount,
          status: 'completed'
        });

      if (error) throw error;

      // Update account balance
      const newBalance = account.hp_balance + hpAmount;
      const { error: updateError } = await supabase
        .from('happy_paisa_accounts')
        .update({ 
          hp_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);

      if (updateError) throw updateError;

      toast({
        title: "Purchase Successful",
        description: `Successfully purchased ${hpAmount} HP for ₹${inrAmount}`,
      });

      await fetchUserAccount();
      return true;
    } catch (error) {
      console.error('Error buying HP:', error);
      toast({
        title: "Purchase Failed",
        description: "Failed to purchase Happy Paisa",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sellHP = async (hpAmount: number) => {
    if (!account || account.hp_balance < hpAmount) {
      toast({
        title: "Insufficient Balance",
        description: "Not enough Happy Paisa to sell",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      
      const inrAmount = hpAmount * conversionRate;
      
      const { error } = await supabase
        .from('hp_transactions')
        .insert({
          user_id: account.user_id,
          stellar_transaction_id: `sell_${Date.now()}`,
          transaction_type: 'sell_hp',
          hp_amount: -hpAmount,
          inr_amount: inrAmount,
          status: 'completed'
        });

      if (error) throw error;

      // Update account balance
      const newBalance = account.hp_balance - hpAmount;
      const { error: updateError } = await supabase
        .from('happy_paisa_accounts')
        .update({ 
          hp_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);

      if (updateError) throw updateError;

      toast({
        title: "Sale Successful",
        description: `Successfully sold ${hpAmount} HP for ₹${inrAmount}`,
      });

      await fetchUserAccount();
      return true;
    } catch (error) {
      console.error('Error selling HP:', error);
      toast({
        title: "Sale Failed",
        description: "Failed to sell Happy Paisa",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchUserAccount();
  };

  return {
    account,
    transactions,
    loading,
    conversionRate,
    sendHP,
    buyHP,
    sellHP,
    refreshData,
    isServiceReady: !!stellarService
  };
}