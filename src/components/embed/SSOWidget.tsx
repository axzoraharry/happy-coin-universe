
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogIn, CheckCircle, XCircle, Shield } from 'lucide-react';

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
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  const getSupabaseUrl = () => {
    // Use the production Supabase URL
    return 'https://zygpupmeradizrachnqj.supabase.co';
  };

  useEffect(() => {
    // Check if we're returning from auth
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
  }, [state, onSuccess, onError]);

  const handleSignIn = async () => {
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
      window.location.href = authUrl;

    } catch (error) {
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
      default:
        return <LogIn className="h-4 w-4" />;
    }
  };

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 text-white border-gray-700' 
    : 'bg-white text-gray-900 border-gray-200';

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
          
          <Button
            onClick={handleSignIn}
            disabled={processing || status === 'success'}
            className="w-full"
          >
            {getStatusIcon()}
            <span className="ml-2">
              {processing ? 'Signing in...' : status === 'success' ? 'Signed In' : 'Sign In'}
            </span>
          </Button>
          
          {message && (
            <p className={`text-xs ${status === 'error' ? 'text-red-600' : status === 'success' ? 'text-green-600' : 'text-gray-600'}`}>
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
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Secure Authentication:</strong> Sign in using your HappyCoins wallet credentials. 
            Your login information is encrypted and secure.
          </p>
        </div>

        <Button
          onClick={handleSignIn}
          disabled={processing || status === 'success'}
          className="w-full"
        >
          {getStatusIcon()}
          <span className="ml-2">
            {processing ? 'Authenticating...' : status === 'success' ? 'Authentication Complete' : 'Sign In with HappyCoins'}
          </span>
        </Button>

        {message && (
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
