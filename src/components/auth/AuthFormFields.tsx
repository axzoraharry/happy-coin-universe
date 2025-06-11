
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SignUpFields } from './SignUpFields';
import { SignInAlert } from './SignInAlert';
import { AuthFormActions } from './AuthFormActions';

interface AuthFormFieldsProps {
  isSignUp: boolean;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  fullName: string;
  setFullName: (fullName: string) => void;
  referralCode: string;
  setReferralCode: (code: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchMode: () => void;
}

export function AuthFormFields({
  isSignUp,
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  referralCode,
  setReferralCode,
  loading,
  onSubmit,
  onSwitchMode,
}: AuthFormFieldsProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
        <CardDescription>
          {isSignUp ? 'Create your digital wallet account' : 'Welcome back to your digital wallet'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {isSignUp && (
            <SignUpFields
              fullName={fullName}
              setFullName={setFullName}
              referralCode={referralCode}
              setReferralCode={setReferralCode}
            />
          )}
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password (minimum 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          
          {!isSignUp && <SignInAlert />}

          <AuthFormActions
            isSignUp={isSignUp}
            loading={loading}
            onSwitchMode={onSwitchMode}
          />
        </form>
      </CardContent>
    </Card>
  );
}
