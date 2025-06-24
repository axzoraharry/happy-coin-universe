
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  CreditCard, 
  Activity,
  Calendar,
  Target,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalBalance: number;
  totalTransactions: number;
  monthlyGrowth: number;
  activeCards: number;
  coinBalance: number;
  weeklyActivity: number[];
  topTransactions: Array<{
    id: string;
    amount: number;
    type: string;
    date: string;
    description: string;
  }>;
  spendingCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export function WalletAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch wallet data
      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      // Fetch transaction data
      const { data: transactionData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      // Fetch coin data
      const { data: coinData } = await supabase
        .from('user_coins')
        .select('total_coins')
        .eq('user_id', user.id)
        .single();

      // Process data for analytics
      const mockAnalytics: AnalyticsData = {
        totalBalance: walletData?.balance || 0,
        totalTransactions: transactionData?.length || 0,
        monthlyGrowth: 12.5,
        activeCards: 1,
        coinBalance: coinData?.total_coins || 0,
        weeklyActivity: [45, 52, 38, 67, 89, 76, 54],
        topTransactions: transactionData?.slice(0, 5).map(tx => ({
          id: tx.id,
          amount: tx.amount,
          type: tx.transaction_type,
          date: tx.created_at,
          description: tx.description || 'Transaction'
        })) || [],
        spendingCategories: [
          { category: 'Virtual Cards', amount: 1250, percentage: 35 },
          { category: 'Transfers', amount: 800, percentage: 23 },
          { category: 'Purchases', amount: 600, percentage: 17 },
          { category: 'Rewards', amount: 450, percentage: 13 },
          { category: 'Other', amount: 400, percentage: 12 }
        ]
      };

      setAnalyticsData(mockAnalytics);
    } catch (error: any) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-xl">
              <BarChart3 className="h-7 w-7 text-primary" />
            </div>
            Wallet Analytics
          </h2>
          <p className="text-muted-foreground text-lg">
            Insights into your financial activity and spending patterns
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <Badge
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </Badge>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-700">Total Balance</p>
                <p className="text-2xl font-bold text-green-800">
                  {analyticsData.totalBalance.toFixed(2)} HC
                </p>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{analyticsData.monthlyGrowth}% this month</span>
                </div>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-700">Transactions</p>
                <p className="text-2xl font-bold text-blue-800">
                  {analyticsData.totalTransactions}
                </p>
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Activity className="h-3 w-3" />
                  <span>Last {timeRange}</span>
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <ArrowUpRight className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-purple-700">Active Cards</p>
                <p className="text-2xl font-bold text-purple-800">
                  {analyticsData.activeCards}
                </p>
                <div className="flex items-center gap-1 text-xs text-purple-600">
                  <CreditCard className="h-3 w-3" />
                  <span>Virtual debit cards</span>
                </div>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-full">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-orange-700">Reward Coins</p>
                <p className="text-2xl font-bold text-orange-800">
                  {analyticsData.coinBalance}
                </p>
                <div className="flex items-center gap-1 text-xs text-orange-600">
                  <Target className="h-3 w-3" />
                  <span>Earned from activities</span>
                </div>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-full">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1 rounded-lg">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="spending">Spending</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Weekly Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Weekly Activity
                </CardTitle>
                <CardDescription>
                  Transaction volume over the past 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.weeklyActivity.map((value, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-12">
                        Day {index + 1}
                      </span>
                      <Progress value={value} className="flex-1" />
                      <span className="text-sm text-muted-foreground w-8">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Transactions
                </CardTitle>
                <CardDescription>
                  Your latest financial activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.topTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} HC
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {transaction.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="spending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Spending Categories
              </CardTitle>
              <CardDescription>
                Breakdown of your spending by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.spendingCategories.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category.category}</span>
                      <span className="text-sm text-muted-foreground">
                        {category.amount} HC ({category.percentage}%)
                      </span>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Activity Summary
              </CardTitle>
              <CardDescription>
                Detailed view of your wallet activity patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-semibold">Peak Activity Times</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Morning (6-12 PM)</span>
                      <span className="text-muted-foreground">23%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Afternoon (12-6 PM)</span>
                      <span className="text-muted-foreground">45%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Evening (6-12 AM)</span>
                      <span className="text-muted-foreground">32%</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">Transaction Types</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Outgoing Transfers</span>
                      <span className="text-muted-foreground">60%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Card Payments</span>
                      <span className="text-muted-foreground">25%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Coin Purchases</span>
                      <span className="text-muted-foreground">15%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
