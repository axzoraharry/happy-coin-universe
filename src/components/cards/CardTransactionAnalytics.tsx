
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, AlertCircle, DollarSign, CreditCard, BarChart3 } from 'lucide-react';
import { EnhancedTransactionService, TransactionAnalytics } from '@/lib/virtualCard/enhancedTransactionService';
import { useToast } from '@/hooks/use-toast';

interface CardTransactionAnalyticsProps {
  cardId?: string;
  refreshTrigger?: number;
}

export function CardTransactionAnalytics({ cardId, refreshTrigger }: CardTransactionAnalyticsProps) {
  const [analytics, setAnalytics] = useState<TransactionAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [cardId, refreshTrigger]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await EnhancedTransactionService.getTransactionAnalytics(cardId);
      setAnalytics(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load transaction analytics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSuccessRate = (analytics: TransactionAnalytics) => {
    if (analytics.total_transactions === 0) return 0;
    return ((analytics.total_transactions - analytics.failed_transactions) / analytics.total_transactions * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'inactive': return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
      case 'blocked': return 'bg-red-500/10 text-red-700 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (analytics.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No transaction analytics available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Transaction Analytics</h3>
        <Button onClick={loadAnalytics} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {analytics.map((cardAnalytics) => (
          <Card key={cardAnalytics.card_id} className="border-l-4 border-l-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <CardTitle className="text-sm font-medium">
                    {cardAnalytics.masked_card_number}
                  </CardTitle>
                </div>
                <Badge className={getStatusColor(cardAnalytics.card_status)}>
                  {cardAnalytics.card_status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{cardAnalytics.total_transactions}</div>
                  <div className="text-xs text-muted-foreground">Total Transactions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{cardAnalytics.total_purchases} HC</div>
                  <div className="text-xs text-muted-foreground">Total Purchases</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{cardAnalytics.total_refunds} HC</div>
                  <div className="text-xs text-muted-foreground">Total Refunds</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{getSuccessRate(cardAnalytics).toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                </div>
              </div>

              <Separator />

              {/* Spending Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Daily Spending</span>
                  </div>
                  <div className="text-lg font-semibold">{cardAnalytics.daily_spent} HC</div>
                  <div className="text-xs text-muted-foreground">
                    {cardAnalytics.daily_transactions} transactions today
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Monthly Spending</span>
                  </div>
                  <div className="text-lg font-semibold">{cardAnalytics.monthly_spent} HC</div>
                  <div className="text-xs text-muted-foreground">This month</div>
                </div>
              </div>

              <Separator />

              {/* Status Indicators */}
              <div className="space-y-2">
                {cardAnalytics.failed_transactions > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{cardAnalytics.failed_transactions} failed transactions</span>
                  </div>
                )}
                
                {cardAnalytics.last_transaction_at && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">
                      Last transaction: {new Date(cardAnalytics.last_transaction_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
