
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PinResetResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

interface TransactionPinResetProps {
  onResetComplete?: () => void;
  onCancel?: () => void;
}

export function TransactionPinReset({ onResetComplete, onCancel }: TransactionPinResetProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePinReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 4 digits",
        variant: "destructive",
      });
      return;
    }

    if (newPin !== confirmPin) {
      toast({
        title: "PINs don't match",
        description: "Please make sure both PINs are the same",
        variant: "destructive",
      });
      return;
    }

    if (!currentPassword.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter your account password to verify your identity",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First verify the password by attempting to sign in
      const { error: passwordError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: currentPassword
      });

      if (passwordError) {
        toast({
          title: "Password Verification Failed",
          description: "The password you entered is incorrect",
          variant: "destructive",
        });
        return;
      }

      // If password verification succeeds, reset the PIN
      const { data, error } = await supabase.rpc('reset_transaction_pin_with_password' as any, {
        p_user_id: user.id,
        p_current_password: currentPassword,
        p_new_pin: newPin
      });

      if (error) throw error;

      const result = data as PinResetResponse;

      if (result?.success) {
        toast({
          title: "PIN Reset Successfully",
          description: "Your transaction PIN has been reset. You can now use your new PIN for transfers.",
        });
        
        // Clear form
        setCurrentPassword('');
        setNewPin('');
        setConfirmPin('');
        
        if (onResetComplete) {
          onResetComplete();
        }
      } else {
        throw new Error(result?.error || 'Failed to reset PIN');
      }
    } catch (error: any) {
      console.error('Error resetting PIN:', error);
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset transaction PIN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-orange-800">
          <RefreshCw className="h-5 w-5" />
          <span>Reset Transaction PIN</span>
        </CardTitle>
        <CardDescription className="text-orange-700">
          Reset your forgotten transaction PIN using your account password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Security Notice:</strong> You'll need to enter your account password to verify your identity before resetting your PIN.
          </AlertDescription>
        </Alert>

        <form onSubmit={handlePinReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Account Password</Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="Enter your account password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              This is the password you use to log into your account
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPin">New 4-Digit PIN</Label>
            <Input
              id="newPin"
              type="password"
              placeholder="••••"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPin">Confirm New PIN</Label>
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

          <div className="flex space-x-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={loading} 
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              <Shield className="h-4 w-4 mr-2" />
              {loading ? 'Resetting PIN...' : 'Reset PIN'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
