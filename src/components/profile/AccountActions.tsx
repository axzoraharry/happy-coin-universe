
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, UserX, AlertTriangle } from 'lucide-react';

export function AccountActions() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDeactivateAccount = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update profile to mark as deactivated
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: false,
          deactivated_at: new Date().toISOString() 
        })
        .eq('id', user.id);

      if (error) throw error;

      // Sign out the user
      await supabase.auth.signOut();

      toast({
        title: "Account Deactivated",
        description: "Your account has been deactivated successfully",
      });
    } catch (error: any) {
      console.error('Error deactivating account:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call the delete account function (will be created in database)
      const { error } = await supabase.rpc('delete_user_account', {
        user_id: user.id
      });

      if (error) throw error;

      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted",
      });

      // The user will be automatically signed out
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span>Danger Zone</span>
        </CardTitle>
        <CardDescription>
          Irreversible and destructive actions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-orange-200 rounded-lg">
          <div>
            <h4 className="font-medium">Deactivate Account</h4>
            <p className="text-sm text-muted-foreground">
              Temporarily disable your account. You can reactivate it later.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserX className="h-4 w-4 mr-2" />
                Deactivate
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate Account</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to deactivate your account? You will be signed out and your account will be temporarily disabled. You can reactivate it by signing in again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeactivateAccount}
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {loading ? 'Deactivating...' : 'Deactivate Account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex items-center justify-between p-4 border border-destructive rounded-lg">
          <div>
            <h4 className="font-medium">Delete Account</h4>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Account Permanently</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers, including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Profile information</li>
                    <li>Wallet and transaction history</li>
                    <li>Coins and rewards</li>
                    <li>Notifications and preferences</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {loading ? 'Deleting...' : 'Delete Account Permanently'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
