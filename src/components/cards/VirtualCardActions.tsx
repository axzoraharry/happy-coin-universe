
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

// Store generated card numbers to ensure consistency across components
const cardNumbersCache = new Map();

const getConsistentCardNumber = (card: VirtualCard) => {
  // Check cache first
  if (cardNumbersCache.has(card.id)) {
    return cardNumbersCache.get(card.id);
  }

  // Generate a consistent 16-digit card number based on card ID
  const cardIdHash = card.id.replace(/-/g, '').substring(0, 16);
  const paddedHash = (cardIdHash + '0000000000000000').substring(0, 16);
  
  // Ensure all characters are numeric by converting any non-numeric to numbers
  const numericOnly = paddedHash.split('').map(char => {
    const code = char.charCodeAt(0);
    return (code % 10).toString();
  }).join('');
  
  const fullCardNumber = `4000${numericOnly.substring(4, 16)}`;
  
  // Cache the result
  cardNumbersCache.set(card.id, fullCardNumber);
  
  return fullCardNumber;
};

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
    const consistentCardNumber = getConsistentCardNumber(card);
    onCopyToClipboard(consistentCardNumber, 'Card number');
  };

  const handleCopyCVV = () => {
    // Generate consistent CVV based on card ID
    const cardIdHash = card.id.replace(/-/g, '');
    const cvvHash = cardIdHash.substring(0, 3);
    const numericCVV = cvvHash.split('').map(char => {
      const code = char.charCodeAt(0);
      return (code % 10).toString();
    }).join('');
    const consistentCVV = numericCVV.padStart(3, '0');
    
    onCopyToClipboard(consistentCVV, 'CVV');
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
