
import { Button } from '@/components/ui/button';

interface AuthFormActionsProps {
  isSignUp: boolean;
  loading: boolean;
  onSwitchMode: () => void;
}

export function AuthFormActions({
  isSignUp,
  loading,
  onSwitchMode,
}: AuthFormActionsProps) {
  return (
    <>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
      </Button>
      <div className="mt-4 text-center">
        <Button
          variant="link"
          onClick={onSwitchMode}
          className="text-sm"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </Button>
      </div>
    </>
  );
}
