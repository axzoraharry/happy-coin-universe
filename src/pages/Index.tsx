
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { AuthForm } from '@/components/auth/AuthForm';
import { LandingPage } from '@/components/landing/LandingPage';
import { UnifiedWalletDashboard } from '@/components/wallet/UnifiedWalletDashboard';
import { QuickActions } from '@/components/wallet/QuickActions';
import { TransactionsList } from '@/components/transactions/TransactionsList';
import { NotificationsList } from '@/components/notifications/NotificationsList';
import { OffersList } from '@/components/offers/OffersList';
import { UserProfile } from '@/components/profile/UserProfile';
import { TransfersPage } from '@/components/transfers/TransfersPage';
import { DailyLoginBonus } from '@/components/offers/DailyLoginBonus';
import { CoinExchange } from '@/components/coins/CoinExchange';
import { PurchaseCoins } from '@/components/coins/PurchaseCoins';
import { SSOGenerator } from '@/components/embed/SSOGenerator';
import { RealTimeSecurityDashboard } from '@/components/security/RealTimeSecurityDashboard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useToast } from '@/hooks/use-toast';
import { PageType, getPageConfig, shouldRedirectToAuth } from '@/utils/navigationUtils';

interface ReferralResponse {
  success?: boolean;
  error?: string;
  bonus_awarded?: number;
}

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<PageType>('landing');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const processReferralAfterConfirmation = async (userId: string) => {
    try {
      console.log('Checking for pending referral processing for user:', userId);
      
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
          localStorage.removeItem('pendingReferralCode');
          if (urlParams.get('ref')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else if (referralData?.error && !referralData.error.includes('already been referred')) {
          console.warn('Referral processing failed:', referralData.error);
        }
      }
    } catch (error: any) {
      console.error('Error processing referral after confirmation:', error);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    const referralCode = urlParams.get('ref');
    if (referralCode) {
      localStorage.setItem('pendingReferralCode', referralCode);
    }

    if (urlParams.get('success') === 'true') {
      toast({
        title: "Purchase Successful!",
        description: "Your Happy Coins have been added to your wallet",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
      toast({
        title: "Purchase Canceled",
        description: "Your purchase was canceled",
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      if (user) {
        setCurrentPage('dashboard');
        processReferralAfterConfirmation(user.id);
      } else {
        setCurrentPage('landing');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        setCurrentPage('dashboard');
        if (event === 'SIGNED_IN') {
          processReferralAfterConfirmation(session.user.id);
        }
      } else {
        setCurrentPage('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const handlePageChange = (page: PageType) => {
    if (shouldRedirectToAuth(page, !!user)) {
      setCurrentPage('auth');
      return;
    }
    setCurrentPage(page);
  };

  const renderAuthenticatedPage = () => {
    const config = getPageConfig(currentPage);
    
    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <UnifiedWalletDashboard />
            <QuickActions />
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <TransactionsList />
              </div>
              <div className="space-y-6">
                <DailyLoginBonus />
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-8">
            <PageHeader title={config.title} description={config.description} />
            <RealTimeSecurityDashboard />
          </div>
        );
      case 'coins':
        return (
          <div className="space-y-8">
            <PageHeader title={config.title} description={config.description} />
            <UnifiedWalletDashboard />
            <QuickActions />
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
      case 'sso':
        return (
          <div className="space-y-8">
            <PageHeader title={config.title} description={config.description} />
            <SSOGenerator />
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
            <UnifiedWalletDashboard />
            <QuickActions />
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <TransactionsList />
              </div>
              <div className="space-y-6">
                <DailyLoginBonus />
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Setting up your digital wallet" />
      </div>
    );
  }

  if (!user && currentPage === 'landing') {
    return <LandingPage onGetStarted={() => setCurrentPage('auth')} />;
  }

  if (!user && currentPage === 'auth') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <AuthForm onBackToLanding={() => setCurrentPage('landing')} />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage={currentPage} onPageChange={handlePageChange} />
        
        <main className="max-w-7xl mx-auto px-4 py-6">
          {renderAuthenticatedPage()}
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default Index;
