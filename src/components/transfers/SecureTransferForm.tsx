
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Send, Shield, AlertTriangle } from 'lucide-react';
import { useTransferProcessing } from '@/hooks/useTransferProcessing';
import { supabase } from '@/integrations/supabase/client';
import { SecurePinInput } from '../wallet/SecurePinInput';

interface RecipientInfo {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
}

export function SecureTransferForm() {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState<RecipientInfo | null>(null);
  const [showPinInput, setShowPinInput] = useState(false);
  const [searchingRecipient, setSearchingRecipient] = useState(false);
  const { processTransfer, loading } = useTransferProcessing();
  const { toast } = useToast();

  const searchRecipient = async () => {
    if (!recipientEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter a recipient email address",
        variant: "destructive",
      });
      return;
    }

    setSearchingRecipient(true);
    try {
      const { data: recipientProfile, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone')
        .eq('email', recipientEmail.trim())
        .eq('is_active', true)
        .single();

      if (error || !recipientProfile) {
        toast({
          title: "Recipient Not Found",
          description: "No active user found with that email address",
          variant: "destructive",
        });
        setRecipient(null);
        return;
      }

      // Check if trying to send to self
      const { data: { user } } = await supabase.auth.getUser();
      if (user && recipientProfile.id === user.id) {
        toast({
          title: "Invalid Recipient",
          description: "You cannot transfer Happy Coins to yourself",
          variant: "destructive",
        });
        setRecipient(null);
        return;
      }

      setRecipient(recipientProfile);
      toast({
        title: "Recipient Found",
        description: `Ready to send to ${recipientProfile.full_name || recipientProfile.email}`,
      });
    } catch (error: any) {
      console.error('Error searching recipient:', error);
      toast({
        title: "Search Failed",
        description: "Failed to search for recipient",
        variant: "destructive",
      });
      setRecipient(null);
    } finally {
      setSearchingRecipient(false);
    }
  };

  const handleTransfer = async (pin?: string) => {
    if (!recipient) {
      toast({
        title: "No Recipient Selected",
        description: "Please search and select a recipient first",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid transfer amount",
        variant: "destructive",
      });
      return;
    }

    const success = await processTransfer(recipient, amount, description, pin);
    
    if (success) {
      // Reset form on success
      setRecipientEmail('');
      setAmount('');
      setDescription('');
      setRecipient(null);
      setShowPinInput(false);
      
      // Refresh page to show updated balance
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handlePinSubmit = (pin: string) => {
    handleTransfer(pin);
  };

  const handlePinCancel = () => {
    setShowPinInput(false);
  };

  const initiateTransfer = () => {
    setShowPinInput(true);
  };

  if (showPinInput) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Secure Transfer Verification</span>
          </CardTitle>
          <CardDescription>
            Enter your 4-digit PIN to authorize the transfer of {amount} HC to {recipient?.full_name || recipient?.email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SecurePinInput
            onPinEntered={handlePinSubmit}
            onCancel={handlePinCancel}
            isVerifying={loading}
            title="Authorize Transfer"
            description={`Confirm transfer of ${amount} HC to ${recipient?.email}`}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Send className="h-5 w-5" />
          <span>Secure Happy Coins Transfer</span>
          <Shield className="h-4 w-4 text-green-600" />
        </CardTitle>
        <CardDescription>
          Transfer Happy Coins securely with PIN verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); initiateTransfer(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Email</Label>
            <div className="flex space-x-2">
              <Input
                id="recipient"
                type="email"
                placeholder="recipient@example.com"
                value={recipientEmail}
                onChange={(e) => {
                  setRecipientEmail(e.target.value);
                  setRecipient(null); // Clear recipient when email changes
                }}
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={searchRecipient}
                disabled={searchingRecipient}
              >
                {searchingRecipient ? 'Searching...' : 'Search'}
              </Button>
            </div>
            {recipient && (
              <div className="text-sm text-green-600 flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                Recipient verified: {recipient.full_name || recipient.email}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (Happy Coins)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
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
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Security Features:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>PIN verification required for all transfers</li>
                  <li>Recipient verification before transfer</li>
                  <li>Daily transfer limits apply</li>
                  <li>Real-time balance validation</li>
                </ul>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading || !recipient || !amount} 
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Processing...' : 'Continue to PIN Verification'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
