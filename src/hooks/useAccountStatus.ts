
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AccountStatus {
  isActive: boolean;
  loading: boolean;
  error: string | null;
}

export function useAccountStatus() {
  const [status, setStatus] = useState<AccountStatus>({
    isActive: true,
    loading: true,
    error: null
  });
  const { toast } = useToast();

  useEffect(() => {
    checkAccountStatus();
    
    // Listen for auth state changes to recheck status
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        checkAccountStatus();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAccountStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus({ isActive: false, loading: false, error: 'Not authenticated' });
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', user.id)
        .single();

      if (error) {
        // If profile doesn't exist, the account might have been deleted
        if (error.code === 'PGRST116') {
          console.error('Profile not found - account may have been deleted');
          setStatus({
            isActive: false,
            loading: false,
            error: 'Account not found'
          });
          
          // Sign out the user since their account no longer exists
          await supabase.auth.signOut();
          return;
        }
        throw error;
      }

      setStatus({
        isActive: data.is_active,
        loading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Error checking account status:', error);
      setStatus({
        isActive: false,
        loading: false,
        error: error.message
      });
    }
  };

  const showDeactivatedAccountError = () => {
    toast({
      title: "Account Deactivated",
      description: "Your account is deactivated. Please reactivate it to perform this action.",
      variant: "destructive",
    });
  };

  const refreshAccountStatus = () => {
    setStatus(prev => ({ ...prev, loading: true }));
    checkAccountStatus();
  };

  return {
    ...status,
    checkAccountStatus,
    refreshAccountStatus,
    showDeactivatedAccountError
  };
}
