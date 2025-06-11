
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Coins, TrendingUp, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';

interface WalletData {
  balance: number;
  currency: string;
  total_coins: number;
  earned_today: number;
}

export function WalletDashboard() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-primary/5 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Wallet Balance
          </CardTitle>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            ${walletData?.balance?.toFixed(2) || '0.00'}
          </div>
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
            {walletData?.currency || 'USD'}
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden bg-gradient-to-br from-yellow-500/10 via-card to-yellow-500/5 border-yellow-500/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full -translate-y-16 translate-x-16"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Coins
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
            Reward coins earned
          </p>
        </CardContent>
      </Card>

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
  );
}
