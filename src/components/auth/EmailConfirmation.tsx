
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface EmailConfirmationProps {
  email: string;
  referralCode: string;
  onReturnToSignIn: () => void;
}

export function EmailConfirmation({ email, referralCode, onReturnToSignIn }: EmailConfirmationProps) {
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
          onClick={onReturnToSignIn}
        >
          Return to Sign In
        </Button>
      </CardContent>
    </Card>
  );
}
