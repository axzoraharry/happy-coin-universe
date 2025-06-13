
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, Mail } from 'lucide-react';

export function AccountDeactivationStatus() {
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [reactivating, setReactivating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAccountStatus();
  }, []);

  const checkAccountStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setIsActive(data.is_active);
    } catch (error: any) {
      console.error('Error checking account status:', error);
      toast({
        title: "Error",
        description: "Failed to check account status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      // Create notification about account reactivation
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Account Reactivated',
          message: 'Your account has been successfully reactivated. Welcome back!',
          type: 'success'
        });

      setIsActive(true);
      toast({
        title: "Account Reactivated",
        description: "Your account has been successfully reactivated.",
      });
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
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-yellow-700">
            <AlertTriangle className="h-5 w-5" />
            <span>Account Deactivated</span>
          </CardTitle>
          <CardDescription>
            Your account is currently deactivated. You can reactivate it anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-2 text-sm text-yellow-700">
            <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              While deactivated, you can still access your account but some features may be limited.
              To fully restore all functionality, please reactivate your account.
            </div>
          </div>

          <Button 
            onClick={handleReactivate}
            disabled={reactivating}
            className="w-full bg-yellow-600 hover:bg-yellow-700"
          >
            {reactivating ? 'Reactivating...' : 'Reactivate Account'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <span>Account Active</span>
        </CardTitle>
        <CardDescription>
          Your account is active and all features are available.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
