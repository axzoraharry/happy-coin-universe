
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VirtualCard } from '@/lib/virtualCard/types';

interface VirtualCardInfoProps {
  card: VirtualCard;
}

export function VirtualCardInfo({ card }: VirtualCardInfoProps) {
  // Calculate available balance based on daily limit and spent amount
  const availableBalance = (card.daily_limit - card.current_daily_spent) / 1000; // Convert to HC
  
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">Available Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-primary">{availableBalance.toFixed(2)} HC</p>
          <p className="text-xs text-muted-foreground mt-1">
            ≈ ₹{(card.daily_limit - card.current_daily_spent).toLocaleString('en-IN')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">Daily Limit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">₹{card.daily_limit.toLocaleString('en-IN')}</p>
          <p className="text-xs text-muted-foreground mt-1">
            ≈ {(card.daily_limit / 1000).toFixed(2)} HC
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">Last Used</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">
            {card.last_used_at ? new Date(card.last_used_at).toLocaleDateString() : 'Never'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Transaction date
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
