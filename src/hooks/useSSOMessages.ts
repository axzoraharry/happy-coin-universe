
import { useEffect } from 'react';

interface UseSSOMessagesProps {
  state?: string;
  onSuccess?: (authCode: string) => void;
  onError?: (error: string) => void;
  setStatus: (status: 'idle' | 'processing' | 'success' | 'error' | 'unauthenticated') => void;
  setMessage: (message: string) => void;
  setProcessing: (processing: boolean) => void;
}

export function useSSOMessages({
  state,
  onSuccess,
  onError,
  setStatus,
  setMessage,
  setProcessing
}: UseSSOMessagesProps) {
  useEffect(() => {
    // Listen for messages from popup window
    const handleMessage = (event: MessageEvent) => {
      // Accept messages from any origin for better compatibility
      console.log('SSO Widget: Received message:', event.data, 'from origin:', event.origin);

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
  }, [state, onSuccess, onError, setStatus, setMessage, setProcessing]);
}
