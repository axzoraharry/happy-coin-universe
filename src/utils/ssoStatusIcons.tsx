
import { Loader2, LogIn, CheckCircle, XCircle, User } from 'lucide-react';

export const getStatusIcon = (status: 'idle' | 'processing' | 'success' | 'error' | 'unauthenticated') => {
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
