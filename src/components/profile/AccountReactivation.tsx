
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, Info } from 'lucide-react';

interface DatabaseFunctionResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

export function AccountReactivation() {
  const [reactivating, setReactivating] = useState(false);
  const { toast } = useToast();

  const handleReactivateAccount = async () => {
    setReactivating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('reactivate_user_account' as any, {
        p_user_id: user.id
      });

      if (error) throw error;

      const result = data as DatabaseFunctionResponse;

      if (result?.success) {
        toast({
          title: "Account Reactivated",
          description: "Your account has been successfully reactivated. Welcome back!",
        });

        // Refresh the page to update the account status
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(result?.error || 'Failed to reactivate account');
      }
    } catch (error: any) {
      console.error('Error reactivating account:', error);
      toast({
        title: "Reactivation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setReactivating(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-700">
          <Info className="h-5 w-5" />
          <span>Account Deactivated</span>
        </CardTitle>
        <CardDescription>
          Your account is currently deactivated. You can reactivate it at any time to restore full access to all features.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">While deactivated:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• You cannot send or receive transfers</li>
            <li>• Coin exchanges are disabled</li>
            <li>• Some features are restricted</li>
            <li>• Your data is preserved and secure</li>
          </ul>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              disabled={reactivating}
              className="w-full justify-start border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              {reactivating ? 'Reactivating...' : 'Reactivate Account'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reactivate Your Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reactivate your account? This will:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Restore full access to all features</li>
                  <li>Enable transfers and exchanges</li>
                  <li>Allow you to earn and spend coins</li>
                  <li>Resume all account functionality</li>
                </ul>
                You can deactivate again anytime if needed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReactivateAccount}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Reactivate Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
