
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User as UserIcon, LogOut, Wallet, Bell, Gift, User, Send, Menu, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Navbar({ currentPage, onPageChange }: NavbarProps) {
  const [user, setUser] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchNotificationCount();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchNotificationCount();
      } else {
        setNotificationCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchNotificationCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      setNotificationCount(count || 0);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
      onPageChange('auth');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Wallet },
    { id: 'transfers', label: 'Transfers', icon: Send },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: notificationCount },
    { id: 'offers', label: 'Offers', icon: Gift },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-4 py-3 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-blue-600 rounded-lg flex items-center justify-center">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Digital Wallet
            </h1>
          </div>
          
          {user && (
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? "default" : "ghost"}
                    onClick={() => onPageChange(item.id)}
                    className={`flex items-center space-x-2 transition-all duration-200 ${
                      currentPage === item.id 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge variant="destructive" className="ml-1 animate-pulse">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-3 py-2 bg-muted/50 rounded-lg">
                  <div className="w-6 h-6 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center">
                    <UserIcon className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">
                    {user.email}
                  </span>
                </div>
                <Button variant="outline" onClick={handleSignOut} className="hover:bg-red-50 hover:border-red-200 hover:text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
              
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <Button onClick={() => onPageChange('auth')} className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {user && mobileMenuOpen && (
        <div className="md:hidden mt-4 space-y-2 border-t border-gray-200/50 pt-4">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Button
                key={item.id}
                variant={currentPage === item.id ? "default" : "ghost"}
                onClick={() => {
                  onPageChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {item.label}
                {item.badge && item.badge > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
          <div className="pt-4 border-t border-gray-200/50">
            <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700">
              <UserIcon className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="w-full mt-2">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
