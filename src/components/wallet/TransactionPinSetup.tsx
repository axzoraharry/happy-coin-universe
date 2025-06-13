
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

interface PinResponse {
  success?: boolean;
  error?: string;
  message?: string;
  pin_verified?: boolean;
}

export function TransactionPinSetup() {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [checkingPin, setCheckingPin] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkExistingPin();
  }, []);

  const checkExistingPin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has a PIN set
      const { data: profile } = await supabase
        .from('profiles')
        .select('has_transaction_pin')
        .eq('id', user.id)
        .single();

      setHasPin(profile?.has_transaction_pin || false);
    } catch (error) {
      console.error('Error checking existing PIN:', error);
    } finally {
      setCheckingPin(false);
    }
  };

  const handleSetPin = async () => {
    if (!newPin || newPin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 4 digits",
        variant: "destructive",
      });
      return;
    }

    if (newPin !== confirmPin) {
      toast({
        title: "PIN Mismatch",
        description: "New PIN and confirmation don't match",
        variant: "destructive",
      });
      return;
    }

    if (hasPin && !currentPin) {
      toast({
        title: "Current PIN Required",
        description: "Please enter your current PIN to change it",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: rawResult, error } = await supabase.rpc('set_secure_transaction_pin' as any, {
        user_id: user.id,
        new_pin: newPin,
        current_pin: hasPin ? currentPin : null
      });

      if (error) throw error;

      const result = rawResult as unknown as PinResponse;

      if (result?.success) {
        toast({
          title: "PIN Updated",
          description: result.message || "Transaction PIN has been set successfully",
        });
        setHasPin(true);
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
      } else {
        toast({
          title: "Failed to Set PIN",
          description: result?.error || "Failed to set transaction PIN",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error setting PIN:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to set transaction PIN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async () => {
    if (!currentPin || currentPin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "Please enter your 4-digit PIN",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: rawResult, error } = await supabase.rpc('verify_transaction_pin' as any, {
        user_id: user.id,
        pin_to_verify: currentPin
      });

      if (error) throw error;

      const result = rawResult as unknown as PinResponse;

      if (result?.pin_verified) {
        toast({
          title: "PIN Verified",
          description: "Your transaction PIN is correct",
        });
      } else {
        toast({
          title: "Invalid PIN",
          description: "The PIN you entered is incorrect",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error verifying PIN:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify PIN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setCurrentPin('');
    }
  };

  const handleChangePin = async () => {
    if (!currentPin || currentPin.length !== 4) {
      toast({
        title: "Invalid Current PIN",
        description: "Please enter your current 4-digit PIN",
        variant: "destructive",
      });
      return;
    }

    if (!newPin || newPin.length !== 4) {
      toast({
        title: "Invalid New PIN",
        description: "New PIN must be exactly 4 digits",
        variant: "destructive",
      });
      return;
    }

    if (newPin !== confirmPin) {
      toast({
        title: "PIN Mismatch",
        description: "New PIN and confirmation don't match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: rawResult, error } = await supabase.rpc('set_secure_transaction_pin' as any, {
        user_id: user.id,
        new_pin: newPin,
        current_pin: currentPin
      });

      if (error) throw error;

      const result = rawResult as unknown as PinResponse;

      if (result?.success) {
        toast({
          title: "PIN Changed",
          description: "Your transaction PIN has been changed successfully",
        });
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
      } else {
        toast({
          title: "Failed to Change PIN",
          description: result?.error || "Failed to change transaction PIN",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error changing PIN:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to change transaction PIN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingPin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Checking PIN status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Transaction PIN Security</CardTitle>
          </div>
          <CardDescription>
            {hasPin 
              ? "Manage your transaction PIN for secure transfers" 
              : "Set up a 4-digit PIN for secure transactions"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasPin ? (
            <>
              {/* Verify PIN Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Verify Current PIN</span>
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="verify-pin">Enter your current PIN</Label>
                  <div className="relative">
                    <Input
                      id="verify-pin"
                      type={showCurrentPin ? "text" : "password"}
                      placeholder="••••"
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      className="text-center text-lg tracking-widest pr-10"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowCurrentPin(!showCurrentPin)}
                      disabled={loading}
                    >
                      {showCurrentPin ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button 
                    onClick={handleVerifyPin} 
                    disabled={loading || currentPin.length !== 4}
                    className="w-full"
                  >
                    {loading ? 'Verifying...' : 'Verify PIN'}
                  </Button>
                </div>
              </div>

              {/* Change PIN Section */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span>Change PIN</span>
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="current-pin-change">Current PIN</Label>
                  <div className="relative">
                    <Input
                      id="current-pin-change"
                      type={showCurrentPin ? "text" : "password"}
                      placeholder="••••"
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      className="text-center text-lg tracking-widest pr-10"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowCurrentPin(!showCurrentPin)}
                      disabled={loading}
                    >
                      {showCurrentPin ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-pin-change">New PIN</Label>
                  <div className="relative">
                    <Input
                      id="new-pin-change"
                      type={showNewPin ? "text" : "password"}
                      placeholder="••••"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      className="text-center text-lg tracking-widest pr-10"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPin(!showNewPin)}
                      disabled={loading}
                    >
                      {showNewPin ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-pin-change">Confirm New PIN</Label>
                  <div className="relative">
                    <Input
                      id="confirm-pin-change"
                      type={showConfirmPin ? "text" : "password"}
                      placeholder="••••"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      className="text-center text-lg tracking-widest pr-10"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPin(!showConfirmPin)}
                      disabled={loading}
                    >
                      {showConfirmPin ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleChangePin} 
                  disabled={loading || currentPin.length !== 4 || newPin.length !== 4 || confirmPin.length !== 4}
                  className="w-full"
                  variant="outline"
                >
                  {loading ? 'Changing...' : 'Change PIN'}
                </Button>
              </div>
            </>
          ) : (
            /* Set PIN Section */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-pin">New PIN (4 digits)</Label>
                <div className="relative">
                  <Input
                    id="new-pin"
                    type={showNewPin ? "text" : "password"}
                    placeholder="••••"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    className="text-center text-lg tracking-widest pr-10"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPin(!showNewPin)}
                    disabled={loading}
                  >
                    {showNewPin ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-pin">Confirm PIN</Label>
                <div className="relative">
                  <Input
                    id="confirm-pin"
                    type={showConfirmPin ? "text" : "password"}
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    className="text-center text-lg tracking-widest pr-10"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    disabled={loading}
                  >
                    {showConfirmPin ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handleSetPin} 
                disabled={loading || newPin.length !== 4 || confirmPin.length !== 4}
                className="w-full"
              >
                {loading ? 'Setting...' : 'Set PIN'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
