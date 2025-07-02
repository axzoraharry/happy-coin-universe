
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Calendar, CheckCircle, PowerOff, AlertTriangle, Clock, CreditCard, Copy } from 'lucide-react';
import { VirtualCard } from '@/lib/virtualCard';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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
      // When visible, show the masked card number or generate a consistent numeric display
      if (card.masked_card_number) {
        return card.masked_card_number;
      } else {
        // Generate a consistent 16-digit card number based on card ID for display
        const cardIdHash = card.id.replace(/-/g, '').substring(0, 16);
        const paddedHash = (cardIdHash + '0000000000000000').substring(0, 16);
        // Ensure all characters are numeric by converting any non-numeric to numbers
        const numericOnly = paddedHash.split('').map(char => {
          const code = char.charCodeAt(0);
          return (code % 10).toString();
        }).join('');
        return `4000 ${numericOnly.substring(4, 8)} ${numericOnly.substring(8, 12)} ${numericOnly.substring(12, 16)}`;
      }
    }
    
    // When hidden, show fully masked version
    return `**** **** **** ****`;
  };

  const getFullCardNumber = (card: VirtualCard) => {
    // Generate the full card number for copying (same logic as display when visible)
    if (card.masked_card_number && card.masked_card_number.includes('****')) {
      // If we have a proper masked number, generate the full version
      const cardIdHash = card.id.replace(/-/g, '').substring(0, 16);
      const paddedHash = (cardIdHash + '0000000000000000').substring(0, 16);
      const numericOnly = paddedHash.split('').map(char => {
        const code = char.charCodeAt(0);
        return (code % 10).toString();
      }).join('');
      return `4000${numericOnly.substring(4, 16)}`;
    }
    
    // Fallback: use the masked card number if available
    return card.masked_card_number?.replace(/\s/g, '') || `4000000000000000`;
  };

  const handleCopyCardNumber = async (card: VirtualCard, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const fullCardNumber = getFullCardNumber(card);
      await navigator.clipboard.writeText(fullCardNumber);
      
      toast({
        title: "Copied!",
        description: "Card number copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy card number:', error);
      toast({
        title: "Copy Failed",
        description: "Unable to copy card number to clipboard",
        variant: "destructive",
      });
    }
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
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCardNumberVisibility(card.id);
                      }}
                      className="h-8 w-8 p-0"
                      title={visibleCardNumbers.has(card.id) ? "Hide card number" : "Show card number"}
                    >
                      {visibleCardNumbers.has(card.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleCopyCardNumber(card, e)}
                      className="h-8 w-8 p-0"
                      title="Copy card number"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
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
