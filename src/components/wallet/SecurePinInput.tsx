
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Shield } from 'lucide-react';

interface SecurePinInputProps {
  onPinEntered: (pin: string) => void;
  onCancel: () => void;
  isVerifying?: boolean;
  title?: string;
  description?: string;
}

export function SecurePinInput({ 
  onPinEntered, 
  onCancel, 
  isVerifying = false,
  title = "Enter PIN",
  description = "Enter your 4-digit transaction PIN to proceed"
}: SecurePinInputProps) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 4) {
      onPinEntered(pin);
      setPin(''); // Clear PIN after submission
    }
  };

  const handlePinChange = (value: string) => {
    // Only allow digits and max 4 characters
    const digitOnly = value.replace(/\D/g, '').slice(0, 4);
    setPin(digitOnly);
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg bg-card">
      <div className="flex items-center space-x-2 text-center">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      
      <p className="text-sm text-muted-foreground text-center">
        {description}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pin">Transaction PIN</Label>
          <div className="relative">
            <Input
              id="pin"
              type={showPin ? "text" : "password"}
              placeholder="••••"
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              maxLength={4}
              className="text-center text-lg tracking-widest pr-10"
              autoComplete="off"
              disabled={isVerifying}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPin(!showPin)}
              disabled={isVerifying}
            >
              {showPin ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isVerifying}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={pin.length !== 4 || isVerifying}
            className="flex-1"
          >
            {isVerifying ? 'Verifying...' : 'Confirm'}
          </Button>
        </div>
      </form>
    </div>
  );
}
