import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Snowflake, 
  Play, 
  Shield,
  Clock,
  CreditCard,
  Wallet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VirtualCard {
  id: string;
  masked_number: string;
  expiry_date: string;
  status: 'active' | 'frozen' | 'pending' | 'blocked';
  created_at: string;
  spend_limit_daily: number;
  spend_limit_monthly: number;
  balance: number;
  last_used?: string;
}

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'from-green-500 to-emerald-600';
      case 'frozen': return 'from-blue-500 to-cyan-600';
      case 'pending': return 'from-yellow-500 to-orange-600';
      case 'blocked': return 'from-red-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Virtual Card Visual */}
      <div className="relative">
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getStatusColor(card.status)} p-6 text-white shadow-2xl transform transition-all duration-500 hover:scale-[1.02] ${showDetails ? 'animate-pulse' : ''}`}>
          {/* Card Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-20 h-20 border-2 border-white/20 rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-32 h-32 border border-white/10 rounded-full"></div>
          </div>
          
          {/* Card Content */}
          <div className="relative z-10 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-6 w-6" />
                <span className="font-semibold text-lg">Axzora Virtual</span>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {card.status.toUpperCase()}
              </Badge>
            </div>

            {/* Card Number */}
            <div className="space-y-2">
              <p className="text-sm opacity-75">Card Number</p>
              <p className="font-mono text-2xl font-bold tracking-wider">
                {showDetails ? secureDetails.full_number : card.masked_number}
              </p>
            </div>

            {/* Card Details Row */}
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <p className="text-sm opacity-75">Cardholder</p>
                <p className="font-semibold text-lg">
                  {showDetails ? secureDetails.cardholder_name : 'AXZORA USER'}
                </p>
              </div>
              
              <div className="text-right space-y-2">
                <div className="flex gap-6">
                  <div>
                    <p className="text-sm opacity-75">Expires</p>
                    <p className="font-mono font-semibold">{card.expiry_date}</p>
                  </div>
                  {showDetails && (
                    <div>
                      <p className="text-sm opacity-75">CVV</p>
                      <p className="font-mono font-semibold text-xl">{secureDetails.cvv}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timer when details are shown */}
            {showDetails && timeLeft > 0 && (
              <div className="flex items-center gap-2 bg-white/20 rounded-lg p-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Auto-hide in {timeLeft}s</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Actions */}
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
              onClick={() => copyToClipboard(secureDetails.full_number, 'Card number')}
              className="flex items-center gap-2 h-12"
            >
              <Copy className="h-4 w-4" />
              Copy Number
            </Button>

            <Button
              variant="outline"
              onClick={() => copyToClipboard(secureDetails.cvv, 'CVV')}
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

      {/* Card Information */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{card.balance.toFixed(2)} HC</p>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ ₹{(card.balance * 1000).toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Daily Limit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{card.spend_limit_daily.toLocaleString('en-IN')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {(card.spend_limit_daily / 1000).toFixed(2)} HC
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Last Used</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {card.last_used ? new Date(card.last_used).toLocaleDateString() : 'Never'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Transaction date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Notice */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-blue-800">Security Notice</h4>
              <p className="text-sm text-blue-700">
                Card details are encrypted and auto-hidden for security. Never share your card details with anyone. 
                Report suspicious activity immediately.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
