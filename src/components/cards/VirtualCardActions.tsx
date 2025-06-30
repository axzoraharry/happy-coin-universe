
import { Button } from '@/components/ui/button';
import { Copy, Snowflake, Play, Loader2 } from 'lucide-react';
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
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {showDetails && secureDetails.full_number && (
        <>
          <Button
            variant="outline"
            onClick={() => onCopyToClipboard(secureDetails.full_number, 'Card number')}
            className="flex items-center gap-2 h-12"
          >
            <Copy className="h-4 w-4" />
            Copy Number
          </Button>

          <Button
            variant="outline"
            onClick={() => onCopyToClipboard(secureDetails.cvv, 'CVV')}
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
