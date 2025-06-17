
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Coins } from 'lucide-react';
import { AccountStatusGuard } from '../common/AccountStatusGuard';
import { useAccountStatus } from '@/hooks/useAccountStatus';

export function PurchaseCoins() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isActive, showDeactivatedAccountError } = useAccountStatus();

  const predefinedAmounts = [1, 5, 10, 25, 50, 100]; // Changed to smaller values for INR

  const handlePurchase = async (purchaseAmount: number) => {
    if (!isActive) {
      showDeactivatedAccountError();
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { amount: purchaseAmount }
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: error.message || "An error occurred during the purchase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCustomAmount = () => {
    if (!isActive) {
      showDeactivatedAccountError();
      return;
    }

    const customAmount = parseFloat(amount);
    if (!customAmount || customAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    handlePurchase(customAmount);
  };

  return (
    <AccountStatusGuard>
      <Card className="backdrop-blur-sm bg-gradient-to-r from-card/80 to-card/60 border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Purchase Happy Coins</span>
          </CardTitle>
          <CardDescription>
            Buy Happy Coins securely with Stripe. 1000 INR = 1 Happy Coin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-medium mb-3 block">Quick Purchase</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {predefinedAmounts.map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  onClick={() => handlePurchase(amt)}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 h-12"
                >
                  <Coins className="h-4 w-4" />
                  <span>{amt} HC</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="custom-amount" className="text-sm font-medium">
              Custom Amount (HC)
            </Label>
            <div className="flex space-x-2">
              <Input
                id="custom-amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="1"
                className="flex-1"
              />
              <Button 
                onClick={handleCustomAmount}
                disabled={loading || !amount}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Buy
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <p>• Secure payment processing by Stripe</p>
            <p>• Instant delivery to your wallet</p>
            <p>• 1000 INR = 1 Happy Coin</p>
          </div>
        </CardContent>
      </Card>
    </AccountStatusGuard>
  );
}
