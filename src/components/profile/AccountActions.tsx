
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserX, Trash2, LogOut, Shield } from 'lucide-react';
import { AccountStatusGuard } from '../common/AccountStatusGuard';
import { useAccountStatus } from '@/hooks/useAccountStatus';

export function AccountActions() {
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { toast } = useToast();
  const { isActive } = useAccountStatus();

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Redirect will happen automatically through auth state change
    } catch (error: any) {
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSigningOut(false);
    }
  };

  const handleDeactivateAccount = async () => {
    setDeactivating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      // Create notification about account deactivation
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Account Deactivated',
          message: 'Your account has been deactivated. You can reactivate it anytime by logging in.',
          type: 'warning'
        });

      toast({
        title: "Account Deactivated",
        description: "Your account has been deactivated. You will be signed out shortly.",
      });

      // Sign out user after deactivation
      setTimeout(() => {
        supabase.auth.signOut();
      }, 2000);
    } catch (error: any) {
      console.error('Error deactivating account:', error);
      toast({
        title: "Deactivation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeactivating(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Call the GDPR deletion function
      const { data, error } = await supabase.rpc('delete_user_data', {
        p_user_id: user.id
      });

      if (error) throw error;

      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been permanently deleted.",
      });

      // Sign out user after deletion
      await supabase.auth.signOut();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-red-700">
          <Shield className="h-5 w-5" />
          <span>Account Actions</span>
        </CardTitle>
        <CardDescription>
          Manage your account security and data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sign Out */}
        <Button
          variant="outline"
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {signingOut ? 'Signing Out...' : 'Sign Out'}
        </Button>

        {/* Deactivate Account - Only show if account is active */}
        {isActive && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={deactivating}
                className="w-full justify-start border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                <UserX className="h-4 w-4 mr-2" />
                {deactivating ? 'Deactivating...' : 'Deactivate Account'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate Account</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to deactivate your account? This will:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Prevent you from making transfers or exchanges</li>
                    <li>Restrict access to certain features</li>
                    <li>Sign you out of your account</li>
                    <li>Allow you to reactivate anytime by signing back in</li>
                  </ul>
                  Your data will be preserved and you can reactivate anytime.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeactivateAccount}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Deactivate Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Delete Account */}
        <AccountStatusGuard showError={false}>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={deleting}
                className="w-full justify-start border-red-300 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete Account'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Account Permanently</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to permanently delete your account? This action cannot be undone and will:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Permanently delete all your data</li>
                    <li>Remove all transaction history</li>
                    <li>Delete your wallet and coins</li>
                    <li>Cancel all pending transactions</li>
                  </ul>
                  This action is irreversible and complies with GDPR data deletion requirements.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Forever
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </AccountStatusGuard>
      </CardContent>
    </Card>
  );
}
