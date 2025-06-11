import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User, Coins, Wallet } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function Navbar() {
  const [user, setUser] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    };

    getUser();
  }, []);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account",
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 
              className="text-xl font-bold cursor-pointer" 
              onClick={() => navigate('/')}
            >
              Digital Wallet
            </h1>
            
            {user && (
              <div className="flex items-center space-x-4">
                <Button
                  variant={location.pathname === '/' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate('/')}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant={location.pathname === '/coins' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate('/coins')}
                >
                  <Coins className="h-4 w-4 mr-2" />
                  Coins & Rewards
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Welcome, {user.email}
                </span>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
