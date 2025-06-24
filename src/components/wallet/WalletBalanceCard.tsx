
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Server, 
  Coins, 
  TrendingUp, 
  Sparkles, 
  ArrowUpRight 
} from 'lucide-react';

interface WalletBalanceCardProps {
  type: 'primary' | 'happy-paisa' | 'rewards' | 'earnings';
  balance: number | string;
  label: string;
  description: string;
  isVisible: boolean;
  isServiceAvailable?: boolean;
}

export function WalletBalanceCard({ 
  type, 
  balance, 
  label, 
  description, 
  isVisible, 
  isServiceAvailable = true 
}: WalletBalanceCardProps) {
  const getCardConfig = () => {
    switch (type) {
      case 'primary':
        return {
          icon: Wallet,
          bgGradient: 'from-primary/5 via-card to-blue-600/5',
          borderColor: 'border-primary/20',
          iconBg: 'from-primary/10 to-primary/20',
          iconColor: 'text-primary',
          textGradient: 'from-primary to-blue-600',
          badge: { text: 'Primary', variant: 'secondary' as const },
          accentColor: 'primary',
          statusIcon: TrendingUp,
          statusText: 'Main wallet currency',
          statusColor: 'text-green-600'
        };
      case 'happy-paisa':
        return {
          icon: Server,
          bgGradient: isServiceAvailable 
            ? 'from-blue-500/5 via-card to-cyan-500/5' 
            : 'from-muted/20 via-card to-muted/10',
          borderColor: isServiceAvailable ? 'border-blue-500/20' : 'border-muted',
          iconBg: 'from-blue-500/10 to-blue-500/20',
          iconColor: 'text-blue-600',
          textGradient: 'from-blue-600 to-cyan-600',
          badge: { text: 'Advanced', variant: 'outline' as const },
          accentColor: 'blue-500',
          statusIcon: Server,
          statusText: 'Ledger service wallet',
          statusColor: 'text-blue-600'
        };
      case 'rewards':
        return {
          icon: Coins,
          bgGradient: 'from-yellow-500/5 via-card to-orange-500/5',
          borderColor: 'border-yellow-500/20',
          iconBg: 'from-yellow-500/10 to-yellow-500/20',
          iconColor: 'text-yellow-600',
          textGradient: 'from-yellow-600 to-orange-600',
          badge: { text: 'Earned', variant: 'secondary' as const },
          accentColor: 'yellow-500',
          statusIcon: Sparkles,
          statusText: 'From activities & offers',
          statusColor: 'text-yellow-600'
        };
      case 'earnings':
        return {
          icon: TrendingUp,
          bgGradient: 'from-green-500/5 via-card to-emerald-500/5',
          borderColor: 'border-green-500/20',
          iconBg: 'from-green-500/10 to-green-500/20',
          iconColor: 'text-green-600',
          textGradient: 'from-green-600 to-emerald-600',
          badge: { text: 'Live', variant: 'secondary' as const },
          accentColor: 'green-500',
          statusIcon: ArrowUpRight,
          statusText: 'Coins earned today',
          statusColor: 'text-green-600'
        };
      default:
        return {
          icon: Wallet,
          bgGradient: 'from-muted/5 via-card to-muted/5',
          borderColor: 'border-muted',
          iconBg: 'from-muted/10 to-muted/20',
          iconColor: 'text-muted-foreground',
          textGradient: 'from-muted-foreground to-muted-foreground',
          badge: { text: 'Unknown', variant: 'secondary' as const },
          accentColor: 'muted',
          statusIcon: TrendingUp,
          statusText: 'Unknown',
          statusColor: 'text-muted-foreground'
        };
    }
  };

  const config = getCardConfig();
  const IconComponent = config.icon;
  const StatusIconComponent = config.statusIcon;

  const cardClassName = `group relative overflow-hidden bg-gradient-to-br ${config.bgGradient} ${config.borderColor} shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] cursor-pointer ${
    !isServiceAvailable && type === 'happy-paisa' ? 'opacity-70' : ''
  }`;

  return (
    <Card className={cardClassName}>
      <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
        type === 'primary' ? 'from-primary/10 via-transparent to-blue-600/10' :
        type === 'happy-paisa' ? (isServiceAvailable ? 'from-blue-500/10 via-transparent to-cyan-500/10' : 'from-muted/10 via-transparent to-muted/5') :
        type === 'rewards' ? 'from-yellow-500/10 via-transparent to-orange-500/10' :
        'from-green-500/10 via-transparent to-emerald-500/10'
      }`}></div>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${config.accentColor}/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500`}></div>
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            {label}
            <Badge 
              variant={config.badge.variant} 
              className={`text-xs px-2 py-0.5 ${
                type === 'happy-paisa' ? 'border-blue-500/30' :
                type === 'rewards' ? 'bg-yellow-500/10 text-yellow-700' :
                type === 'earnings' ? 'bg-green-500/10 text-green-700' : ''
              }`}
            >
              {config.badge.text}
            </Badge>
          </CardTitle>
        </div>
        <div className={`p-3 bg-gradient-to-br ${config.iconBg} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
          <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-3">
        <div className="space-y-1">
          <div className={`text-4xl font-bold bg-gradient-to-r ${config.textGradient} bg-clip-text text-transparent`}>
            {isVisible ? balance : '••••••'}
          </div>
          <p className={`text-xs text-muted-foreground flex items-center gap-1`}>
            <StatusIconComponent className={`h-3 w-3 ${config.statusColor}`} />
            {config.statusText}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
