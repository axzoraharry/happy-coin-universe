
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useHappyPaisaIntegration } from '@/hooks/useHappyPaisaIntegration';
import { 
  Wallet, 
  Coins, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  RefreshCw,
  Server,
  CreditCard,
  Banknote
} from 'lucide-react';

interface WalletData {
  balance: number;
  currency: string;
  total_coins: number;
  earned_today: number;
}

export function UnifiedWalletDashboard() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { balance: happyPaisaBalance, isServiceAvailable, refreshData } = useHappyPaisaIntegration();

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance, currency')
        .eq('user_id', user.id)
        .single();

      if (walletError) throw walletError;

      // Fetch coin data
      const { data: coinData, error: coinError } = await supabase
        .from('user_coins')
        .select('total_coins, earned_today')
        .eq('user_id', user.id)
        .single();

      if (coinError) throw coinError;

      setWalletData({
        balance: walletData?.balance || 0,
        currency: walletData?.currency || 'USD',
        total_coins: coinData?.total_coins || 0,
        earned_today: coinData?.earned_today || 0,
      });
    } catch (error: any) {
      console.error('Error fetching wallet data:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchWalletData(), refreshData()]);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-20 animate-pulse"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Financial Dashboard
          </h2>
          <p className="text-muted-foreground">
            Your complete wallet overview and currency management
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Service Status Indicators */}
      <div className="flex gap-2">
        <Badge variant="default" className="flex items-center gap-1">
          <CreditCard className="h-3 w-3" />
          Traditional Wallet: Active
        </Badge>
        <Badge 
          variant={isServiceAvailable ? "default" : "destructive"}
          className="flex items-center gap-1"
        >
          <Server className="h-3 w-3" />
          Happy Paisa Ledger: {isServiceAvailable ? "Online" : "Offline"}
        </Badge>
      </div>

      {/* Main Balance Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Happy Coins (Primary Currency) */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-primary/5 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Happy Coins (Main)
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              {walletData?.balance?.toFixed(2) || '0.00'} HC
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              Primary wallet currency
            </p>
          </CardContent>
        </Card>

        {/* Happy Paisa (Advanced) */}
        <Card className={`relative overflow-hidden transition-all duration-300 ${
          isServiceAvailable 
            ? 'bg-gradient-to-br from-blue-500/10 via-card to-blue-500/5 border-blue-500/20 hover:shadow-xl' 
            : 'bg-muted/50 border-muted opacity-60'
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Happy Paisa (Advanced)
            </CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Server className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {isServiceAvailable ? `${happyPaisaBalance?.balance?.toFixed(2) || '0.00'} HC` : 'Offline'}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <Server className="h-3 w-3 mr-1 text-blue-600" />
              Ledger service wallet
            </p>
          </CardContent>
        </Card>

        {/* Reward Coins */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-yellow-500/10 via-card to-yellow-500/5 border-yellow-500/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reward Coins
            </CardTitle>
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Coins className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              {walletData?.total_coins || 0}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <Sparkles className="h-3 w-3 mr-1 text-yellow-600" />
              Earned from activities
            </p>
          </CardContent>
        </Card>

        {/* Today's Earnings */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-500/10 via-card to-green-500/5 border-green-500/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Earnings
            </CardTitle>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {walletData?.earned_today || 0}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-600" />
              Coins earned today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Currency Explanation Card */}
      <Card className="border-2 border-dashed border-muted-foreground/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Banknote className="h-5 w-5" />
            Understanding Your Currencies
          </CardTitle>
          <CardDescription>
            Clear explanation of the different currency types in your wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
                <Wallet className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-primary">Happy Coins (HC)</h4>
                  <p className="text-sm text-muted-foreground">
                    Your main digital currency. Can be purchased (1000 INR = 1 HC) or earned through activities.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                <Coins className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-700">Reward Coins</h4>
                  <p className="text-sm text-muted-foreground">
                    Earned through daily bonuses, offers, and activities. Can be exchanged for Happy Coins.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                <Server className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-700">Happy Paisa Ledger</h4>
                  <p className="text-sm text-muted-foreground">
                    Advanced wallet service with enhanced security and real-time processing capabilities.
                  </p>
                </div>
              </div>
              
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Exchange Rate:</strong> 1000 INR = 1 Happy Coin<br />
                  <strong>Minimum Transfer:</strong> 0.01 HC
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
