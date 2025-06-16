import { useState } from 'react';
import { Wallet, Home, Coins, Send, Bell, Gift, Code, Shield, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Navbar({ currentPage, onPageChange }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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
                variant={currentPage === 'transfers' ? 'default' : 'ghost'}
                onClick={() => onPageChange('transfers')}
                className="flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Transfers</span>
              </Button>

              <Button
                variant={currentPage === 'sso' ? 'default' : 'ghost'}
                onClick={() => onPageChange('sso')}
                className="flex items-center space-x-2"
              >
                <Shield className="h-4 w-4" />
                <span>SSO</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <MoreHorizontal className="h-4 w-4" />
                    <span>More</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onPageChange('notifications')}>
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
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
                <Button variant="ghost" className="relative flex h-8 w-8 rounded-full">
                  <img
                    src="/images/avatars/01.png"
                    alt="Avatar"
                    className="aspect-square h-full w-full rounded-full"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onPageChange('profile')}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
