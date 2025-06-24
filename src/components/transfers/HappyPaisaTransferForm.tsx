
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send, ArrowLeftRight, Wallet } from 'lucide-react';
import { useHappyPaisaIntegration } from '@/hooks/useHappyPaisaIntegration';

export function HappyPaisaTransferForm() {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { balance, isServiceAvailable, transferFunds } = useHappyPaisaIntegration();

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientEmail || !amount || parseFloat(amount) <= 0) {
      return;
    }

    setLoading(true);
    try {
      const success = await transferFunds(recipientEmail, parseFloat(amount), description);
      if (success) {
        // Reset form
        setRecipientEmail('');
        setAmount('');
        setDescription('');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isServiceAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <Wallet className="h-5 w-5" />
            <span>Service Unavailable</span>
          </CardTitle>
          <CardDescription>
            Happy Paisa Ledger service is currently unavailable. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ArrowLeftRight className="h-5 w-5" />
          <span>Send Happy Coins</span>
        </CardTitle>
        <CardDescription>
          Transfer Happy Coins using the Happy Paisa Ledger service
          {balance && (
            <div className="mt-2 text-sm font-medium text-primary">
              Available Balance: {balance.balance.toFixed(2)} HC
            </div>
          )}
        </CardDescription>
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
              max={balance?.balance || undefined}
              required
            />
            {balance && parseFloat(amount) > balance.balance && (
              <p className="text-sm text-red-600">
                Amount exceeds available balance
              </p>
            )}
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

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <Wallet className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Happy Paisa Ledger Integration:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Powered by secure Go-based ledger service</li>
                  <li>Real-time balance updates</li>
                  <li>Transaction history tracking</li>
                  <li>Automatic wallet creation</li>
                </ul>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading || !isServiceAvailable || (balance && parseFloat(amount) > balance.balance)} 
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
