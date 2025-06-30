
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SecurePinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPinVerified: (pin: string) => void;
  cardId: string;
  actionDescription: string;
}

export function SecurePinDialog({
  isOpen,
  onClose,
  onPinVerified,
  cardId,
  actionDescription
}: SecurePinDialogProps) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 4 digits",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    
    try {
      onPinVerified(pin);
      setPin('');
      onClose();
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPin('');
    setShowPin(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security Verification
          </DialogTitle>
          <DialogDescription>
            Please enter your 4-digit PIN to {actionDescription}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">Transaction PIN</Label>
            <div className="relative">
              <Input
                id="pin"
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="****"
                maxLength={4}
                className="pr-10 text-center text-lg tracking-widest"
                disabled={isVerifying}
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPin(!showPin)}
                disabled={isVerifying}
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
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
              {isVerifying ? "Verifying..." : "Verify"}
            </Button>
          </div>
        </form>
        
        <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="h-3 w-3 mt-0.5 text-primary" />
            <div>
              <p className="font-medium">Security Notice</p>
              <p>Your PIN is required to access sensitive card information. This action will be logged for security purposes.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
