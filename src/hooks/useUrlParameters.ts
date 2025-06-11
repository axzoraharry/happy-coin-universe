
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useUrlParameters() {
  const { toast } = useToast();

  useEffect(() => {
    // Process URL parameters once at the beginning
    const urlParams = new URLSearchParams(window.location.search);
    
    // Store referral code if present in URL for later processing
    const referralCode = urlParams.get('ref');
    if (referralCode) {
      localStorage.setItem('pendingReferralCode', referralCode);
    }

    // Check for Stripe redirect params
    if (urlParams.get('success') === 'true') {
      toast({
        title: "Purchase Successful!",
        description: "Your Happy Coins have been added to your wallet",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
      toast({
        title: "Purchase Canceled",
        description: "Your purchase was canceled",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);
}
