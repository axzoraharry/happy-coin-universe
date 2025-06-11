
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReferralResponse {
  success?: boolean;
  error?: string;
  bonus_awarded?: number;
}

export function useReferralProcessing() {
  const { toast } = useToast();

  const processReferralAfterConfirmation = async (userId: string) => {
    try {
      console.log('Checking for pending referral processing for user:', userId);
      
      // Check if there's a referral code in URL or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      let referralCode = urlParams.get('ref');
      
      if (!referralCode) {
        referralCode = localStorage.getItem('pendingReferralCode');
      }
      
      if (referralCode) {
        console.log('Processing referral code:', referralCode);
        
        const { data, error } = await supabase.rpc('process_referral', {
          p_referred_user_id: userId,
          p_referral_code: referralCode
        });

        console.log('Referral processing result:', data, error);

        const referralData = data as ReferralResponse;

        if (referralData?.success) {
          toast({
            title: "Referral Bonus Awarded!",
            description: `You and your referrer both earned ${referralData.bonus_awarded} coins!`,
          });
          // Clean up
          localStorage.removeItem('pendingReferralCode');
          // Clean up URL
          if (urlParams.get('ref')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else if (referralData?.error && !referralData.error.includes('already been referred')) {
          console.warn('Referral processing failed:', referralData.error);
        }
      }
    } catch (error: any) {
      console.error('Error processing referral after confirmation:', error);
      // Silent fail - don't disrupt user experience
    }
  };

  return { processReferralAfterConfirmation };
}
