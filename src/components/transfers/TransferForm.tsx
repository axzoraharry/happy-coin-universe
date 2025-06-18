
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, ArrowLeftRight } from 'lucide-react';

export function TransferForm() {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientEmail || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all required fields with valid values",
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
        .select('id, email')
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

      if (recipientProfile.id === user.id) {
        toast({
          title: "Invalid Transfer",
          description: "You cannot transfer Happy Coins to yourself",
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
      const senderBalance = parseFloat(senderWallet.balance.toString());

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
            description: description || `Transfer to ${recipientEmail}`,
            recipient_id: recipientProfile.id,
            reference_id: referenceId,
            status: 'completed'
          },
          {
            wallet_id: recipientWallet.id,
            user_id: recipientProfile.id,
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

      toast({
        title: "Transfer Successful",
        description: `${amount} HC sent to ${recipientEmail}`,
      });

      // Reset form
      setRecipientEmail('');
      setAmount('');
      setDescription('');
      
      // Refresh page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast({
        title: "Transfer Failed",
        description: error.message || "An error occurred during the transfer",
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
          <ArrowLeftRight className="h-5 w-5" />
          <span>Send Happy Coins</span>
        </CardTitle>
        <CardDescription>Transfer Happy Coins to another user</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Email</Label>
            <Input
              id="recipient"
              type="email"
              placeholder="recipient@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (Happy Coins)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What's this transfer for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Processing Transfer...' : 'Send Happy Coins'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
