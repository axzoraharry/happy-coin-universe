
import { Badge } from '@/components/ui/badge';
import { Wallet, Clock } from 'lucide-react';
import { CardNumberUtils } from '@/lib/virtualCard/cardNumberUtils';

interface VirtualCard {
  id: string;
  masked_number?: string;
  card_number?: string;
  expiry_date: string;
  status: 'active' | 'frozen' | 'pending' | 'blocked' | 'inactive' | 'expired';
  created_at: string;
  spend_limit_daily?: number;
  spend_limit_monthly?: number;
  daily_limit: number;
  monthly_limit: number;
  balance?: number;
  last_used?: string;
}

interface VirtualCardVisualProps {
  card: VirtualCard;
  showDetails: boolean;
  timeLeft: number;
  secureDetails: {
    full_number: string;
    cvv: string;
    cardholder_name: string;
  };
}

export function VirtualCardVisual({ 
  card, 
  showDetails, 
  timeLeft, 
  secureDetails 
}: VirtualCardVisualProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'from-green-500 to-emerald-600';
      case 'frozen': 
      case 'inactive': return 'from-blue-500 to-cyan-600';
      case 'pending': return 'from-yellow-500 to-orange-600';
      case 'blocked': 
      case 'expired': return 'from-red-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  // Use CardNumberUtils for consistent card number display
  const getDisplayCardNumber = () => {
    if (showDetails && secureDetails.full_number) {
      // When details are shown and we have secure details, use them
      return secureDetails.full_number;
    }
    
    // Always use CardNumberUtils for consistent display
    return CardNumberUtils.getMaskedCardNumber(card.id);
  };

  return (
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
              {getDisplayCardNumber()}
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
                {showDetails && secureDetails.cvv && (
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
  );
}
