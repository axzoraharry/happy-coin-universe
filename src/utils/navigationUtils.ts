
export type PageType = 
  | 'landing' 
  | 'auth' 
  | 'dashboard' 
  | 'coins' 
  | 'transfers' 
  | 'notifications' 
  | 'offers' 
  | 'profile' 
  | 'sso'
  | 'security'
  | 'analytics'
  | 'user-management';

export interface PageConfig {
  title: string;
  description: string;
  requiresAuth: boolean;
}

export const getPageConfig = (page: PageType): PageConfig => {
  const configs: Record<PageType, PageConfig> = {
    landing: {
      title: 'Welcome to Axzora',
      description: 'Your digital wallet ecosystem',
      requiresAuth: false
    },
    auth: {
      title: 'Authentication',
      description: 'Sign in to your account',
      requiresAuth: false
    },
    dashboard: {
      title: 'Dashboard',
      description: 'Overview of your digital wallet',
      requiresAuth: true
    },
    coins: {
      title: 'Happy Coins',
      description: 'Purchase and manage your digital currency',
      requiresAuth: true
    },
    transfers: {
      title: 'Transfers',
      description: 'Send money and manage transactions',
      requiresAuth: true
    },
    notifications: {
      title: 'Notifications',
      description: 'Stay updated with your account activity',
      requiresAuth: true
    },
    offers: {
      title: 'Offers & Rewards',
      description: 'Earn coins through activities and offers',
      requiresAuth: true
    },
    profile: {
      title: 'Profile',
      description: 'Manage your account settings',
      requiresAuth: true
    },
    sso: {
      title: 'SSO Generator',
      description: 'Generate secure single sign-on tokens',
      requiresAuth: true
    },
    security: {
      title: 'Security Dashboard',
      description: 'Monitor and manage account security',
      requiresAuth: true
    },
    analytics: {
      title: 'Analytics Dashboard',
      description: 'Insights into your financial activity',
      requiresAuth: true
    },
    'user-management': {
      title: 'User Management',
      description: 'Manage user accounts and system security',
      requiresAuth: true
    }
  };

  return configs[page] || configs.dashboard;
};

export const shouldRedirectToAuth = (page: PageType, isAuthenticated: boolean): boolean => {
  const config = getPageConfig(page);
  return config.requiresAuth && !isAuthenticated;
};
