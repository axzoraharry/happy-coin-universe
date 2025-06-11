
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function SignInAlert() {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        If you just signed up, make sure to check your email and click the confirmation link first.
      </AlertDescription>
    </Alert>
  );
}
