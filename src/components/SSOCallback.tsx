
import { useEffect } from 'react';

export function SSOCallback() {
  useEffect(() => {
    // Extract parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const state = urlParams.get('state');

    if (window.opener) {
      // We're in a popup window, send message to parent
      const message = code ? {
        type: 'SSO_AUTH_SUCCESS',
        code: code,
        returnedState: state
      } : {
        type: 'SSO_AUTH_ERROR',
        error: error || 'Unknown error'
      };

      // Try multiple target origins to ensure message delivery
      const targetOrigins = [
        window.location.origin,
        'https://id-preview--b1724132-5093-46b8-bbdf-fbe0a6be2771.lovable.app',
        '*'
      ];

      let messageSent = false;
      for (const origin of targetOrigins) {
        try {
          window.opener.postMessage(message, origin);
          console.log('SSO Callback: Message sent to origin:', origin);
          messageSent = true;
        } catch (e) {
          console.log('SSO Callback: Failed to send message to origin:', origin, e.message);
        }
      }

      if (!messageSent) {
        console.error('SSO Callback: Failed to send message to any target origin');
      }
      
      // Close the popup after a short delay
      setTimeout(() => {
        window.close();
      }, 1000);
    } else {
      // Fallback - redirect to home or show message
      if (code) {
        // Success - could redirect to a success page or home
        window.location.href = '/?sso_success=true';
      } else {
        // Error - redirect to home with error
        window.location.href = '/?sso_error=' + encodeURIComponent(error || 'Authentication failed');
      }
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Processing authentication...</h2>
        <p className="text-blue-100">This window will close automatically.</p>
      </div>
    </div>
  );
}
