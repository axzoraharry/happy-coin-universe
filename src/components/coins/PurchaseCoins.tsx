
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Coins, Smartphone, RefreshCw, AlertCircle } from 'lucide-react';
import { AccountStatusGuard } from '../common/AccountStatusGuard';
import { useAccountStatus } from '@/hooks/useAccountStatus';

export function PurchaseCoins() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const { toast } = useToast();
  const { isActive, showDeactivatedAccountError } = useAccountStatus();

  const predefinedAmounts = [1, 5, 10, 25, 50, 100];

  const handlePurchase = async (purchaseAmount: number, selectedPaymentMethod: 'card' | 'upi' = paymentMethod) => {
    if (!isActive) {
      showDeactivatedAccountError();
      return;
    }

    setLoading(true);
    try {
      console.log('Creating checkout session for amount:', purchaseAmount);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          amount: purchaseAmount,
          paymentMethod: selectedPaymentMethod
        }
      });

      if (error) {
        console.error('Checkout creation error:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('No checkout URL received');
      }

      console.log('Checkout session created, opening:', data.url);
      
      // Show success message
      toast({
        title: "Payment Session Created",
        description: "Opening Stripe checkout. Complete your payment to receive Happy Coins.",
      });

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

  const handleRecoverPayments = async () => {
    setRecovering(true);
    try {
      console.log('Attempting to recover failed payments...');
      
      const { data, error } = await supabase.functions.invoke('recover-failed-payment');

      if (error) {
        console.error('Recovery error:', error);
        throw error;
      }

      console.log('Recovery result:', data);

      toast({
        title: "Recovery Check Complete",
        description: data.message,
        variant: data.recovered_coins > 0 ? "default" : "destructive",
      });

      if (data.recovered_coins > 0) {
        // Refresh the page to show updated balance
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (error: any) {
      console.error('Recovery error:', error);
      toast({
        title: "Recovery Failed",
        description: error.message || "Failed to check for missing payments",
        variant: "destructive",
      });
    } finally {
      setRecovering(false);
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
    
    if (customAmount > 1000) {
      toast({
        title: "Amount Too Large",
        description: "Maximum purchase amount is 1000 HC",
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
          {/* Recovery Button */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Payment Issue?</h4>
                  <p className="text-sm text-yellow-700">If you paid but didn't receive coins, click to recover them.</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecoverPayments}
                disabled={recovering}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                {recovering ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Recover Coins
              </Button>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('card')}
                className="flex items-center justify-center space-x-2 h-12"
              >
                <CreditCard className="h-4 w-4" />
                <span>Card</span>
              </Button>
              <Button
                variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('upi')}
                className="flex items-center justify-center space-x-2 h-12"
              >
                <Smartphone className="h-4 w-4" />
                <span>UPI</span>
              </Button>
            </div>
          </div>

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
                max="1000"
                step="1"
                className="flex-1"
              />
              <Button 
                onClick={handleCustomAmount}
                disabled={loading || !amount}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : paymentMethod === 'upi' ? (
                  <Smartphone className="h-4 w-4 mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Processing...' : 'Buy'}
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <p>• Secure payment processing by Stripe</p>
            <p>• Instant delivery to your wallet</p>
            <p>• 1000 INR = 1 Happy Coin</p>
            <p>• {paymentMethod === 'upi' ? 'Pay using UPI apps like GPay, PhonePe, Paytm' : 'Pay with any debit/credit card'}</p>
            <p>• If payment fails to credit, use the "Recover Coins" button above</p>
            <p>• Maximum purchase: 1000 HC per transaction</p>
          </div>
        </CardContent>
      </Card>
    </AccountStatusGuard>
  );
}
