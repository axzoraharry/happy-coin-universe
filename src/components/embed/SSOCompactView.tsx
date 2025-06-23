
import { Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SSOCompactViewProps {
  theme?: 'light' | 'dark';
  status: 'idle' | 'processing' | 'success' | 'error' | 'unauthenticated';
  message: string;
  processing: boolean;
  onLoginPrompt: () => void;
  onSignIn: () => void;
  getStatusIcon: () => React.ReactNode;
}

export function SSOCompactView({
  theme = 'light',
  status,
  message,
  processing,
  onLoginPrompt,
  onSignIn,
  getStatusIcon
}: SSOCompactViewProps) {
  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 text-white border-gray-700' 
    : 'bg-white text-gray-900 border-gray-200';

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
            onClick={onLoginPrompt}
            className="w-full"
            variant="outline"
          >
            <User className="h-4 w-4 mr-2" />
            Log in to HappyCoins
          </Button>
        ) : (
          <Button
            onClick={onSignIn}
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
