import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ReferralResponse {
  success?: boolean;
  error?: string;
  bonus_awarded?: number;
}

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for referral code in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      setIsSignUp(true); // Switch to signup mode if there's a referral code
      toast({
        title: "Referral Code Detected",
        description: `You'll earn bonus coins when you sign up with code: ${refCode}`,
      });
    }
  }, [toast]);

  const processReferral = async (userId: string, refCode: string) => {
    try {
      console.log('Processing referral for user:', userId, 'with code:', refCode);
      
      const { data, error } = await supabase.rpc('process_referral', {
        p_referred_user_id: userId,
        p_referral_code: refCode
      });

      console.log('Referral processing result:', data, error);

      if (error) {
        console.error('Error processing referral:', error);
        throw error;
      }

      const referralData = data as ReferralResponse;

      if (referralData.success) {
        toast({
          title: "Referral Bonus!",
          description: `You and your referrer both earned ${referralData.bonus_awarded} coins!`,
        });
      } else {
        console.warn('Referral processing failed:', referralData.error);
        toast({
          title: "Referral Notice",
          description: referralData.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error in referral processing:', error);
      // Don't show error to user as signup was successful
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNeedsConfirmation(false);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        // Check if user needs email confirmation
        if (data.user && !data.session) {
          setNeedsConfirmation(true);
          toast({
            title: "Check your email!",
            description: "We've sent you a confirmation link to complete your signup.",
          });
        } else if (data.user) {
          // Process referral if code was provided and user is immediately signed in
          if (referralCode.trim()) {
            await processReferral(data.user.id, referralCode.trim());
          }
          
          toast({
            title: "Account created!",
            description: "Welcome to your digital wallet.",
          });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Handle specific error cases
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. Please check your credentials and try again.');
          } else if (error.message.includes('Email not confirmed')) {
            throw new Error('Please check your email and click the confirmation link before signing in.');
          } else {
            throw error;
          }
        }

        if (data.user) {
          toast({
            title: "Welcome back!",
            description: "You've successfully signed in.",
          });
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    if (!new URLSearchParams(window.location.search).get('ref')) {
      setReferralCode(''); // Don't clear if it came from URL
    }
    setNeedsConfirmation(false);
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  if (needsConfirmation) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            We've sent a confirmation link to {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Click the link in your email to activate your account, then return here to sign in.
              {referralCode && (
                <div className="mt-2">
                  <strong>Your referral bonus will be processed after email confirmation.</strong>
                </div>
              )}
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => {
              setNeedsConfirmation(false);
              setIsSignUp(false);
            }}
          >
            Return to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
        <CardDescription>
          {isSignUp ? 'Create your digital wallet account' : 'Welcome back to your digital wallet'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <Input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password (minimum 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          
          {isSignUp && (
            <div>
              <Input
                type="text"
                placeholder="Referral Code (optional)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                maxLength={8}
              />
              {referralCode && (
                <p className="text-sm text-muted-foreground mt-1">
                  You'll earn 100 bonus coins when you sign up!
                </p>
              )}
            </div>
          )}
          
          {!isSignUp && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                If you just signed up, make sure to check your email and click the confirmation link first.
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={switchMode}
            className="text-sm"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
