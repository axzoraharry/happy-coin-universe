
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Minus } from 'lucide-react';

export function WalletActions() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTransaction = async (type: 'deposit' | 'withdraw') => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in",
          variant: "destructive",
        });
        return;
      }

      const transactionAmount = parseFloat(amount);
      if (isNaN(transactionAmount) || transactionAmount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }

      // Get user's wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (walletError || !wallet) {
        toast({
          title: "Error",
          description: "Could not find your wallet",
          variant: "destructive",
        });
        return;
      }

      // Check balance for withdrawals
      if (type === 'withdraw' && wallet.balance < transactionAmount) {
        toast({
          title: "Error",
          description: "Insufficient balance",
          variant: "destructive",
        });
        return;
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          wallet_id: wallet.id,
          user_id: user.id,
          amount: transactionAmount,
          transaction_type: type === 'deposit' ? 'credit' : 'debit',
          description: type === 'deposit' ? 'Wallet deposit' : 'Wallet withdrawal',
          status: 'completed'
        });

      if (transactionError) throw transactionError;

      // Update wallet balance
      const newBalance = type === 'deposit' 
        ? wallet.balance + transactionAmount 
        : wallet.balance - transactionAmount;

      const { error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      // Send notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: type === 'deposit' ? 'Deposit Successful' : 'Withdrawal Successful',
          message: `$${transactionAmount.toFixed(2)} ${type === 'deposit' ? 'added to' : 'withdrawn from'} your wallet`,
          type: 'transaction'
        });

      toast({
        title: "Success",
        description: `Successfully ${type === 'deposit' ? 'deposited' : 'withdrew'} $${transactionAmount.toFixed(2)}`,
      });

      setAmount('');
    } catch (error: any) {
      console.error('Transaction error:', error);
      toast({
        title: "Error",
        description: `Failed to ${type} money`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-green-600" />
            <span>Deposit</span>
          </CardTitle>
          <CardDescription>Add money to your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Amount ($)</Label>
              <Input
                id="deposit-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <Button 
              onClick={() => handleTransaction('deposit')} 
              className="w-full"
              disabled={loading || !amount}
            >
              {loading ? 'Processing...' : 'Deposit'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Minus className="h-5 w-5 text-red-600" />
            <span>Withdraw</span>
          </CardTitle>
          <CardDescription>Withdraw money from your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount ($)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <Button 
              onClick={() => handleTransaction('withdraw')} 
              className="w-full"
              variant="outline"
              disabled={loading || !amount}
            >
              {loading ? 'Processing...' : 'Withdraw'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
