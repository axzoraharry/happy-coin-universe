
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { AuthForm } from '@/components/auth/AuthForm';
import { LandingPage } from '@/components/landing/LandingPage';
import { WalletDashboard } from '@/components/wallet/WalletDashboard';
import { TransactionsList } from '@/components/transactions/TransactionsList';
import { NotificationsList } from '@/components/notifications/NotificationsList';
import { OffersList } from '@/components/offers/OffersList';
import { UserProfile } from '@/components/profile/UserProfile';
import { TransfersPage } from '@/components/transfers/TransfersPage';

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState('landing');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      if (user) {
        setCurrentPage('dashboard');
      } else {
        setCurrentPage('landing');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        setCurrentPage('dashboard');
      } else {
        setCurrentPage('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const renderPage = () => {
    if (!user && (currentPage === 'landing' || currentPage === 'auth')) {
      switch (currentPage) {
        case 'landing':
          return <LandingPage onGetStarted={() => setCurrentPage('auth')} />;
        case 'auth':
          return <AuthForm />;
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
            <TransactionsList />
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
            <TransactionsList />
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
        <AuthForm />
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
