
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Send, Settings } from 'lucide-react';
import { TransactionPinSetup } from './TransactionPinSetup';

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

      console.log('Searching for recipient with email:', recipientEmail);

      // Enhanced recipient search with better error handling
      let recipientProfile = null;
      
      // First try exact match
      const { data: exactMatch, error: exactError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', recipientEmail)
        .maybeSingle();

      console.log('Exact match result:', exactMatch, exactError);

      if (exactMatch) {
        recipientProfile = exactMatch;
      } else {
        // If no exact match, try case-insensitive search
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name');
        
        console.log('All profiles for case-insensitive search:', allProfiles?.length, allProfilesError);
        
        if (allProfiles && !allProfilesError) {
          const matchingProfile = allProfiles.find(profile => 
            profile.email?.toLowerCase() === recipientEmail.toLowerCase()
          );
          
          console.log('Case-insensitive match found:', matchingProfile);
          
          if (matchingProfile) {
            recipientProfile = matchingProfile;
          }
        }
      }

      if (!recipientProfile) {
        console.log('No recipient found for email:', recipientEmail);
        toast({
          title: "Recipient Not Found",
          description: "No user found with that email address. Make sure the email is correct and the user has registered an account.",
          variant: "destructive",
        });
        return;
      }

      console.log('Found recipient:', recipientProfile);

      if (recipientProfile.id === user.id) {
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
        .eq('user_id', recipientProfile.id)
        .single();

      if (recipientWalletError) {
        console.error('Recipient wallet error:', recipientWalletError);
        toast({
          title: "Recipient Wallet Not Found",
          description: "The recipient doesn't have a wallet set up. They may need to log in first to initialize their account.",
          variant: "destructive",
        });
        return;
      }

      const transferAmount = parseFloat(amount);
      const senderBalance = parseFloat(senderWallet.balance.toString());

      console.log('Transfer amount:', transferAmount, 'Sender balance:', senderBalance);

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
            description: `Transfer to ${recipientEmail}`,
            recipient_id: recipientProfile.id,
            reference_id: referenceId,
            status: 'completed'
          },
          {
            wallet_id: recipientWallet.id,
            user_id: recipientProfile.id,
            transaction_type: 'transfer_in',
            amount: transferAmount,
            description: `Transfer from ${user.email}`,
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
            type: 'success'
          },
          {
            user_id: recipientProfile.id,
            title: 'Transfer Received',
            message: `${amount} HC received from ${user.email}`,
            type: 'success'
          }
        ]);

      toast({
        title: "Transfer Successful",
        description: `${amount} HC sent to ${recipientEmail}`,
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
              <div className="space-y-2">
                <Label htmlFor="recipient-email" className="text-sm font-medium">
                  Recipient Email
                </Label>
                <Input
                  id="recipient-email"
                  type="email"
                  placeholder="recipient@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer-amount" className="text-sm font-medium">
                  Amount (HC)
                </Label>
                <Input
                  id="transfer-amount"
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
                onClick={handleTransfer} 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md transition-all duration-200"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Processing...' : 'Transfer'}
              </Button>
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
