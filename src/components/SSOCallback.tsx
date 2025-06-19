
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
      if (code) {
        window.opener.postMessage({
          type: 'SSO_AUTH_SUCCESS',
          code: code,
          returnedState: state
        }, window.location.origin);
      } else if (error) {
        window.opener.postMessage({
          type: 'SSO_AUTH_ERROR',
          error: error
        }, window.location.origin);
      }
      
      // Close the popup
      window.close();
    } else {
      // Fallback - redirect to home or show message
      window.location.href = '/';
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
