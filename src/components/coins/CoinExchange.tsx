import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowRightLeft, Coins, DollarSign, Calculator } from 'lucide-react';

interface CoinData {
  total_coins: number;
}

interface WalletData {
  balance: number;
}

interface ExchangeResult {
  success: boolean;
  error?: string;
  coins_exchanged?: number;
  amount_received?: number;
  new_coin_balance?: number;
  new_wallet_balance?: number;
}

export function CoinExchange() {
  const [coinsToExchange, setCoinsToExchange] = useState<string>('');
  const [coinData, setCoinData] = useState<CoinData | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exchanging, setExchanging] = useState(false);
  const { toast } = useToast();

  const EXCHANGE_RATE = 0.01; // 1 coin = 0.01 HC

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch coin data
      const { data: coins, error: coinError } = await supabase
        .from('user_coins')
        .select('total_coins')
        .eq('user_id', user.id)
        .single();

      if (coinError) throw coinError;

      // Fetch wallet data
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (walletError) throw walletError;

      setCoinData(coins);
      setWalletData(wallet);
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load account data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExchange = async () => {
    const coinsAmount = parseInt(coinsToExchange);
    
    if (!coinsAmount || coinsAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid number of coins to exchange",
        variant: "destructive",
      });
      return;
    }

    if (!coinData || coinsAmount > coinData.total_coins) {
      toast({
        title: "Insufficient Coins",
        description: "You don't have enough coins for this exchange",
        variant: "destructive",
      });
      return;
    }

    setExchanging(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('exchange_coins_to_balance', {
        p_user_id: user.id,
        p_coins_to_exchange: coinsAmount,
        p_exchange_rate: EXCHANGE_RATE
      });

      if (error) throw error;

      const result = data as unknown as ExchangeResult;
      
      if (!result.success) {
        toast({
          title: "Exchange Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setCoinData(prev => prev ? { total_coins: result.new_coin_balance || 0 } : null);
      setWalletData(prev => prev ? { balance: result.new_wallet_balance || 0 } : null);
      
      toast({
        title: "Exchange Successful!",
        description: `Exchanged ${result.coins_exchanged} coins for ${result.amount_received} HC`,
      });

      setCoinsToExchange('');
    } catch (error: any) {
      console.error('Exchange error:', error);
      toast({
        title: "Exchange Failed",
        description: error.message || "Failed to exchange coins",
        variant: "destructive",
      });
    } finally {
      setExchanging(false);
    }
  };

  const calculateAmount = () => {
    const coins = parseInt(coinsToExchange) || 0;
    return (coins * EXCHANGE_RATE).toFixed(2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Coin Exchange</CardTitle>
        </CardHeader>
        <CardContent>
          <div>Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-card to-purple-500/5 border-blue-500/20">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center space-x-2">
          <ArrowRightLeft className="h-5 w-5 text-blue-600" />
          <span>Coin Exchange</span>
        </CardTitle>
        <CardDescription>
          Convert your earned coins to Happy Coins (1 coin = {EXCHANGE_RATE} HC)
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10 space-y-6">
        {/* Current Balances */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-center mb-2">
              <Coins className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                Available Coins
              </span>
            </div>
            <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
              {coinData?.total_coins || 0}
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Happy Coins Balance
              </span>
            </div>
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">
              {walletData?.balance?.toFixed(2) || '0.00'} HC
            </div>
          </div>
        </div>

        {/* Exchange Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coins-amount">Coins to Exchange</Label>
            <Input
              id="coins-amount"
              type="number"
              placeholder="Enter number of coins"
              value={coinsToExchange}
              onChange={(e) => setCoinsToExchange(e.target.value)}
              min="1"
              max={coinData?.total_coins || 0}
            />
          </div>

          {/* Exchange Preview */}
          {coinsToExchange && parseInt(coinsToExchange) > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calculator className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    You will receive:
                  </span>
                </div>
                <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                  {calculateAmount()} HC
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={handleExchange} 
            disabled={exchanging || !coinsToExchange || parseInt(coinsToExchange) <= 0}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            {exchanging ? 'Exchanging...' : 'Exchange Coins'}
          </Button>
        </div>

        {/* Exchange Rate Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Exchange Rate: 1 coin = {EXCHANGE_RATE} HC</p>
          <p>Minimum exchange: 1 coin</p>
        </div>
      </CardContent>
    </Card>
  );
}
