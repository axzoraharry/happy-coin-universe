
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { AuthForm } from '@/components/auth/AuthForm';
import { WalletDashboard } from '@/components/wallet/WalletDashboard';
import { TransactionsList } from '@/components/transactions/TransactionsList';
import { NotificationsList } from '@/components/notifications/NotificationsList';
import { OffersList } from '@/components/offers/OffersList';
import { UserProfile } from '@/components/profile/UserProfile';
import { TransfersPage } from '@/components/transfers/TransfersPage';

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      if (!user) {
        setCurrentPage('auth');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        setCurrentPage('dashboard');
      } else {
        setCurrentPage('auth');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const renderPage = () => {
    if (!user && currentPage !== 'auth') {
      return <AuthForm />;
    }

    switch (currentPage) {
      case 'auth':
        return <AuthForm />;
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
        return <WalletDashboard />;
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
