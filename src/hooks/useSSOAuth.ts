
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSSOAuth() {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error' | 'unauthenticated'>('idle');
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);
        
        if (!session?.user) {
          setStatus('unauthenticated');
          setMessage('Please log in to your HappyCoins account first');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setStatus('unauthenticated');
        setMessage('Please log in to your HappyCoins account first');
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user || null);
      
      if (session?.user) {
        if (status === 'unauthenticated') {
          setStatus('idle');
          setMessage('');
        }
      } else {
        setStatus('unauthenticated');
        setMessage('Please log in to your HappyCoins account first');
      }
    });

    return () => subscription.unsubscribe();
  }, [status]);

  return {
    status,
    setStatus,
    message,
    setMessage,
    processing,
    setProcessing,
    user,
    session,
    checkingAuth
  };
}
