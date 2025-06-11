
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User as UserIcon, LogOut, Wallet, Bell, Gift, User, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Navbar({ currentPage, onPageChange }: NavbarProps) {
  const [user, setUser] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(0);
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
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <h1 className="text-xl font-bold text-gray-900">Digital Wallet</h1>
          
          {user && (
            <div className="flex items-center space-x-4">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? "default" : "ghost"}
                    onClick={() => onPageChange(item.id)}
                    className="flex items-center space-x-2"
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge variant="destructive" className="ml-1">
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
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4" />
                <span className="text-sm text-gray-700">
                  {user.email}
                </span>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button onClick={() => onPageChange('auth')}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
