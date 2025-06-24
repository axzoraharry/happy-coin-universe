
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Download,
  Calendar,
  ShoppingCart,
  Fuel,
  Utensils,
  Plane,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface CardTransaction {
  id: string;
  amount: number;
  currency: string;
  hc_amount: number;
  merchant_name: string;
  merchant_category: string;
  status: 'completed' | 'pending' | 'failed' | 'reversed';
  transaction_type: 'purchase' | 'refund' | 'fee';
  created_at: string;
  reference_id: string;
  location?: string;
}

interface CardTransactionsProps {
  cardId: string;
}

// Mock transaction data - In production, this would come from the Card Issuing Service API
const mockTransactions: CardTransaction[] = [
  {
    id: 'txn_001',
    amount: 1250.00,
    currency: 'INR',
    hc_amount: 1.25,
    merchant_name: 'Amazon India',
    merchant_category: 'ecommerce',
    status: 'completed',
    transaction_type: 'purchase',
    created_at: '2024-06-23T10:30:00Z',
    reference_id: 'REF-001',
    location: 'Online'
  },
  {
    id: 'txn_002',
    amount: 850.00,
    currency: 'INR',
    hc_amount: 0.85,
    merchant_name: 'Swiggy',
    merchant_category: 'food',
    status: 'completed',
    transaction_type: 'purchase',
    created_at: '2024-06-22T19:45:00Z',
    reference_id: 'REF-002',
    location: 'Bangalore, KA'
  },
  {
    id: 'txn_003',
    amount: 2000.00,
    currency: 'INR',
    hc_amount: 2.00,
    merchant_name: 'Indian Oil',
    merchant_category: 'fuel',
    status: 'completed',
    transaction_type: 'purchase',
    created_at: '2024-06-21T08:15:00Z',
    reference_id: 'REF-003',
    location: 'Mumbai, MH'
  },
  {
    id: 'txn_004',
    amount: 450.00,
    currency: 'INR',
    hc_amount: 0.45,
    merchant_name: 'Netflix',
    merchant_category: 'entertainment',
    status: 'pending',
    transaction_type: 'purchase',
    created_at: '2024-06-20T14:20:00Z',
    reference_id: 'REF-004',
    location: 'Online'
  }
];

export function CardTransactions({ cardId }: CardTransactionsProps) {
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<CardTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch card transactions
    setTimeout(() => {
      setTransactions(mockTransactions);
      setFilteredTransactions(mockTransactions);
      setLoading(false);
    }, 1000);
  }, [cardId]);

  useEffect(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(txn => 
        txn.merchant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.reference_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(txn => txn.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(txn => txn.merchant_category === categoryFilter);
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, statusFilter, categoryFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'failed': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'reversed': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ecommerce': return <ShoppingCart className="h-4 w-4" />;
      case 'food': return <Utensils className="h-4 w-4" />;
      case 'fuel': return <Fuel className="h-4 w-4" />;
      case 'travel': return <Plane className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'refund': return <ArrowDownRight className="h-4 w-4 text-green-600" />;
      default: return <ArrowUpRight className="h-4 w-4 text-red-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-muted rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-muted rounded"></div>
                    <div className="w-24 h-3 bg-muted rounded"></div>
                  </div>
                </div>
                <div className="w-20 h-6 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>
            View and manage your virtual card transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by merchant or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="reversed">Reversed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="ecommerce">E-commerce</SelectItem>
                <SelectItem value="food">Food & Dining</SelectItem>
                <SelectItem value="fuel">Fuel</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      {getCategoryIcon(transaction.merchant_category)}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{transaction.merchant_name}</h4>
                        {getTransactionIcon(transaction.transaction_type)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(transaction.created_at)}</span>
                        {transaction.location && (
                          <>
                            <span>•</span>
                            <span>{transaction.location}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ref: {transaction.reference_id}
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="space-y-1">
                      <p className="text-lg font-semibold">
                        {transaction.transaction_type === 'refund' ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.transaction_type === 'refund' ? '+' : '-'}{transaction.hc_amount.toFixed(2)} HC
                      </p>
                    </div>
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No Transactions Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                      ? 'Try adjusting your filters to see more transactions.'
                      : 'Start using your virtual card to see transactions here.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
