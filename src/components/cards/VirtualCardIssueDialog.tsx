
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VirtualCardAPI } from '@/lib/virtualCard';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface VirtualCardIssueDialogProps {
  showIssueDialog: boolean;
  setShowIssueDialog: (show: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onCardIssued: () => void;
}

export function VirtualCardIssueDialog({
  showIssueDialog,
  setShowIssueDialog,
  isLoading,
  setIsLoading,
  onCardIssued
}: VirtualCardIssueDialogProps) {
  const [issueForm, setIssueForm] = useState({
    pin: '',
    confirmPin: '',
    dailyLimit: '5000',
    monthlyLimit: '50000'
  });

  const { toast } = useToast();

  const handleIssueCard = async () => {
    if (issueForm.pin !== issueForm.confirmPin) {
      toast({
        title: "Error",
        description: "PINs do not match",
        variant: "destructive"
      });
      return;
    }

    if (!/^\d{4}$/.test(issueForm.pin)) {
      toast({
        title: "Error",
        description: "PIN must be exactly 4 digits",
        variant: "destructive"
      });
      return;
    }

    const dailyLimit = parseFloat(issueForm.dailyLimit);
    const monthlyLimit = parseFloat(issueForm.monthlyLimit);
    
    if (dailyLimit <= 0 || monthlyLimit <= 0) {
      toast({
        title: "Error",
        description: "Limits must be greater than zero",
        variant: "destructive"
      });
      return;
    }
    
    if (dailyLimit > monthlyLimit) {
      toast({
        title: "Error",
        description: "Daily limit cannot exceed monthly limit",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const result = await VirtualCardAPI.issueVirtualCard({
        pin: issueForm.pin,
        daily_limit: dailyLimit,
        monthly_limit: monthlyLimit
      });

      if (result.success) {
        toast({
          title: "Card Issued Successfully",
          description: "Your virtual card has been created and activated",
        });
        
        if (result.card_number && result.cvv && result.expiry_date) {
          const cardNumber = result.card_number.replace(/(\d{4})(?=\d)/g, '$1 ');
          const expiryFormatted = format(new Date(result.expiry_date), 'MM/yy');
          
          toast({
            title: "Card Details (Save These!)",
            description: `Card: ${cardNumber}, CVV: ${result.cvv}, Expires: ${expiryFormatted}`,
            duration: 15000
          });
        }

        setShowIssueDialog(false);
        setIssueForm({ pin: '', confirmPin: '', dailyLimit: '5000', monthlyLimit: '50000' });
        onCardIssued();
      } else {
        throw new Error(result.error || 'Card issuance failed');
      }
    } catch (error) {
      console.error('Card issuance error:', error);
      toast({
        title: "Card Issuance Failed",
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
        <DialogTitle>Issue New Virtual Card</DialogTitle>
        <DialogDescription>
          Create a new virtual debit card with custom limits
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pin">4-Digit PIN</Label>
            <Input
              id="pin"
              type="password"
              maxLength={4}
              value={issueForm.pin}
              onChange={(e) => setIssueForm({...issueForm, pin: e.target.value})}
              placeholder="1234"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPin">Confirm PIN</Label>
            <Input
              id="confirmPin"
              type="password"
              maxLength={4}
              value={issueForm.confirmPin}
              onChange={(e) => setIssueForm({...issueForm, confirmPin: e.target.value})}
              placeholder="1234"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dailyLimit">Daily Limit (HC)</Label>
            <Input
              id="dailyLimit"
              type="number"
              value={issueForm.dailyLimit}
              onChange={(e) => setIssueForm({...issueForm, dailyLimit: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthlyLimit">Monthly Limit (HC)</Label>
            <Input
              id="monthlyLimit"
              type="number"
              value={issueForm.monthlyLimit}
              onChange={(e) => setIssueForm({...issueForm, monthlyLimit: e.target.value})}
            />
          </div>
        </div>
        <Button 
          onClick={handleIssueCard} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Issuing..." : "Issue Card"}
        </Button>
      </div>
    </DialogContent>
  );
}
