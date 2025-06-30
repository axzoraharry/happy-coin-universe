import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { VirtualCard } from '@/lib/virtualCard';
import { VirtualCardVisual } from './VirtualCardVisual';
import { VirtualCardActions } from './VirtualCardActions';
import { VirtualCardInfo } from './VirtualCardInfo';
import { VirtualCardSecurityNotice } from './VirtualCardSecurityNotice';
import { SecurePinDialog } from './SecurePinDialog';
import { SecureCardService, SecureCardDetails } from '@/lib/virtualCard/secureCardService';

interface VirtualCardDisplayProps {
  card: VirtualCard;
  showDetails: boolean;
  onToggleDetails: () => void;
  onCardAction: (action: string, cardId: string) => void;
}

export function VirtualCardDisplay({ 
  card, 
  showDetails, 
  onToggleDetails, 
  onCardAction 
}: VirtualCardDisplayProps) {
  const [detailsTimer, setDetailsTimer] = useState<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'view' | 'copy_number' | 'copy_cvv' | null>(null);
  const [secureDetails, setSecureDetails] = useState<SecureCardDetails | null>(null);
  const [isLoadingSecure, setIsLoadingSecure] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (showDetails && secureDetails?.success) {
      const timer = setTimeout(() => {
        onToggleDetails();
        setSecureDetails(null);
        toast({
          title: "Card Details Hidden",
          description: "For security, card details are automatically hidden after 30 seconds",
        });
      }, 30000);

      setDetailsTimer(timer);
      setTimeLeft(30);

      const countdown = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdown);
      };
    } else {
      if (detailsTimer) {
        clearTimeout(detailsTimer);
        setDetailsTimer(null);
      }
      setTimeLeft(0);
    }
  }, [showDetails, secureDetails, onToggleDetails, detailsTimer, toast]);

  const handleToggleDetails = () => {
    if (showDetails) {
      // Hide details
      onToggleDetails();
      setSecureDetails(null);
    } else {
      // Show PIN dialog to get secure details
      setPendingAction('view');
      setShowPinDialog(true);
    }
  };

  const handlePinVerified = async (pin: string) => {
    setIsLoadingSecure(true);
    
    try {
      const details = await SecureCardService.getSecureCardDetails(card.id, pin);
      
      if (details.success) {
        setSecureDetails(details);
        onToggleDetails();
        
        toast({
          title: "Card Details Retrieved",
          description: "Secure details will be hidden automatically after 30 seconds",
        });
      } else {
        toast({
          title: "Access Denied",
          description: details.error || "Failed to retrieve card details",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('PIN verification failed:', error);
      toast({
        title: "Verification Failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSecure(false);
      setPendingAction(null);
    }
  };

  const handleCopyToClipboard = async (text: string, label: string, actionType: 'copy_number' | 'copy_cvv') => {
    if (!secureDetails?.success) {
      // Need to get secure details first
      setPendingAction(actionType);
      setShowPinDialog(true);
      return;
    }

    const result = await SecureCardService.copyToClipboardSecure(text, label, card.id, actionType);
    
    if (result.success) {
      toast({
        title: "Copied",
        description: `${label} copied to clipboard`,
      });
    } else {
      toast({
        title: "Copy Failed",
        description: result.error || "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handlePinVerifiedForCopy = async (pin: string) => {
    setIsLoadingSecure(true);
    
    try {
      const details = await SecureCardService.getSecureCardDetails(card.id, pin);
      
      if (details.success) {
        setSecureDetails(details);
        
        // Perform the pending copy action
        if (pendingAction === 'copy_number' && details.card_number) {
          await handleCopyToClipboard(details.card_number, 'Card number', 'copy_number');
        } else if (pendingAction === 'copy_cvv' && details.cvv) {
          await handleCopyToClipboard(details.cvv, 'CVV', 'copy_cvv');
        }
      } else {
        toast({
          title: "Access Denied",
          description: details.error || "Failed to retrieve card details",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('PIN verification failed:', error);
      toast({
        title: "Verification Failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSecure(false);
      setPendingAction(null);
    }
  };

  // Transform the card data to match the expected format for VirtualCardVisual
  const visualCard = {
    id: card.id,
    masked_number: card.masked_card_number || `**** **** **** ${card.id.slice(-4)}`,
    card_number: card.card_number,
    expiry_date: card.expiry_date,
    status: card.status,
    created_at: card.created_at,
    spend_limit_daily: card.daily_limit,
    spend_limit_monthly: card.monthly_limit,
    daily_limit: card.daily_limit,
    monthly_limit: card.monthly_limit,
    balance: card.current_daily_spent || 0,
    last_used: card.last_used_at
  };

  const getActionDescription = () => {
    switch (pendingAction) {
      case 'view': return 'view card details';
      case 'copy_number': return 'copy card number';
      case 'copy_cvv': return 'copy CVV';
      default: return 'perform this action';
    }
  };

  return (
    <div className="space-y-6">
      <VirtualCardVisual
        card={visualCard}
        showDetails={showDetails}
        timeLeft={timeLeft}
        secureDetails={secureDetails?.success ? {
          full_number: secureDetails.card_number || '',
          cvv: secureDetails.cvv || '',
          cardholder_name: secureDetails.cardholder_name || 'AXZORA USER'
        } : {
          full_number: '',
          cvv: '',
          cardholder_name: 'AXZORA USER'
        }}
      />

      <VirtualCardActions
        card={card}
        showDetails={showDetails}
        onToggleDetails={handleToggleDetails}
        onCardAction={onCardAction}
        onCopyToClipboard={(text, label) => {
          if (label.includes('number')) {
            handleCopyToClipboard(text, label, 'copy_number');
          } else if (label.includes('CVV')) {
            handleCopyToClipboard(text, label, 'copy_cvv');
          }
        }}
        secureDetails={secureDetails?.success ? {
          full_number: secureDetails.card_number || '',
          cvv: secureDetails.cvv || ''
        } : {
          full_number: '',
          cvv: ''
        }}
        isLoadingSecure={isLoadingSecure}
      />

      <VirtualCardInfo card={card} />

      <VirtualCardSecurityNotice />

      <SecurePinDialog
        isOpen={showPinDialog}
        onClose={() => {
          setShowPinDialog(false);
          setPendingAction(null);
        }}
        onPinVerified={pendingAction === 'view' ? handlePinVerified : handlePinVerifiedForCopy}
        cardId={card.id}
        actionDescription={getActionDescription()}
      />
    </div>
  );
}
