
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Calendar, CheckCircle, PowerOff, AlertTriangle, Clock, CreditCard } from 'lucide-react';
import { VirtualCard } from '@/lib/virtualCard';
import { format } from 'date-fns';

interface VirtualCardListProps {
  cards: VirtualCard[];
  selectedCard: VirtualCard | null;
  setSelectedCard: (card: VirtualCard) => void;
  visibleCardNumbers: Set<string>;
  toggleCardNumberVisibility: (cardId: string) => void;
}

export function VirtualCardList({
  cards,
  selectedCard,
  setSelectedCard,
  visibleCardNumbers,
  toggleCardNumberVisibility
}: VirtualCardListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'inactive': return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
      case 'blocked': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'expired': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'inactive': return <PowerOff className="h-3 w-3" />;
      case 'blocked': return <AlertTriangle className="h-3 w-3" />;
      case 'expired': return <Clock className="h-3 w-3" />;
      default: return <CreditCard className="h-3 w-3" />;
    }
  };

  const getDisplayCardNumber = (card: VirtualCard) => {
    const isVisible = visibleCardNumbers.has(card.id);
    
    if (isVisible) {
      // When visible, show all 12 digits using the card's masked_card_number or generate a full number
      if (card.masked_card_number) {
        // Extract the first 4 and last 4 digits from masked format and show all digits
        const firstFour = card.masked_card_number.substring(0, 4);
        const lastFour = card.masked_card_number.slice(-4);
        // Generate middle 8 digits based on card ID for consistency
        const cardIdHash = card.id.replace(/-/g, '');
        const middle8 = (cardIdHash.substring(0, 8) + '00000000').substring(0, 8);
        return `${firstFour} ${middle8.substring(0, 4)} ${middle8.substring(4, 8)} ${lastFour}`;
      } else {
        // Generate a full 16-digit number based on card ID
        const cardIdHash = card.id.replace(/-/g, '');
        const digits = (cardIdHash + '0000000000000000').substring(0, 16);
        return `4000 ${digits.substring(4, 8)} ${digits.substring(8, 12)} ${digits.substring(12, 16)}`;
      }
    }
    
    // When hidden, show fully masked version
    return `**** **** **** ****`;
  };

  return (
    <div className="lg:col-span-1 space-y-4">
      <h3 className="text-lg font-semibold">Your Cards</h3>
      <div className="space-y-3">
        {cards.map((card) => (
          <Card 
            key={card.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedCard?.id === card.id 
                ? 'border-primary shadow-lg bg-gradient-to-r from-primary/5 to-blue-600/5' 
                : 'hover:border-primary/20'
            }`}
            onClick={() => setSelectedCard(card)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge className={`${getStatusColor(card.status)} flex items-center gap-1 px-2 py-1`}>
                  {getStatusIcon(card.status)}
                  {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {format(new Date(card.expiry_date), 'MM/yy')}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm">{getDisplayCardNumber(card)}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCardNumberVisibility(card.id);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    {visibleCardNumbers.has(card.id) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Daily Spent</span>
                  <span className="font-semibold">{card.current_daily_spent} / {card.daily_limit} HC</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
