
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Home,
  ArrowLeftRight,
  Coins,
  Bell,
  Gift,
  Shield,
  User,
  Settings,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Coins className="h-8 w-8 text-primary mr-2" />
              <span className="font-bold text-xl">Happy Coins</span>
            </div>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-8">
            <button
              onClick={() => onPageChange('dashboard')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'dashboard'
                  ? 'text-primary bg-primary/10'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <Home className="h-4 w-4 inline mr-2" />
              Dashboard
            </button>

            <button
              onClick={() => onPageChange('transfers')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'transfers'
                  ? 'text-primary bg-primary/10'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <ArrowLeftRight className="h-4 w-4 inline mr-2" />
              Transfers
            </button>

            <button
              onClick={() => onPageChange('coins')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'coins'
                  ? 'text-primary bg-primary/10'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <Coins className="h-4 w-4 inline mr-2" />
              Coins & Rewards
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-1 text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                  <span>More</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onPageChange('security')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPageChange('offers')}>
                  <Gift className="h-4 w-4 mr-2" />
                  Offers
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPageChange('notifications')}>
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPageChange('sso')}>
                  <Settings className="h-4 w-4 mr-2" />
                  SSO & API
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPageChange('profile')}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* User dropdown */}
          <div className="ml-3 relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <span className="sr-only">Open user menu</span>
                  <img
                    className="h-8 w-8 rounded-full"
                    src="https://images.unsplash.com/photo-1472099173936-ca5cd87c5383?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt=""
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onPageChange('profile')}>
                  Your Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => supabase.auth.signOut()}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
            <button
              onClick={() => {
                onPageChange('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors ${
                currentPage === 'dashboard'
                  ? 'text-primary bg-primary/10'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <Home className="h-4 w-4 inline mr-2" />
              Dashboard
            </button>

            <button
              onClick={() => {
                onPageChange('transfers');
                setMobileMenuOpen(false);
              }}
              className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors ${
                currentPage === 'transfers'
                  ? 'text-primary bg-primary/10'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <ArrowLeftRight className="h-4 w-4 inline mr-2" />
              Transfers
            </button>

            <button
              onClick={() => {
                onPageChange('coins');
                setMobileMenuOpen(false);
              }}
              className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors ${
                currentPage === 'coins'
                  ? 'text-primary bg-primary/10'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <Coins className="h-4 w-4 inline mr-2" />
              Coins & Rewards
            </button>

            <button
              onClick={() => {
                onPageChange('security');
                setMobileMenuOpen(false);
              }}
              className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors ${
                currentPage === 'security'
                  ? 'text-primary bg-primary/10'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              Security
            </button>

            <button
              onClick={() => {
                onPageChange('offers');
                setMobileMenuOpen(false);
              }}
              className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors ${
                currentPage === 'offers'
                  ? 'text-primary bg-primary/10'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <Gift className="h-4 w-4 inline mr-2" />
              Offers
            </button>

            <button
              onClick={() => {
                onPageChange('notifications');
                setMobileMenuOpen(false);
              }}
              className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors ${
                currentPage === 'notifications'
                  ? 'text-primary bg-primary/10'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <Bell className="h-4 w-4 inline mr-2" />
              Notifications
            </button>

            <button
              onClick={() => {
                onPageChange('sso');
                setMobileMenuOpen(false);
              }}
              className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors ${
                currentPage === 'sso'
                  ? 'text-primary bg-primary/10'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              SSO & API
            </button>

            <button
              onClick={() => {
                onPageChange('profile');
                setMobileMenuOpen(false);
              }}
              className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors ${
                currentPage === 'profile'
                  ? 'text-primary bg-primary/10'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              Profile
            </button>

            <button
              onClick={() => {
                supabase.auth.signOut();
                setMobileMenuOpen(false);
              }}
              className="block px-3 py-2 rounded-md text-base font-medium w-full text-left text-gray-600 hover:text-primary transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
