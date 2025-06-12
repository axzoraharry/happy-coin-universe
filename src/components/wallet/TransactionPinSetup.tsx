
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Lock, Shield, Eye, EyeOff } from 'lucide-react';

interface PinResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export function TransactionPinSetup() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasExistingPin, setHasExistingPin] = useState(false);
  const { toast } = useToast();

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
        console.error('Error checking existing PIN:', error);
        return;
      }

      setHasExistingPin(!!data);
    } catch (error) {
      console.error('Error checking existing PIN:', error);
    }
  };

  const validatePin = (pinValue: string) => {
    if (pinValue.length !== 4) {
      return 'PIN must be exactly 4 digits';
    }
    if (!/^\d+$/.test(pinValue)) {
      return 'PIN must contain only numbers';
    }
    // Add security checks for weak PINs
    if (pinValue === '0000' || pinValue === '1234' || pinValue === '1111') {
      return 'Please choose a more secure PIN';
    }
    return null;
  };

  const handleSetPin = async () => {
    const pinError = validatePin(pin);
    if (pinError) {
      toast({
        title: "Invalid PIN",
        description: pinError,
        variant: "destructive",
      });
      return;
    }

    if (pin !== confirmPin) {
      toast({
        title: "PIN Mismatch",
        description: "PIN and confirmation PIN do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Use the new secure PIN function
      const { data: result, error } = await supabase.rpc('set_secure_transaction_pin', {
        p_user_id: user.id,
        p_pin: pin
      });

      if (error) throw error;

      const pinResult = result as PinResponse;
      
      if (!pinResult.success) {
        throw new Error(pinResult.error);
      }

      toast({
        title: "PIN Set Successfully",
        description: "Your transaction PIN has been set securely using advanced encryption",
      });

      setPin('');
      setConfirmPin('');
      setCurrentPin('');
      setHasExistingPin(true);
    } catch (error: any) {
      console.error('PIN setup error:', error);
      toast({
        title: "PIN Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePin = async () => {
    if (!currentPin) {
      toast({
        title: "Current PIN Required",
        description: "Please enter your current PIN",
        variant: "destructive",
      });
      return;
    }

    const pinError = validatePin(pin);
    if (pinError) {
      toast({
        title: "Invalid New PIN",
        description: pinError,
        variant: "destructive",
      });
      return;
    }

    if (pin !== confirmPin) {
      toast({
        title: "PIN Mismatch",
        description: "New PIN and confirmation PIN do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Verify current PIN first
      const { data: verifyResult, error: verifyError } = await supabase.rpc('verify_transaction_pin', {
        p_user_id: user.id,
        p_pin: currentPin
      });

      if (verifyError) throw verifyError;

      if (!verifyResult) {
        toast({
          title: "Invalid Current PIN",
          description: "The current PIN you entered is incorrect",
          variant: "destructive",
        });
        return;
      }

      // Set new PIN
      const { data: result, error } = await supabase.rpc('set_secure_transaction_pin', {
        p_user_id: user.id,
        p_pin: pin
      });

      if (error) throw error;

      const pinResult = result as PinResponse;
      
      if (!pinResult.success) {
        throw new Error(pinResult.error);
      }

      toast({
        title: "PIN Updated Successfully",
        description: "Your transaction PIN has been updated with enhanced security",
      });

      setPin('');
      setConfirmPin('');
      setCurrentPin('');
    } catch (error: any) {
      console.error('PIN update error:', error);
      toast({
        title: "PIN Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-primary" />
          <span>Secure Transaction PIN</span>
        </CardTitle>
        <CardDescription>
          Set up a 4-digit PIN with advanced encryption to secure your wallet transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasExistingPin && (
          <div className="space-y-2">
            <Label htmlFor="current-pin" className="text-sm font-medium">
              Current PIN
            </Label>
            <div className="relative">
              <Input
                id="current-pin"
                type={showCurrentPin ? "text" : "password"}
                placeholder="Enter current PIN"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowCurrentPin(!showCurrentPin)}
              >
                {showCurrentPin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="new-pin" className="text-sm font-medium">
            {hasExistingPin ? 'New PIN' : 'PIN'}
          </Label>
          <div className="relative">
            <Input
              id="new-pin"
              type={showPin ? "text" : "password"}
              placeholder="Enter 4-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPin(!showPin)}
            >
              {showPin ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-pin" className="text-sm font-medium">
            Confirm PIN
          </Label>
          <div className="relative">
            <Input
              id="confirm-pin"
              type={showConfirmPin ? "text" : "password"}
              placeholder="Confirm 4-digit PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowConfirmPin(!showConfirmPin)}
            >
              {showConfirmPin ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-start space-x-2">
            <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Enhanced Security Features:</p>
              <ul className="space-y-1 text-xs">
                <li>• Advanced bcrypt encryption (cost factor 12)</li>
                <li>• Secure PIN validation and verification</li>
                <li>• Protection against common PIN patterns</li>
                <li>• Server-side security with rate limiting</li>
                <li>• Required for all sensitive transactions</li>
              </ul>
            </div>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              className="w-full" 
              disabled={loading || !pin || !confirmPin || (hasExistingPin && !currentPin)}
            >
              <Shield className="h-4 w-4 mr-2" />
              {loading ? 'Setting up...' : hasExistingPin ? 'Update Secure PIN' : 'Set Secure PIN'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {hasExistingPin ? 'Update Secure Transaction PIN?' : 'Set Secure Transaction PIN?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {hasExistingPin 
                  ? 'This will update your existing transaction PIN using advanced encryption. You will need to use the new PIN for all future transactions.'
                  : 'This will set up a 4-digit PIN with advanced bcrypt encryption that you\'ll need to enter for all wallet transactions. The PIN will be securely stored and cannot be recovered if forgotten.'
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={hasExistingPin ? handleUpdatePin : handleSetPin}>
                {hasExistingPin ? 'Update Secure PIN' : 'Set Secure PIN'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
