import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { AuthForm } from '@/components/auth/AuthForm';
import { LandingPage } from '@/components/landing/LandingPage';
import { WalletDashboard } from '@/components/wallet/WalletDashboard';
import { WalletActions } from '@/components/wallet/WalletActions';
import { TransactionsList } from '@/components/transactions/TransactionsList';
import { NotificationsList } from '@/components/notifications/NotificationsList';
import { OffersList } from '@/components/offers/OffersList';
import { UserProfile } from '@/components/profile/UserProfile';
import { TransfersPage } from '@/components/transfers/TransfersPage';
import { DailyLoginBonus } from '@/components/offers/DailyLoginBonus';
import { CoinExchange } from '@/components/coins/CoinExchange';
import { PurchaseCoins } from '@/components/coins/PurchaseCoins';
import { useToast } from '@/hooks/use-toast';

interface ReferralResponse {
  success?: boolean;
  error?: string;
  bonus_awarded?: number;
}

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState('landing');
  const [loading, setLoading] = useState(true);
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
  }, [toast]);

  const renderPage = () => {
    if (!user && (currentPage === 'landing' || currentPage === 'auth')) {
      switch (currentPage) {
        case 'landing':
          return <LandingPage onGetStarted={() => setCurrentPage('auth')} />;
        case 'auth':
          return <AuthForm onBackToLanding={() => setCurrentPage('landing')} />;
        default:
          return <LandingPage onGetStarted={() => setCurrentPage('auth')} />;
      }
    }

    if (!user) {
      return <LandingPage onGetStarted={() => setCurrentPage('auth')} />;
    }

    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <WalletDashboard />
            <div className="grid gap-6 lg:grid-cols-2">
              <WalletActions />
              <div>
                <TransactionsList />
              </div>
            </div>
          </div>
        );
      case 'coins':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Coins & Rewards</h1>
              <p className="text-muted-foreground">
                Earn coins through daily bonuses, complete offers, exchange them for Happy Coins, or purchase directly.
              </p>
            </div>

            <WalletDashboard />

            <div className="grid gap-6 lg:grid-cols-2">
              <PurchaseCoins />
              <DailyLoginBonus />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <CoinExchange />
            </div>

            <div>
              <OffersList />
            </div>
          </div>
        );
      case 'transfers':
        return <TransfersPage />;
      case 'notifications':
        return <NotificationsList />;
      case 'offers':
        return <OffersList />;
      case 'profile':
        return <UserProfile />;
      default:
        return (
          <div className="space-y-6">
            <WalletDashboard />
            <div className="grid gap-6 lg:grid-cols-2">
              <WalletActions />
              <div>
                <TransactionsList />
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Setting up your digital wallet</p>
        </div>
      </div>
    );
  }

  // Show landing page without navbar for non-authenticated users
  if (!user && currentPage === 'landing') {
    return <LandingPage onGetStarted={() => setCurrentPage('auth')} />;
  }

  // Show auth form without navbar
  if (!user && currentPage === 'auth') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <AuthForm onBackToLanding={() => setCurrentPage('landing')} />
      </div>
    );
  }

  // Show app with navbar for authenticated users
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderPage()}
      </main>
    </div>
  );
};

export default Index;
