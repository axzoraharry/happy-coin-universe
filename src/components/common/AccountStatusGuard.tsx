
import { ReactNode } from 'react';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface AccountStatusGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  showError?: boolean;
}

export function AccountStatusGuard({ 
  children, 
  fallback,
  showError = true 
}: AccountStatusGuardProps) {
  const { isActive, loading } = useAccountStatus();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-lg font-medium">Checking account status...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isActive) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showError) {
      return null;
    }

    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-yellow-700">
            <AlertTriangle className="h-5 w-5" />
            <span>Feature Restricted</span>
          </CardTitle>
          <CardDescription>
            This feature is not available for deactivated accounts. Please reactivate your account to continue.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <>{children}</>;
}
