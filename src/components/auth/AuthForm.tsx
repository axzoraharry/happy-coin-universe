
import { useAuthForm } from '@/hooks/useAuthForm';
import { EmailConfirmation } from './EmailConfirmation';
import { AuthFormFields } from './AuthFormFields';

export function AuthForm() {
  const {
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
    needsConfirmation,
    setNeedsConfirmation,
    handleAuth,
    switchMode,
  } = useAuthForm();

  const handleReturnToSignIn = () => {
    setNeedsConfirmation(false);
    switchMode();
  };

  if (needsConfirmation) {
    return (
      <EmailConfirmation 
        email={email}
        referralCode={referralCode}
        onReturnToSignIn={handleReturnToSignIn}
      />
    );
  }

  return (
    <AuthFormFields
      isSignUp={isSignUp}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      fullName={fullName}
      setFullName={setFullName}
      referralCode={referralCode}
      setReferralCode={setReferralCode}
      loading={loading}
      onSubmit={handleAuth}
      onSwitchMode={switchMode}
    />
  );
}
