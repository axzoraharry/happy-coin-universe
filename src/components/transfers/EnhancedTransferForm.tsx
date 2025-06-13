
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeftRight } from 'lucide-react';
import { RecipientSearch } from './RecipientSearch';
import { TransferAmountInput } from './TransferAmountInput';
import { SecurePinInput } from '../wallet/SecurePinInput';
import { AccountStatusGuard } from '../common/AccountStatusGuard';
import { useSecureTransfer } from '@/hooks/useSecureTransfer';

interface RecipientInfo {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
}

export function EnhancedTransferForm() {
  const [recipient, setRecipient] = useState<RecipientInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  const {
    loading,
    showPinInput,
    pendingTransfer,
    initiateTransfer,
    executeTransfer,
    cancelTransfer
  } = useSecureTransfer();

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient) return;
    
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    // Initiate secure transfer (this will show PIN input)
    initiateTransfer({
      recipientId: recipient.id,
      amount,
      description: description || `Transfer to ${recipient.email}`
    });
  };

  const handlePinSubmit = async (pin: string) => {
    const success = await executeTransfer(pin);
    
    if (success) {
      // Reset form
      setRecipient(null);
      setAmount('');
      setDescription('');
      
      // Refresh page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  // Show PIN input overlay when needed
  if (showPinInput && pendingTransfer) {
    return (
      <AccountStatusGuard>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ArrowLeftRight className="h-5 w-5" />
              <span>Confirm Transfer</span>
            </CardTitle>
            <CardDescription>
              Transferring {pendingTransfer.amount} HC to {recipient?.full_name || recipient?.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SecurePinInput
              onPinEntered={handlePinSubmit}
              onCancel={cancelTransfer}
              isVerifying={loading}
              title="Confirm Transfer"
              description="Enter your PIN to securely complete this transfer"
            />
          </CardContent>
        </Card>
      </AccountStatusGuard>
    );
  }

  return (
    <AccountStatusGuard>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowLeftRight className="h-5 w-5" />
            <span>Send Happy Coins</span>
          </CardTitle>
          <CardDescription>Transfer Happy Coins securely with PIN verification</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTransfer} className="space-y-6">
            <RecipientSearch
              onRecipientFound={setRecipient}
              onRecipientCleared={() => setRecipient(null)}
              recipient={recipient}
            />

            <TransferAmountInput
              amount={amount}
              description={description}
              onAmountChange={setAmount}
              onDescriptionChange={setDescription}
            />

            <Button 
              type="submit" 
              disabled={loading || !recipient} 
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Processing Transfer...' : 'Send Happy Coins Securely'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AccountStatusGuard>
  );
}
