
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, User } from 'lucide-react';

export function TransferForm() {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to transfer money",
          variant: "destructive",
        });
        return;
      }

      const transferAmount = parseFloat(amount);
      if (isNaN(transferAmount) || transferAmount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }

      // Check sender's balance
      const { data: senderWallet, error: walletError } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (walletError || !senderWallet) {
        toast({
          title: "Error",
          description: "Could not find your wallet",
          variant: "destructive",
        });
        return;
      }

      if (senderWallet.balance < transferAmount) {
        toast({
          title: "Error",
          description: "Insufficient balance",
          variant: "destructive",
        });
        return;
      }

      // Find recipient by email
      const { data: recipientProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', recipientEmail)
        .single();

      if (profileError || !recipientProfile) {
        toast({
          title: "Error",
          description: "Recipient not found",
          variant: "destructive",
        });
        return;
      }

      // Get recipient's wallet
      const { data: recipientWallet, error: recipientWalletError } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', recipientProfile.id)
        .eq('is_active', true)
        .single();

      if (recipientWalletError || !recipientWallet) {
        toast({
          title: "Error",
          description: "Recipient wallet not found",
          variant: "destructive",
        });
        return;
      }

      // Create transfer transactions
      const transferDescription = description || `Transfer to ${recipientEmail}`;
      
      // Debit sender
      const { error: debitError } = await supabase
        .from('transactions')
        .insert({
          wallet_id: senderWallet.id,
          user_id: user.id,
          amount: transferAmount,
          transaction_type: 'transfer_out',
          description: transferDescription,
          recipient_id: recipientProfile.id,
          status: 'completed'
        });

      if (debitError) throw debitError;

      // Credit recipient
      const { error: creditError } = await supabase
        .from('transactions')
        .insert({
          wallet_id: recipientWallet.id,
          user_id: recipientProfile.id,
          amount: transferAmount,
          transaction_type: 'transfer_in',
          description: `Transfer from ${user.email}`,
          status: 'completed'
        });

      if (creditError) throw creditError;

      // Update wallet balances
      const { error: updateSenderError } = await supabase
        .from('wallets')
        .update({ 
          balance: senderWallet.balance - transferAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', senderWallet.id);

      if (updateSenderError) throw updateSenderError;

      const { data: currentRecipientWallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', recipientWallet.id)
        .single();

      if (currentRecipientWallet) {
        const { error: updateRecipientError } = await supabase
          .from('wallets')
          .update({ 
            balance: currentRecipientWallet.balance + transferAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', recipientWallet.id);

        if (updateRecipientError) throw updateRecipientError;
      }

      // Send notification to recipient
      await supabase
        .from('notifications')
        .insert({
          user_id: recipientProfile.id,
          title: 'Money Received',
          message: `You received $${transferAmount.toFixed(2)} from ${user.email}`,
          type: 'transaction'
        });

      toast({
        title: "Transfer Successful",
        description: `Successfully transferred $${transferAmount.toFixed(2)} to ${recipientEmail}`,
      });

      // Reset form
      setRecipientEmail('');
      setAmount('');
      setDescription('');
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast({
        title: "Error",
        description: "Failed to complete transfer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Send className="h-5 w-5" />
          <span>Send Money</span>
        </CardTitle>
        <CardDescription>Transfer money to another user</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Email</Label>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Input
                id="recipient"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Enter recipient's email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this for?"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Processing...' : 'Send Money'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
