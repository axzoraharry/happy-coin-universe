
import { useSSOAuth } from '@/hooks/useSSOAuth';
import { useSSOMessages } from '@/hooks/useSSOMessages';
import { openAuthPopup, openLoginPopup, monitorPopupClosure } from '@/utils/popupUtils';
import { getStatusIcon } from '@/utils/ssoStatusIcons';
import { SSOLoadingState } from './SSOLoadingState';
import { SSOCompactView } from './SSOCompactView';
import { SSOFullView } from './SSOFullView';

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
  const {
    status,
    setStatus,
    message,
    setMessage,
    processing,
    setProcessing,
    user,
    session,
    checkingAuth
  } = useSSOAuth();

  useSSOMessages({
    state,
    onSuccess,
    onError,
    setStatus,
    setMessage,
    setProcessing
  });

  const getSupabaseUrl = () => {
    return 'https://zygpupmeradizrachnqj.supabase.co';
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
      
      console.log('SSO Widget: Opening authorization popup with URL:', authUrl);
      
      const popup = openAuthPopup(authUrl);
      if (!popup) {
        setStatus('error');
        setMessage('Popup blocked. Please allow popups for this site.');
        setProcessing(false);
        onError?.('Popup blocked');
        return;
      }

      setMessage('Complete authorization in the popup window...');

      monitorPopupClosure(popup, () => {
        if (status === 'processing') {
          setStatus('error');
          setMessage('Authentication was cancelled');
          setProcessing(false);
          onError?.('Authentication cancelled');
        }
      });

    } catch (error) {
      console.error('SSO request failed:', error);
      setStatus('error');
      setMessage('Failed to initiate authorization: ' + (error as Error).message);
      setProcessing(false);
      onError?.('Failed to initiate authentication');
    }
  };

  const handleLoginPrompt = () => {
    const popup = openLoginPopup();

    if (!popup) {
      setStatus('error');
      setMessage('Popup blocked. Please allow popups for this site.');
      return;
    }
  };

  if (checkingAuth) {
    return <SSOLoadingState theme={theme} />;
  }

  if (compact) {
    return (
      <SSOCompactView
        theme={theme}
        status={status}
        message={message}
        processing={processing}
        onLoginPrompt={handleLoginPrompt}
        onSignIn={handleSignIn}
        getStatusIcon={() => getStatusIcon(status)}
      />
    );
  }

  return (
    <SSOFullView
      theme={theme}
      appName={appName}
      scope={scope}
      user={user}
      status={status}
      message={message}
      processing={processing}
      onLoginPrompt={handleLoginPrompt}
      onSignIn={handleSignIn}
      getStatusIcon={() => getStatusIcon(status)}
    />
  );
}
