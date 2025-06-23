
import { Loader2 } from 'lucide-react';

interface SSOLoadingStateProps {
  theme?: 'light' | 'dark';
}

export function SSOLoadingState({ theme = 'light' }: SSOLoadingStateProps) {
  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 text-white border-gray-700' 
    : 'bg-white text-gray-900 border-gray-200';

  return (
    <div className={`p-4 rounded-lg border ${themeClasses} max-w-sm`}>
      <div className="flex items-center justify-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Checking authentication...</span>
      </div>
    </div>
  );
}
