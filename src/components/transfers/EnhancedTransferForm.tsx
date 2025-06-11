
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, ArrowLeftRight, Search, User } from 'lucide-react';

interface RecipientInfo {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
}

export function EnhancedTransferForm() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recipient, setRecipient] = useState<RecipientInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();

  const searchRecipient = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter an email or phone number to search",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    try {
      // Search by email first
      let query = supabase
        .from('profiles')
        .select('id, email, full_name, phone');

      // Check if it's an email or phone
      if (searchQuery.includes('@')) {
        query = query.eq('email', searchQuery);
      } else {
        query = query.eq('phone', searchQuery);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        toast({
          title: "Recipient Not Found",
          description: "No user found with that email or phone number",
          variant: "destructive",
        });
        setRecipient(null);
        return;
      }

      setRecipient(data);
      toast({
        title: "Recipient Found",
        description: `Found user: ${data.full_name || data.email}`,
      });
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "An error occurred while searching for the recipient",
        variant: "destructive",
      });
      setRecipient(null);
    } finally {
      setSearching(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient) {
      toast({
        title: "No Recipient",
        description: "Please search and select a recipient first",
        variant: "destructive",
      });
      return;
    }

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

      if (recipient.id === user.id) {
        toast({
          title: "Invalid Transfer",
          description: "You cannot transfer money to yourself",
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

      // Reset form
      setSearchQuery('');
      setRecipient(null);
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
        <CardDescription>Transfer Happy Coins to another user by email or phone</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleTransfer} className="space-y-6">
          {/* Recipient Search */}
          <div className="space-y-3">
            <Label htmlFor="search">Find Recipient</Label>
            <div className="flex space-x-2">
              <Input
                id="search"
                type="text"
                placeholder="Enter email or phone number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button 
                type="button"
                onClick={searchRecipient}
                disabled={searching}
                variant="outline"
              >
                <Search className="h-4 w-4 mr-2" />
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          {/* Recipient Display */}
          {recipient && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">
                    {recipient.full_name || 'User'}
                  </p>
                  <p className="text-sm text-green-600">
                    {recipient.email}
                    {recipient.phone && ` • ${recipient.phone}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (HC)</Label>
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

          {/* Description */}
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

          <Button 
            type="submit" 
            disabled={loading || !recipient} 
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Processing Transfer...' : 'Send Happy Coins'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
