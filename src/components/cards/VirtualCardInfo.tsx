
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VirtualCard {
  balance: number;
  spend_limit_daily: number;
  last_used?: string;
}

interface VirtualCardInfoProps {
  card: VirtualCard;
}

export function VirtualCardInfo({ card }: VirtualCardInfoProps) {
  return (
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
  );
}
