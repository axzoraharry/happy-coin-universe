import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useHappyPaisaStellar } from '@/hooks/useHappyPaisaStellar';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';

interface HappyPaisaTransferDialogProps {
  children: React.ReactNode;
}

export function HappyPaisaTransferDialog({ children }: HappyPaisaTransferDialogProps) {
  const [open, setOpen] = useState(false);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { sendHP, account, conversionRate } = useHappyPaisaStellar();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!toAddress || !amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (!account || amountNum > account.hp_balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough Happy Paisa for this transfer",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const success = await sendHP({
      toAddress,
      amount: amountNum,
      memo: memo || undefined
    });

    if (success) {
      setOpen(false);
      setToAddress('');
      setAmount('');
      setMemo('');
    }
    setLoading(false);
  };

  const calculateINR = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) return 0;
    return amountNum * conversionRate;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Send Happy Paisa</span>
          </DialogTitle>
          <DialogDescription>
            Send HP instantly to any Stellar address with minimal fees
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="toAddress">Recipient Stellar Address</Label>
            <Input
              id="toAddress"
              placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (HP)</Label>
            <Input
              id="amount"
              type="number"
              step="0.000001"
              min="0"
              placeholder="0.000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {amount && (
              <p className="text-xs text-muted-foreground">
                ≈ ₹{calculateINR().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="memo">Memo (Optional)</Label>
            <Textarea
              id="memo"
              placeholder="Add a note for this transaction..."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              maxLength={28} // Stellar memo text limit
            />
            <p className="text-xs text-muted-foreground">
              {memo.length}/28 characters
            </p>
          </div>

          {account && (
            <div className="bg-muted p-3 rounded-lg space-y-1">
              <p className="text-sm font-medium">Account Summary</p>
              <p className="text-xs text-muted-foreground">
                Available Balance: {account.hp_balance.toFixed(6)} HP
              </p>
              <p className="text-xs text-muted-foreground">
                Network Fee: ~0.000001 HP
              </p>
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !account}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send HP
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}