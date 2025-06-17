import { useState } from 'react';
import { Wallet, Home, Coins, Send, Bell, Gift, Code, Shield, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Navbar({ currentPage, onPageChange }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed out",
          description: "You have been successfully signed out.",
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during sign out.",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Wallet className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">HappyCoins</span>
            </div>
            
            <div className="hidden md:flex space-x-6">
              <Button
                variant={currentPage === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => onPageChange('dashboard')}
                className="flex items-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
              
              <Button
                variant={currentPage === 'coins' ? 'default' : 'ghost'}
                onClick={() => onPageChange('coins')}
                className="flex items-center space-x-2"
              >
                <Coins className="h-4 w-4" />
                <span>Coins</span>
              </Button>

              <Button
                variant={currentPage === 'notifications' ? 'default' : 'ghost'}
                onClick={() => onPageChange('notifications')}
                className="flex items-center space-x-2"
              >
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <MoreHorizontal className="h-4 w-4" />
                    <span>More</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onPageChange('sso')}>
                    <Shield className="h-4 w-4 mr-2" />
                    SSO
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPageChange('offers')}>
                    <Gift className="h-4 w-4 mr-2" />
                    Offers
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPageChange('api')}>
                    <Code className="h-4 w-4 mr-2" />
                    API
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-100 text-blue-600 font-medium text-sm">
                    U
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => onPageChange('profile')}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              <Button
                variant={currentPage === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => {
                  onPageChange('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              
              <Button
                variant={currentPage === 'coins' ? 'default' : 'ghost'}
                onClick={() => {
                  onPageChange('coins');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                <Coins className="h-4 w-4 mr-2" />
                Coins
              </Button>

              <Button
                variant={currentPage === 'notifications' ? 'default' : 'ghost'}
                onClick={() => {
                  onPageChange('notifications');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>

              <Button
                variant={currentPage === 'sso' ? 'default' : 'ghost'}
                onClick={() => {
                  onPageChange('sso');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                <Shield className="h-4 w-4 mr-2" />
                SSO
              </Button>

              <Button
                variant={currentPage === 'offers' ? 'default' : 'ghost'}
                onClick={() => {
                  onPageChange('offers');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                <Gift className="h-4 w-4 mr-2" />
                Offers
              </Button>

              <Button
                variant={currentPage === 'api' ? 'default' : 'ghost'}
                onClick={() => {
                  onPageChange('api');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                <Code className="h-4 w-4 mr-2" />
                API
              </Button>

              <Button
                variant={currentPage === 'profile' ? 'default' : 'ghost'}
                onClick={() => {
                  onPageChange('profile');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                Profile
              </Button>

              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
