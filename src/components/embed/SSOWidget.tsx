import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogIn, CheckCircle, XCircle, Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SSOWidgetProps {
  clientId: string;
  redirectUri: string;
  scope?: string;
  state?: string;
  onSuccess?: (authCode: string) => void;
  onError?: (error: string) => void;
  theme?: 'light' | 'dark';
  compact?: boolean;
  appName?: string;
}

export function SSOWidget({
  clientId,
  redirectUri,
  scope = 'profile email',
  state,
  onSuccess,
  onError,
  theme = 'light',
  compact = false,
  appName = 'Application'
}: SSOWidgetProps) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error' | 'auth_required'>('idle');
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const getSupabaseUrl = () => {
    return 'https://zygpupmeradizrachnqj.supabase.co';
  };

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setUser(session?.user || null);
        setAccessToken(session?.access_token || null);
        
        if (!session?.user) {
          setStatus('auth_required');
          setMessage('Please sign in to your HappyCoins account to continue');
        } else {
          setStatus('idle');
          setMessage('');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setStatus('auth_required');
        setMessage('Authentication required');
        setAccessToken(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setAccessToken(session?.access_token || null);
      
      if (session?.user) {
        setStatus('idle');
        setMessage('');
      } else {
        setStatus('auth_required');
        setMessage('Please sign in to your HappyCoins account to continue');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Only check for auth callback if user is authenticated
    if (!user) return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const returnedState = urlParams.get('state');

    if (code) {
      if (state && returnedState !== state) {
        setStatus('error');
        setMessage('Invalid state parameter');
        onError?.('Invalid state parameter');
        return;
      }

      setStatus('success');
      setMessage('Authentication successful!');
      onSuccess?.(code);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      setStatus('error');
      setMessage(error);
      onError?.(error);
    }
  }, [state, onSuccess, onError, user]);

  const handleSignInRedirect = () => {
    // Redirect to HappyCoins login page
    window.location.href = '/';
  };

  const handleSignIn = async () => {
    if (!user || !accessToken) {
      setStatus('auth_required');
      setMessage('Please sign in to your HappyCoins account first');
      handleSignInRedirect();
      return;
    }

    if (!clientId || !redirectUri) {
      setStatus('error');
      setMessage('Missing required configuration');
      onError?.('Missing required configuration');
      return;
    }

    setProcessing(true);
    setStatus('processing');
    setMessage('Redirecting to HappyCoins authentication...');

    try {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scope,
        response_type: 'code',
      });

      if (state) {
        params.append('state', state);
      }

      const supabaseUrl = getSupabaseUrl();
      const authUrl = `${supabaseUrl}/functions/v1/sso-auth/authorize?${params.toString()}`;
      
      console.log('SSO Widget: Redirecting to:', authUrl);
      console.log('SSO Widget: Using access token:', accessToken ? 'Present' : 'Missing');
      
      // Instead of complex fetch logic, directly redirect with auth header in URL
      // This is a more reliable approach for SSO flows
      const urlWithToken = `${authUrl}&access_token=${encodeURIComponent(accessToken)}`;
      
      setTimeout(() => {
        window.location.href = urlWithToken;
      }, 500);

    } catch (error) {
      console.error('SSO request failed:', error);
      setStatus('error');
      setMessage('Failed to initiate authentication');
      setProcessing(false);
      onError?.('Failed to initiate authentication');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'auth_required':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <LogIn className="h-4 w-4" />;
    }
  };

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 text-white border-gray-700' 
    : 'bg-white text-gray-900 border-gray-200';

  if (isCheckingAuth) {
    return (
      <div className={`p-4 rounded-lg border ${themeClasses} max-w-sm`}>
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking authentication...</span>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`p-4 rounded-lg border ${themeClasses} max-w-sm`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Sign in with HappyCoins</span>
            </span>
            <Badge variant="outline">SSO</Badge>
          </div>
          
          {status === 'auth_required' ? (
            <Button
              onClick={handleSignInRedirect}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span>Sign In to HappyCoins</span>
            </Button>
          ) : (
            <Button
              onClick={handleSignIn}
              disabled={processing || status === 'success' || !user}
              className="w-full"
            >
              {getStatusIcon()}
              <span className="ml-2">
                {processing ? 'Signing in...' : status === 'success' ? 'Signed In' : 'Sign In'}
              </span>
            </Button>
          )}
          
          {message && (
            <p className={`text-xs ${
              status === 'error' ? 'text-red-600' : 
              status === 'success' ? 'text-green-600' : 
              status === 'auth_required' ? 'text-orange-600' : 
              'text-gray-600'
            }`}>
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={`max-w-md ${themeClasses}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Sign in with HappyCoins</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Application:</span>
            <span className="font-medium">{appName}</span>
          </div>
          <div className="flex justify-between">
            <span>Permissions:</span>
            <Badge variant="outline">{scope}</Badge>
          </div>
          {user && (
            <div className="flex justify-between">
              <span>Signed in as:</span>
              <span className="font-medium text-green-600">{user.email}</span>
            </div>
          )}
        </div>

        <div className={`border rounded-lg p-3 ${
          status === 'auth_required' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'
        }`}>
          <p className={`text-sm ${
            status === 'auth_required' ? 'text-orange-800' : 'text-blue-800'
          }`}>
            {status === 'auth_required' ? (
              <>
                <strong>Authentication Required:</strong> You must be signed in to your HappyCoins account to use SSO.
              </>
            ) : (
              <>
                <strong>Secure Authentication:</strong> Sign in using your HappyCoins wallet credentials. 
                Your login information is encrypted and secure.
              </>
            )}
          </p>
        </div>

        {status === 'auth_required' ? (
          <Button
            onClick={handleSignInRedirect}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span>Sign In to HappyCoins</span>
          </Button>
        ) : (
          <Button
            onClick={handleSignIn}
            disabled={processing || status === 'success' || !user}
            className="w-full"
          >
            {getStatusIcon()}
            <span className="ml-2">
              {processing ? 'Authenticating...' : status === 'success' ? 'Authentication Complete' : 'Authorize with HappyCoins'}
            </span>
          </Button>
        )}

        {message && (
          <div className={`p-3 rounded text-sm ${
            status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            status === 'auth_required' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
