
export type PageType = 
  | 'landing' 
  | 'auth' 
  | 'dashboard' 
  | 'security' 
  | 'coins' 
  | 'sso' 
  | 'transfers' 
  | 'notifications' 
  | 'offers' 
  | 'profile';

export interface NavigationConfig {
  requiresAuth: boolean;
  title: string;
  description?: string;
}

export const pageConfigs: Record<PageType, NavigationConfig> = {
  landing: {
    requiresAuth: false,
    title: 'Welcome to Axzora',
    description: 'Your AI-powered digital universe'
  },
  auth: {
    requiresAuth: false,
    title: 'Sign In',
    description: 'Access your digital wallet'
  },
  dashboard: {
    requiresAuth: true,
    title: 'Dashboard',
    description: 'Manage your digital wallet'
  },
  security: {
    requiresAuth: true,
    title: 'Security Center',
    description: 'Advanced security monitoring and protection'
  },
  coins: {
    requiresAuth: true,
    title: 'Coins & Rewards',
    description: 'Earn and manage your digital currency'
  },
  sso: {
    requiresAuth: true,
    title: 'SSO Integration',
    description: 'Create authentication widgets and API integrations'
  },
  transfers: {
    requiresAuth: true,
    title: 'Transfers',
    description: 'Send and receive Happy Coins'
  },
  notifications: {
    requiresAuth: true,
    title: 'Notifications',
    description: 'Stay updated with your account activity'
  },
  offers: {
    requiresAuth: true,
    title: 'Offers',
    description: 'Discover exclusive deals and rewards'
  },
  profile: {
    requiresAuth: true,
    title: 'Profile',
    description: 'Manage your account settings'
  }
};

export function getPageConfig(page: PageType): NavigationConfig {
  return pageConfigs[page];
}

export function shouldRedirectToAuth(page: PageType, isAuthenticated: boolean): boolean {
  const config = getPageConfig(page);
  return config.requiresAuth && !isAuthenticated;
}
