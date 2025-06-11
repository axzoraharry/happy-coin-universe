import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, UserX, AlertTriangle, UserMinus } from 'lucide-react';

interface DeleteUserDataResponse {
  success: boolean;
  error?: string;
  message?: string;
  deleted_at?: string;
}

export function AccountActions() {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const { toast } = useToast();

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully",
      });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    setLoading(true);
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
          message: 'Your account has been deactivated. Contact support to reactivate.',
          type: 'warning'
        });

      toast({
        title: "Account Deactivated",
        description: "Your account has been deactivated. You will be signed out.",
      });

      // Sign out after deactivation
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
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmationText !== 'DELETE MY ACCOUNT') {
      toast({
        title: "Confirmation Required",
        description: "Please type 'DELETE MY ACCOUNT' to confirm",
        variant: "destructive",
      });
      return;
    }

    setDeleteLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Call the GDPR compliant deletion function
      const { data, error } = await supabase
        .rpc('delete_user_data', { p_user_id: user.id });

      if (error) throw error;

      // Properly type the response
      const response = data as unknown as DeleteUserDataResponse;
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete account data');
      }

      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted.",
      });

      // Sign out after deletion
      setTimeout(() => {
        supabase.auth.signOut();
      }, 2000);
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
      setConfirmationText('');
    }
  };

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span>Account Actions</span>
        </CardTitle>
        <CardDescription>
          Account management options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-orange-200 rounded-lg">
          <div>
            <h4 className="font-medium">Sign Out</h4>
            <p className="text-sm text-muted-foreground">
              Sign out of your account on this device.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserX className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign Out</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to sign out of your account?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleSignOut}
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {loading ? 'Signing out...' : 'Sign Out'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex items-center justify-between p-4 border border-yellow-200 rounded-lg">
          <div>
            <h4 className="font-medium">Deactivate Account</h4>
            <p className="text-sm text-muted-foreground">
              Temporarily deactivate your account. You can contact support to reactivate it.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-yellow-500 text-yellow-700 hover:bg-yellow-50">
                <UserMinus className="h-4 w-4 mr-2" />
                Deactivate
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate Account</AlertDialogTitle>
                <AlertDialogDescription>
                  This will deactivate your account temporarily. Your data will be preserved, but you won't be able to access your account until it's reactivated by contacting support.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeactivateAccount}
                  disabled={loading}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  {loading ? 'Deactivating...' : 'Deactivate Account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
          <div>
            <h4 className="font-medium text-red-700">Delete Account & Data</h4>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-red-500 text-red-700 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Account & All Data</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and all associated data including:
                  <ul className="list-disc list-inside mt-2 text-sm">
                    <li>Profile information</li>
                    <li>Wallet and transaction history</li>
                    <li>Coins and rewards</li>
                    <li>Notifications</li>
                    <li>All other personal data</li>
                  </ul>
                  <strong className="text-red-600 block mt-2">This action cannot be undone.</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="px-6 pb-4">
                <Label htmlFor="confirmation" className="text-sm font-medium text-red-700">
                  Type "DELETE MY ACCOUNT" to confirm:
                </Label>
                <Input
                  id="confirmation"
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="mt-2"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmationText('')}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || confirmationText !== 'DELETE MY ACCOUNT'}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Account & Data'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
