
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VirtualCardAPI } from '@/lib/virtualCard';
import { useToast } from '@/hooks/use-toast';

interface VirtualCardValidationDialogProps {
  showValidationDialog: boolean;
  setShowValidationDialog: (show: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function VirtualCardValidationDialog({
  showValidationDialog,
  setShowValidationDialog,
  isLoading,
  setIsLoading
}: VirtualCardValidationDialogProps) {
  const [validationForm, setValidationForm] = useState({
    cardNumber: '',
    pin: ''
  });

  const { toast } = useToast();

  const handleValidateCard = async () => {
    if (!/^\d{16}$/.test(validationForm.cardNumber)) {
      toast({
        title: "Error",
        description: "Card number must be 16 digits",
        variant: "destructive"
      });
      return;
    }
    
    if (!/^\d{4}$/.test(validationForm.pin)) {
      toast({
        title: "Error",
        description: "PIN must be 4 digits",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const result = await VirtualCardAPI.validateCard({
        card_number: validationForm.cardNumber,
        pin: validationForm.pin,
        ip_address: window.location.hostname,
        user_agent: navigator.userAgent
      });

      if (result.success) {
        toast({
          title: "Card Validation Successful",
          description: `Card is valid and active. Daily limit: ${result.daily_limit}, Spent: ${result.daily_spent}`,
        });
      } else {
        toast({
          title: "Card Validation Failed",
          description: result.error || "Invalid card details",
          variant: "destructive"
        });
      }

      setShowValidationDialog(false);
      setValidationForm({ cardNumber: '', pin: '' });
    } catch (error) {
      console.error('Card validation error:', error);
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Validate Virtual Card</DialogTitle>
        <DialogDescription>
          Check if a card number and PIN combination is valid
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cardNumber">Card Number</Label>
          <Input
            id="cardNumber"
            type="text"
            maxLength={16}
            value={validationForm.cardNumber}
            onChange={(e) => setValidationForm({...validationForm, cardNumber: e.target.value})}
            placeholder="4000123456789012"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="validationPin">PIN</Label>
          <Input
            id="validationPin"
            type="password"
            maxLength={4}
            value={validationForm.pin}
            onChange={(e) => setValidationForm({...validationForm, pin: e.target.value})}
            placeholder="1234"
          />
        </div>
        <Button 
          onClick={handleValidateCard} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Validating..." : "Validate Card"}
        </Button>
      </div>
    </DialogContent>
  );
}
