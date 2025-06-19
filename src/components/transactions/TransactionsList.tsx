import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpRight, ArrowDownRight, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Copy } from 'lucide-react';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string | null;
  status: string;
  created_at: string;
  recipient_id: string | null;
  reference_id: string | null;
}

const TRANSACTIONS_PER_PAGE = 10;

export function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, [currentPage]);

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get total count
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setTotalTransactions(count || 0);

      // Get paginated transactions
      const from = (currentPage - 1) * TRANSACTIONS_PER_PAGE;
      const to = from + TRANSACTIONS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalTransactions / TRANSACTIONS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setLoading(true);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <ArrowDownRight className="h-4 w-4 text-green-600" />;
      case 'debit':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'transfer_in':
        return <ArrowDownRight className="h-4 w-4 text-blue-600" />;
      case 'transfer_out':
        return <ArrowUpRight className="h-4 w-4 text-orange-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
      case 'transfer_in':
        return 'text-green-600';
      case 'debit':
      case 'transfer_out':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { 
        variant: "default" as const, 
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
        className: "bg-green-100 text-green-800 border-green-200"
      },
      pending: { 
        variant: "secondary" as const, 
        icon: <Clock className="h-3 w-3 mr-1" />,
        className: "bg-yellow-100 text-yellow-800 border-yellow-200"
      },
      failed: { 
        variant: "destructive" as const, 
        icon: <XCircle className="h-3 w-3 mr-1" />,
        className: "bg-red-100 text-red-800 border-red-200"
      },
      cancelled: { 
        variant: "outline" as const, 
        icon: <AlertCircle className="h-3 w-3 mr-1" />,
        className: "bg-gray-100 text-gray-800 border-gray-200"
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.cancelled;
    
    return (
      <Badge variant={config.variant} className={`${config.className} flex items-center`}>
        {config.icon}
        {status}
      </Badge>
    );
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'credit':
        return 'Deposit';
      case 'debit':
        return 'Withdrawal';
      case 'transfer_in':
        return 'Received';
      case 'transfer_out':
        return 'Sent';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const truncateReferenceId = (refId: string | null) => {
    if (!refId) return null;
    if (refId.length <= 20) return refId;
    return `${refId.substring(0, 10)}...${refId.substring(refId.length - 6)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Reference ID copied to clipboard",
    });
  };

  if (loading) {
    return (
      <Card className="backdrop-blur-sm bg-gradient-to-r from-card/80 to-card/60 border-border/50 shadow-lg">
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border rounded-lg">
                <div className="h-10 w-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-sm bg-gradient-to-r from-card/80 to-card/60 border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Recent Transactions
        </CardTitle>
        <CardDescription className="text-muted-foreground flex items-center justify-between">
          <span>Your latest wallet activity and transfers</span>
          {totalTransactions > 0 && (
            <span className="text-sm">
              Showing {((currentPage - 1) * TRANSACTIONS_PER_PAGE) + 1}-{Math.min(currentPage * TRANSACTIONS_PER_PAGE, totalTransactions)} of {totalTransactions}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg font-medium">No transactions yet</p>
                <p className="text-muted-foreground text-sm">Your transaction history will appear here</p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex flex-col gap-3 p-4 border border-border/50 rounded-xl hover:bg-muted/30 transition-all duration-200 hover:shadow-md group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="p-2 bg-background/50 rounded-lg group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                        {getTransactionIcon(transaction.transaction_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground">
                          {formatTransactionType(transaction.transaction_type)}
                        </h4>
                        <p className="text-sm text-muted-foreground break-words">
                          {transaction.description || 'No description'}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                          {new Date(transaction.created_at).toLocaleDateString()} at{' '}
                          {new Date(transaction.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-2 flex-shrink-0">
                      <p className={`font-bold text-lg ${getTransactionColor(transaction.transaction_type)}`}>
                        {(transaction.transaction_type === 'credit' || transaction.transaction_type === 'transfer_in') ? '+' : '-'}
                        {transaction.amount.toFixed(2)} HC
                      </p>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                  {transaction.reference_id && (
                    <div className="flex items-center justify-between pt-2 border-t border-border/30">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <span className="text-xs text-muted-foreground flex-shrink-0">Ref:</span>
                        <code className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded truncate">
                          {truncateReferenceId(transaction.reference_id)}
                        </code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 flex-shrink-0 ml-2"
                        onClick={() => copyToClipboard(transaction.reference_id!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        {totalPages > 1 && (
          <div className="mt-6 border-t pt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage - 1);
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pageNum);
                        }}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage + 1);
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
