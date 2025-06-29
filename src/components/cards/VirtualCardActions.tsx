
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Copy, Snowflake, Play } from 'lucide-react';

interface VirtualCard {
  id: string;
  status: 'active' | 'frozen' | 'pending' | 'blocked';
}

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
}

export function VirtualCardActions({
  card,
  showDetails,
  onToggleDetails,
  onCardAction,
  onCopyToClipboard,
  secureDetails
}: VirtualCardActionsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Button
        variant="outline"
        onClick={onToggleDetails}
        className="flex items-center gap-2 h-12"
      >
        {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        {showDetails ? 'Hide Details' : 'Show Details'}
      </Button>

      {showDetails && (
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
        variant={card.status === 'frozen' ? 'default' : 'outline'}
        onClick={() => onCardAction(card.status === 'frozen' ? 'unfreeze' : 'freeze', card.id)}
        className="flex items-center gap-2 h-12"
      >
        {card.status === 'frozen' ? (
          <>
            <Play className="h-4 w-4" />
            Unfreeze
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
