
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { VirtualCard } from '@/lib/virtualCard';
import { VirtualCardVisual } from './VirtualCardVisual';
import { VirtualCardActions } from './VirtualCardActions';
import { VirtualCardInfo } from './VirtualCardInfo';
import { VirtualCardSecurityNotice } from './VirtualCardSecurityNotice';

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
  const { toast } = useToast();

  // Mock secure card details - In production, these would come from secure API
  const secureDetails = {
    full_number: '4532 1234 5678 1234',
    cvv: '123',
    cardholder_name: 'AXZORA USER'
  };

  useEffect(() => {
    if (showDetails) {
      const timer = setTimeout(() => {
        onToggleDetails();
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
  }, [showDetails, onToggleDetails, detailsTimer, toast]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Transform the card data to match the expected format for VirtualCardVisual
  const visualCard = {
    id: card.id,
    masked_number: card.card_number || `**** **** **** ${card.id.slice(-4)}`,
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

  // Transform the card data for VirtualCardInfo component
  const infoCard = {
    balance: (card.daily_limit - card.current_daily_spent) || card.daily_limit,
    spend_limit_daily: card.daily_limit,
    last_used: card.last_used_at
  };

  return (
    <div className="space-y-6">
      <VirtualCardVisual
        card={visualCard}
        showDetails={showDetails}
        timeLeft={timeLeft}
        secureDetails={secureDetails}
      />

      <VirtualCardActions
        card={card}
        showDetails={showDetails}
        onToggleDetails={onToggleDetails}
        onCardAction={onCardAction}
        onCopyToClipboard={copyToClipboard}
        secureDetails={secureDetails}
      />

      <VirtualCardInfo card={infoCard} />

      <VirtualCardSecurityNotice />
    </div>
  );
}
