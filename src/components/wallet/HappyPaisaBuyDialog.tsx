import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHappyPaisaStellar } from '@/hooks/useHappyPaisaStellar';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Loader2, CreditCard } from 'lucide-react';

interface HappyPaisaBuyDialogProps {
  children: React.ReactNode;
}

export function HappyPaisaBuyDialog({ children }: HappyPaisaBuyDialogProps) {
  const [open, setOpen] = useState(false);
  const [inrAmount, setInrAmount] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { buyHP, conversionRate } = useHappyPaisaStellar();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inrAmount) {
      toast({
        title: "Validation Error",
        description: "Please enter an amount",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(inrAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (amountNum < 100) {
      toast({
        title: "Minimum Amount",
        description: "Minimum purchase amount is ₹100",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const success = await buyHP(amountNum);

    if (success) {
      setOpen(false);
      setInrAmount('');
    }
    setLoading(false);
  };

  const calculateHP = () => {
    const amountNum = parseFloat(inrAmount);
    if (isNaN(amountNum)) return 0;
    return amountNum / conversionRate;
  };

  const presetAmounts = [500, 1000, 5000, 10000];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Buy Happy Paisa</span>
          </DialogTitle>
          <DialogDescription>
            Purchase HP using INR at the fixed rate of ₹{conversionRate.toLocaleString()} per HP
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inrAmount">Amount (INR)</Label>
            <Input
              id="inrAmount"
              type="number"
              min="100"
              placeholder="1000"
              value={inrAmount}
              onChange={(e) => setInrAmount(e.target.value)}
            />
            {inrAmount && (
              <p className="text-xs text-muted-foreground">
                You will receive: {calculateHP().toFixed(6)} HP
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="grid grid-cols-2 gap-2">
              {presetAmounts.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInrAmount(amount.toString())}
                  className="text-xs"
                >
                  ₹{amount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg space-y-1 border border-blue-200">
            <p className="text-sm font-medium text-blue-800">Exchange Rate</p>
            <p className="text-xs text-blue-600">
              1 HP = ₹{conversionRate.toLocaleString()} (Fixed Peg)
            </p>
            <p className="text-xs text-blue-600">
              Network Fee: Minimal Stellar network fee
            </p>
          </div>

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
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Buy HP
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}