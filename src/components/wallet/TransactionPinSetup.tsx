
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Lock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { AccountStatusGuard } from '../common/AccountStatusGuard';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import { TransactionPinReset } from './TransactionPinReset';

interface PinResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

export function TransactionPinSetup() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingPin, setCheckingPin] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const { toast } = useToast();
  const { isActive, showDeactivatedAccountError } = useAccountStatus();

  useEffect(() => {
    checkExistingPin();
  }, []);

  const checkExistingPin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('transaction_pins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking PIN:', error);
        return;
      }

      setHasPin(!!data);
    } catch (error) {
      console.error('Error checking existing PIN:', error);
    } finally {
      setCheckingPin(false);
    }
  };

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isActive) {
      showDeactivatedAccountError();
      return;
    }
    
    if (pin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 4 digits",
        variant: "destructive",
      });
      return;
    }

    if (pin !== confirmPin) {
      toast({
        title: "PINs don't match",
        description: "Please make sure both PINs are the same",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('set_secure_transaction_pin' as any, {
        p_user_id: user.id,
        p_pin: pin
      });

      if (error) throw error;

      const result = data as PinResponse;

      if (result?.success) {
        toast({
          title: "PIN Set Successfully",
          description: "Your transaction PIN has been set up securely",
        });
        setHasPin(true);
        setPin('');
        setConfirmPin('');
      } else {
        throw new Error(result?.error || 'Failed to set PIN');
      }
    } catch (error: any) {
      console.error('Error setting PIN:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to set up transaction PIN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetComplete = () => {
    setShowResetForm(false);
    checkExistingPin(); // Refresh PIN status
    toast({
      title: "PIN Reset Complete",
      description: "Your transaction PIN has been successfully reset",
    });
  };

  if (checkingPin) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-lg font-medium">Checking PIN status...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showResetForm) {
    return (
      <div className="space-y-4">
        <TransactionPinReset
          onResetComplete={handleResetComplete}
          onCancel={() => setShowResetForm(false)}
        />
      </div>
    );
  }

  if (hasPin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Transaction PIN Active</span>
          </CardTitle>
          <CardDescription>
            Your transaction PIN is set up and securing your transfers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Your transfers are protected with a secure 4-digit PIN. You'll be prompted to enter it when making transfers.
          </div>
          
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => setShowResetForm(true)}
              className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Forgot PIN? Reset PIN
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              You'll need your account password to reset your PIN
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <AccountStatusGuard>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>Set Up Transaction PIN</span>
          </CardTitle>
          <CardDescription>
            Secure your transfers with a 4-digit PIN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetupPin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">Create 4-Digit PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPin">Confirm PIN</Label>
              <Input
                id="confirmPin"
                type="password"
                placeholder="••••"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                required
              />
            </div>

            <div className="flex items-start space-x-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                Your PIN will be securely encrypted and used to verify transfers. 
                If you forget your PIN, you can reset it using your account password.
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Setting up PIN...' : 'Set Up PIN'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AccountStatusGuard>
  );
}
