
import { VirtualCardTransaction } from '@/lib/virtualCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';

interface CardTransactionsProps {
  transactions: VirtualCardTransaction[];
  isLoading: boolean;
}

export function CardTransactions({ transactions, isLoading }: CardTransactionsProps) {
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'refund': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'activation': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'deactivation': return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ArrowUpDown className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <Card key={transaction.id} className="border-l-4 border-l-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge className={getTransactionTypeColor(transaction.transaction_type)}>
                {transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1)}
              </Badge>
              {transaction.amount > 0 && (
                <span className="font-semibold">{transaction.amount} HC</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {transaction.description || 'No description'}
            </p>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
