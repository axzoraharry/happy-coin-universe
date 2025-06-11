
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Coins, Flame, Gift } from 'lucide-react';

interface LoginBonusData {
  canClaim: boolean;
  lastClaim: string | null;
  totalCoins: number;
  earnedToday: number;
}

export function DailyLoginBonus() {
  const [bonusData, setBonusData] = useState<LoginBonusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkDailyBonus();
  }, []);

  const checkDailyBonus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: coinData, error } = await supabase
        .from('user_coins')
        .select('last_daily_claim, total_coins, earned_today')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const lastClaim = coinData?.last_daily_claim;
      const canClaim = !lastClaim || !isSameDay(new Date(lastClaim), new Date());

      setBonusData({
        canClaim,
        lastClaim,
        totalCoins: coinData?.total_coins || 0,
        earnedToday: coinData?.earned_today || 0,
      });
    } catch (error: any) {
      console.error('Error checking daily bonus:', error);
      toast({
        title: "Error",
        description: "Failed to check daily bonus status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const claimDailyBonus = async () => {
    setClaiming(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const bonusAmount = 10; // Daily login bonus amount

      // Update user coins
      const { data: currentCoins } = await supabase
        .from('user_coins')
        .select('total_coins, earned_today')
        .eq('user_id', user.id)
        .single();

      if (currentCoins) {
        await supabase
          .from('user_coins')
          .update({
            total_coins: currentCoins.total_coins + bonusAmount,
            earned_today: currentCoins.earned_today + bonusAmount,
            last_daily_claim: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      }

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Daily Bonus Claimed!',
          message: `You earned ${bonusAmount} coins for logging in today!`,
          type: 'success'
        });

      setBonusData(prev => prev ? {
        ...prev,
        canClaim: false,
        lastClaim: new Date().toISOString(),
        totalCoins: prev.totalCoins + bonusAmount,
        earnedToday: prev.earnedToday + bonusAmount,
      } : null);

      toast({
        title: "Daily Bonus Claimed!",
        description: `You earned ${bonusAmount} coins!`,
      });
    } catch (error: any) {
      console.error('Error claiming daily bonus:', error);
      toast({
        title: "Error",
        description: "Failed to claim daily bonus",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const getStreakDays = () => {
    if (!bonusData?.lastClaim) return 0;
    const lastClaim = new Date(bonusData.lastClaim);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastClaim.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1 ? 1 : 0; // Simple streak calculation
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Login Bonus</CardTitle>
        </CardHeader>
        <CardContent>
          <div>Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-yellow-500/10 via-card to-orange-500/5 border-yellow-500/20">
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full -translate-y-16 translate-x-16"></div>
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-yellow-600" />
          <span>Daily Login Bonus</span>
          <Badge variant="secondary" className="ml-auto">
            <Flame className="h-3 w-3 mr-1" />
            {getStreakDays()} day streak
          </Badge>
        </CardTitle>
        <CardDescription>
          Claim your daily bonus for logging in!
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Gift className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium">Daily Bonus</h3>
                <p className="text-sm text-muted-foreground">
                  Get 10 coins every day for logging in
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-yellow-600 font-medium">
                <Coins className="h-4 w-4 mr-1" />
                10 coins
              </div>
            </div>
          </div>

          {bonusData?.canClaim ? (
            <Button 
              onClick={claimDailyBonus} 
              disabled={claiming}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              <Gift className="h-4 w-4 mr-2" />
              {claiming ? 'Claiming...' : 'Claim Daily Bonus'}
            </Button>
          ) : (
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Already claimed today! Come back tomorrow.</span>
              </div>
              {bonusData?.lastClaim && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last claimed: {new Date(bonusData.lastClaim).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {bonusData?.totalCoins || 0}
              </div>
              <div className="text-xs text-muted-foreground">Total Coins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {bonusData?.earnedToday || 0}
              </div>
              <div className="text-xs text-muted-foreground">Earned Today</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
