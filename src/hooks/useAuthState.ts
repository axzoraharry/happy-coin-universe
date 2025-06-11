
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useReferralProcessing } from './useReferralProcessing';

export function useAuthState() {
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState('landing');
  const [loading, setLoading] = useState(true);
  const { processReferralAfterConfirmation } = useReferralProcessing();

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      if (user) {
        setCurrentPage('dashboard');
        // Process referral if user just confirmed email
        processReferralAfterConfirmation(user.id);
      } else {
        setCurrentPage('landing');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        setCurrentPage('dashboard');
        // Process referral for new users after email confirmation
        if (event === 'SIGNED_IN') {
          processReferralAfterConfirmation(session.user.id);
        }
      } else {
        setCurrentPage('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, [processReferralAfterConfirmation]);

  return { user, currentPage, setCurrentPage, loading };
}
