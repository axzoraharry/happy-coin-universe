
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Copy, Snowflake, Play, Loader2 } from 'lucide-react';
import { VirtualCard } from '@/lib/virtualCard';

interface VirtualCardActionsProps {
  card: VirtualCard;
  showDetails: boolean;
  onToggleDetails: () => void;
  onCardAction: (action: string, cardId: string) => void;
  onCopyToClipboard: (text: string, label: string) => void;
  secureDetails: {
    full_number: string;
    cvv: string;
  };
  isLoadingSecure?: boolean;
}

export function VirtualCardActions({
  card,
  showDetails,
  onToggleDetails,
  onCardAction,
  onCopyToClipboard,
  secureDetails,
  isLoadingSecure = false
}: VirtualCardActionsProps) {
  
  const handleCopyCardNumber = () => {
    // Use the actual card number from secure details if available, otherwise use from card data
    const cardNumber = secureDetails.full_number || card.card_number || card.masked_card_number || '';
    onCopyToClipboard(cardNumber.replace(/\s/g, ''), 'Card number');
  };

  const handleCopyCVV = () => {
    // Use the CVV from secure details
    const cvv = secureDetails.cvv || '';
    onCopyToClipboard(cvv, 'CVV');
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Button
        variant="outline"
        onClick={onToggleDetails}
        className="flex items-center gap-2 h-12"
        disabled={isLoadingSecure}
      >
        {isLoadingSecure ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : showDetails ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
        {isLoadingSecure ? 'Loading...' : showDetails ? 'Hide Details' : 'Show Details'}
      </Button>

      {showDetails && (
        <>
          <Button
            variant="outline"
            onClick={handleCopyCardNumber}
            className="flex items-center gap-2 h-12"
          >
            <Copy className="h-4 w-4" />
            Copy Number
          </Button>

          <Button
            variant="outline"
            onClick={handleCopyCVV}
            className="flex items-center gap-2 h-12"
          >
            <Copy className="h-4 w-4" />
            Copy CVV
          </Button>
        </>
      )}

      <Button
        variant={card.status === 'inactive' ? 'default' : 'outline'}
        onClick={() => onCardAction(card.status === 'inactive' ? 'unfreeze' : 'freeze', card.id)}
        className="flex items-center gap-2 h-12"
      >
        {card.status === 'inactive' ? (
          <>
            <Play className="h-4 w-4" />
            Activate
          </>
        ) : (
          <>
            <Snowflake className="h-4 w-4" />
            Freeze Card
          </>
        )}
      </Button>
    </div>
  );
}
