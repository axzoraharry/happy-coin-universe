
import { Input } from '@/components/ui/input';

interface SignUpFieldsProps {
  fullName: string;
  setFullName: (fullName: string) => void;
  referralCode: string;
  setReferralCode: (code: string) => void;
}

export function SignUpFields({
  fullName,
  setFullName,
  referralCode,
  setReferralCode,
}: SignUpFieldsProps) {
  return (
    <>
      <div>
        <Input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div>
        <Input
          type="text"
          placeholder="Referral Code (optional)"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          maxLength={8}
        />
        {referralCode && (
          <p className="text-sm text-muted-foreground mt-1">
            You'll earn 100 bonus coins when you sign up!
          </p>
        )}
      </div>
    </>
  );
}
