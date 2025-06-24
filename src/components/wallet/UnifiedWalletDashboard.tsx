
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useHappyPaisaIntegration } from '@/hooks/useHappyPaisaIntegration';
import { WalletHeader } from './WalletHeader';
import { WalletBalanceCard } from './WalletBalanceCard';
import { CurrencyInformationTabs } from './CurrencyInformationTabs';

interface WalletData {
  balance: number;
  currency: string;
  total_coins: number;
  earned_today: number;
}

export function UnifiedWalletDashboard() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
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
    toast({
      title: "Refreshed",
      description: "Wallet data updated successfully",
    });
  };

  const toggleBalanceVisibility = () => {
    setBalanceVisible(!balanceVisible);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-gradient-to-r from-muted via-muted/60 to-muted rounded-lg w-64 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
          </div>
          <div className="h-10 bg-muted rounded-lg w-24 animate-pulse"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="overflow-hidden animate-pulse">
              <div className="h-32 bg-gradient-to-br from-muted via-muted/60 to-muted/30 rounded-lg"></div>
              <div className="space-y-2 p-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <WalletHeader
        balanceVisible={balanceVisible}
        loading={loading}
        isServiceAvailable={isServiceAvailable}
        onToggleVisibility={toggleBalanceVisibility}
        onRefresh={handleRefresh}
      />

      {/* Enhanced Balance Cards with Better Hierarchy */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <WalletBalanceCard
          type="primary"
          balance={`${walletData?.balance?.toFixed(2) || '0.00'} HC`}
          label="Happy Coins"
          description="Main wallet currency"
          isVisible={balanceVisible}
        />

        <WalletBalanceCard
          type="happy-paisa"
          balance={isServiceAvailable ? `${happyPaisaBalance?.balance?.toFixed(2) || '0.00'} HC` : 'Offline'}
          label="Happy Paisa"
          description="Ledger service wallet"
          isVisible={balanceVisible}
          isServiceAvailable={isServiceAvailable}
        />

        <WalletBalanceCard
          type="rewards"
          balance={walletData?.total_coins || 0}
          label="Reward Coins"
          description="From activities & offers"
          isVisible={balanceVisible}
        />

        <WalletBalanceCard
          type="earnings"
          balance={walletData?.earned_today || 0}
          label="Today's Earnings"
          description="Coins earned today"
          isVisible={balanceVisible}
        />
      </div>

      <CurrencyInformationTabs />
    </div>
  );
}
