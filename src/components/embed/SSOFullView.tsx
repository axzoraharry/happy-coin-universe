
import { Shield, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SSOFullViewProps {
  theme?: 'light' | 'dark';
  appName?: string;
  scope?: string;
  user: any;
  status: 'idle' | 'processing' | 'success' | 'error' | 'unauthenticated';
  message: string;
  processing: boolean;
  onLoginPrompt: () => void;
  onSignIn: () => void;
  getStatusIcon: () => React.ReactNode;
}

export function SSOFullView({
  theme = 'light',
  appName = 'Application',
  scope = 'profile email',
  user,
  status,
  message,
  processing,
  onLoginPrompt,
  onSignIn,
  getStatusIcon
}: SSOFullViewProps) {
  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 text-white border-gray-700' 
    : 'bg-white text-gray-900 border-gray-200';

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
              onClick={onLoginPrompt}
              className="w-full"
              variant="outline"
            >
              <User className="h-4 w-4 mr-2" />
              Log in to HappyCoins
            </Button>
          </div>
        ) : (
          <Button
            onClick={onSignIn}
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
