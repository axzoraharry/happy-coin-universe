
import { Navbar } from '@/components/layout/Navbar';
import { AuthForm } from '@/components/auth/AuthForm';
import { LandingPage } from '@/components/landing/LandingPage';
import { PageRenderer } from '@/components/pages/PageRenderer';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { useAuthState } from '@/hooks/useAuthState';
import { useUrlParameters } from '@/hooks/useUrlParameters';

const Index = () => {
  const { user, currentPage, setCurrentPage, loading } = useAuthState();
  
  // Process URL parameters (referral codes, Stripe redirects)
  useUrlParameters();

  if (loading) {
    return <LoadingScreen />;
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

  // Fallback for non-authenticated users
  if (!user) {
    return <LandingPage onGetStarted={() => setCurrentPage('auth')} />;
  }

  // Show app with navbar for authenticated users
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <PageRenderer currentPage={currentPage} />
      </main>
    </div>
  );
};

export default Index;
