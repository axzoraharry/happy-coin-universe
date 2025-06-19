import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogIn, CheckCircle, XCircle, Shield, AlertTriangle, User } from 'lucide-react';
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
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error' | 'unauthenticated'>('idle');
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);
        
        if (!session?.user) {
          setStatus('unauthenticated');
          setMessage('Please log in to your HappyCoins account first');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setStatus('unauthenticated');
        setMessage('Please log in to your HappyCoins account first');
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user || null);
      
      if (session?.user) {
        if (status === 'unauthenticated') {
          setStatus('idle');
          setMessage('');
        }
      } else {
        setStatus('unauthenticated');
        setMessage('Please log in to your HappyCoins account first');
      }
    });

    return () => subscription.unsubscribe();
  }, [status]);

  useEffect(() => {
    // Listen for messages from popup window
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'SSO_AUTH_SUCCESS') {
        const { code, returnedState } = event.data;
        
        if (state && returnedState !== state) {
          setStatus('error');
          setMessage('Invalid state parameter');
          onError?.('Invalid state parameter');
          return;
        }

        setStatus('success');
        setMessage('Authentication successful!');
        setProcessing(false);
        onSuccess?.(code);
      } else if (event.data.type === 'SSO_AUTH_ERROR') {
        setStatus('error');
        setMessage(event.data.error);
        setProcessing(false);
        onError?.(event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [state, onSuccess, onError]);

  const getSupabaseUrl = () => {
    return 'https://zygpupmeradizrachnqj.supabase.co';
  };

  const openAuthPopup = (authUrl: string) => {
    const popup = window.open(
      authUrl,
      'sso-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
    );

    if (!popup) {
      setStatus('error');
      setMessage('Popup blocked. Please allow popups for this site.');
      setProcessing(false);
      onError?.('Popup blocked');
      return;
    }

    // Monitor popup for closure
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        if (status === 'processing') {
          setStatus('error');
          setMessage('Authentication was cancelled');
          setProcessing(false);
          onError?.('Authentication cancelled');
        }
      }
    }, 1000);

    return popup;
  };

  const handleSignIn = async () => {
    if (!session?.access_token) {
      setStatus('unauthenticated');
      setMessage('Please log in to your HappyCoins account first');
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
    setMessage('Opening authorization popup...');

    try {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: window.location.origin + '/sso-callback',
        scope: scope,
        response_type: 'code',
        popup: 'true',
        original_redirect_uri: redirectUri,
      });

      if (state) {
        params.append('state', state);
      }

      const supabaseUrl = getSupabaseUrl();
      const authUrl = `${supabaseUrl}/functions/v1/sso-auth/authorize?${params.toString()}&access_token=${encodeURIComponent(session.access_token)}`;
      
      console.log('SSO Widget: Opening authorization popup');
      
      const popup = openAuthPopup(authUrl);
      if (!popup) return;

      setMessage('Complete authorization in the popup window...');

    } catch (error) {
      console.error('SSO request failed:', error);
      setStatus('error');
      setMessage('Failed to initiate authorization: ' + (error as Error).message);
      setProcessing(false);
      onError?.('Failed to initiate authentication');
    }
  };

  const handleLoginPrompt = () => {
    // Open login in popup as well
    const popup = window.open(
      '/',
      'happycoins-login',
      'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
    );

    if (!popup) {
      setStatus('error');
      setMessage('Popup blocked. Please allow popups for this site.');
      return;
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
      case 'unauthenticated':
        return <User className="h-4 w-4 text-orange-600" />;
      default:
        return <LogIn className="h-4 w-4" />;
    }
  };

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 text-white border-gray-700' 
    : 'bg-white text-gray-900 border-gray-200';

  if (checkingAuth) {
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
          
          {status === 'unauthenticated' ? (
            <Button
              onClick={handleLoginPrompt}
              className="w-full"
              variant="outline"
            >
              <User className="h-4 w-4 mr-2" />
              Log in to HappyCoins
            </Button>
          ) : (
            <Button
              onClick={handleSignIn}
              disabled={processing || status === 'success'}
              className="w-full"
            >
              {getStatusIcon()}
              <span className="ml-2">
                {processing ? 'Opening popup...' : status === 'success' ? 'Authorized' : 'Authorize'}
              </span>
            </Button>
          )}
          
          {message && (
            <p className={`text-xs ${
              status === 'error' ? 'text-red-600' : 
              status === 'success' ? 'text-green-600' : 
              status === 'unauthenticated' ? 'text-orange-600' :
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
              <span>Logged in as:</span>
              <span className="font-medium text-sm">{user.email}</span>
            </div>
          )}
        </div>

        {status !== 'unauthenticated' && (
          <div className="border rounded-lg p-3 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Secure Authentication:</strong> A popup window will open for secure authorization. 
              Your credentials remain secure.
            </p>
          </div>
        )}

        {status === 'unauthenticated' ? (
          <div className="space-y-3">
            <div className="border rounded-lg p-3 bg-orange-50 border-orange-200">
              <p className="text-sm text-orange-800">
                <strong>Authentication Required:</strong> You need to be logged in to your HappyCoins account 
                before you can authorize this application.
              </p>
            </div>
            <Button
              onClick={handleLoginPrompt}
              className="w-full"
              variant="outline"
            >
              <User className="h-4 w-4 mr-2" />
              Log in to HappyCoins
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleSignIn}
            disabled={processing || status === 'success'}
            className="w-full"
          >
            {getStatusIcon()}
            <span className="ml-2">
              {processing ? 'Opening Authorization Popup...' : status === 'success' ? 'Authorization Complete' : 'Authorize with HappyCoins'}
            </span>
          </Button>
        )}

        {message && status !== 'unauthenticated' && (
          <div className={`p-3 rounded text-sm ${
            status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
