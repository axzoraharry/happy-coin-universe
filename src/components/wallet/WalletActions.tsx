
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Settings } from 'lucide-react';
import { TransactionPinSetup } from './TransactionPinSetup';
import { EnhancedTransferForm } from '../transfers/EnhancedTransferForm';

export function WalletActions() {
  const [amount, setAmount] = useState('');
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
      const newBalance = parseFloat(wallet.balance.toString()) + parseFloat(amount);
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
          description: 'Happy Coins deposit',
          status: 'completed'
        });

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Deposit Successful',
          message: `${amount} HC has been added to your wallet`,
          type: 'success'
        });

      toast({
        title: "Deposit Successful",
        description: `${amount} HC has been added to your wallet`,
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

  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-sm bg-gradient-to-r from-card/80 to-card/60 border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Wallet Actions
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage your Happy Coins with ease
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="deposit" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="deposit" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Deposit
              </TabsTrigger>
              <TabsTrigger value="transfer" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Transfer
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deposit" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deposit-amount" className="text-sm font-medium">
                  Amount (HC)
                </Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
              </div>
              <Button 
                onClick={handleDeposit} 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md transition-all duration-200"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {loading ? 'Processing...' : 'Deposit'}
              </Button>
            </TabsContent>

            <TabsContent value="transfer" className="space-y-4">
              <EnhancedTransferForm />
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <TransactionPinSetup />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
