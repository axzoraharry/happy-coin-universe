
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw, Server } from 'lucide-react';
import { useHappyPaisaStellar } from '@/hooks/useHappyPaisaStellar';
import { Badge } from '@/components/ui/badge';

export function HappyPaisaDashboard() {
  const { account, transactions, loading, isServiceReady, refreshData } = useHappyPaisaStellar();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'transfer_in':
      case 'credit':
        return <ArrowDownRight className="h-4 w-4 text-green-600" />;
      case 'transfer_out':
      case 'debit':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      default:
        return <Wallet className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'transfer_in':
      case 'credit':
        return 'text-green-600';
      case 'transfer_out':
      case 'debit':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Server className="h-5 w-5" />
          <span className="font-medium">Happy Paisa Ledger</span>
          <Badge variant={isServiceReady ? "default" : "destructive"}>
            {isServiceReady ? "Online" : "Offline"}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={loading || !isServiceReady}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Balance Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              {account?.hp_balance?.toFixed(6) || '0.000000'} HP
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              Happy Paisa
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-green-500/10 via-card to-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earned
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{account ? (account.hp_balance * 1000).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time earnings
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-red-500/10 via-card to-red-500/5 border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {account?.is_active ? 'Active' : 'Inactive'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time spending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest transactions from Happy Paisa Ledger
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.transaction_type)}
                    <div>
                      <p className="font-medium text-sm">
                        {transaction.memo || transaction.transaction_type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(transaction.created_at)} • {transaction.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${getTransactionColor(transaction.transaction_type)}`}>
                      {transaction.hp_amount > 0 ? '+' : ''}{transaction.hp_amount.toFixed(6)} HP
                    </p>
                    {transaction.stellar_transaction_id && (
                      <p className="text-xs text-muted-foreground">
                        TXN: {transaction.stellar_transaction_id.slice(0, 8)}...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
