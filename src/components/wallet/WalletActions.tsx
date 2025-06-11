
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, MinusCircle, Send } from 'lucide-react';

export function WalletActions() {
  const [amount, setAmount] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user's wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError) throw walletError;

      // Update wallet balance
      const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      // Create transaction record
      await supabase
        .from('transactions')
        .insert({
          wallet_id: wallet.id,
          user_id: user.id,
          transaction_type: 'credit',
          amount: parseFloat(amount),
          description: 'Wallet deposit',
          status: 'completed'
        });

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Deposit Successful',
          message: `$${amount} has been added to your wallet`,
          type: 'success'
        });

      toast({
        title: "Deposit Successful",
        description: `$${amount} has been added to your wallet`,
      });

      setAmount('');
      window.location.reload(); // Refresh to show updated balance
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast({
        title: "Deposit Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user's wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError) throw walletError;

      const currentBalance = parseFloat(wallet.balance);
      const withdrawAmount = parseFloat(amount);

      if (withdrawAmount > currentBalance) {
        toast({
          title: "Insufficient Funds",
          description: "You don't have enough balance for this withdrawal",
          variant: "destructive",
        });
        return;
      }

      // Update wallet balance
      const newBalance = currentBalance - withdrawAmount;
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      // Create transaction record
      await supabase
        .from('transactions')
        .insert({
          wallet_id: wallet.id,
          user_id: user.id,
          transaction_type: 'debit',
          amount: withdrawAmount,
          description: 'Wallet withdrawal',
          status: 'completed'
        });

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Withdrawal Successful',
          message: `$${amount} has been withdrawn from your wallet`,
          type: 'success'
        });

      toast({
        title: "Withdrawal Successful",
        description: `$${amount} has been withdrawn from your wallet`,
      });

      setAmount('');
      window.location.reload(); // Refresh to show updated balance
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast({
        title: "Withdrawal Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!amount || parseFloat(amount) <= 0 || !recipientEmail) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid amount and recipient email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Find recipient user
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
        return;
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
        .eq('user_id', recipientProfile.id)
        .single();

      if (recipientWalletError) throw recipientWalletError;

      const transferAmount = parseFloat(amount);
      const senderBalance = parseFloat(senderWallet.balance);

      if (transferAmount > senderBalance) {
        toast({
          title: "Insufficient Funds",
          description: "You don't have enough balance for this transfer",
          variant: "destructive",
        });
        return;
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
      const recipientBalance = parseFloat(recipientWallet.balance);
      await supabase
        .from('wallets')
        .update({ 
          balance: recipientBalance + transferAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', recipientWallet.id);

      // Create transaction records
      await supabase
        .from('transactions')
        .insert([
          {
            wallet_id: senderWallet.id,
            user_id: user.id,
            transaction_type: 'transfer_out',
            amount: transferAmount,
            description: `Transfer to ${recipientEmail}`,
            recipient_id: recipientProfile.id,
            status: 'completed'
          },
          {
            wallet_id: recipientWallet.id,
            user_id: recipientProfile.id,
            transaction_type: 'transfer_in',
            amount: transferAmount,
            description: `Transfer from ${user.email}`,
            recipient_id: user.id,
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
            message: `$${amount} sent to ${recipientEmail}`,
            type: 'success'
          },
          {
            user_id: recipientProfile.id,
            title: 'Transfer Received',
            message: `$${amount} received from ${user.email}`,
            type: 'success'
          }
        ]);

      toast({
        title: "Transfer Successful",
        description: `$${amount} sent to ${recipientEmail}`,
      });

      setAmount('');
      setRecipientEmail('');
      window.location.reload(); // Refresh to show updated balance
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast({
        title: "Transfer Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Actions</CardTitle>
        <CardDescription>Manage your wallet funds</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="deposit" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="transfer">Transfer</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Amount</Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <Button onClick={handleDeposit} disabled={loading} className="w-full">
              <PlusCircle className="h-4 w-4 mr-2" />
              {loading ? 'Processing...' : 'Deposit'}
            </Button>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <Button onClick={handleWithdraw} disabled={loading} className="w-full">
              <MinusCircle className="h-4 w-4 mr-2" />
              {loading ? 'Processing...' : 'Withdraw'}
            </Button>
          </TabsContent>

          <TabsContent value="transfer" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient-email">Recipient Email</Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="recipient@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-amount">Amount</Label>
              <Input
                id="transfer-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <Button onClick={handleTransfer} disabled={loading} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Processing...' : 'Transfer'}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
