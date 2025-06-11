
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Gift, Copy, Users, Coins } from 'lucide-react';

interface ReferralStats {
  referral_code: string;
  total_referrals: number;
  pending_rewards: number;
  total_rewards_earned: number;
}

export function ReferralSystem() {
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get or create referral code
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      let referralCode = profile?.referral_code;

      // If no referral code exists, create one
      if (!referralCode) {
        referralCode = generateReferralCode();
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ referral_code: referralCode })
          .eq('id', user.id);

        if (updateError) throw updateError;
      }

      // Get referral statistics (would need additional tables in real implementation)
      setReferralStats({
        referral_code: referralCode,
        total_referrals: 0,
        pending_rewards: 0,
        total_rewards_earned: 0
      });

    } catch (error: any) {
      console.error('Error fetching referral stats:', error);
      toast({
        title: "Error",
        description: "Failed to load referral information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const copyReferralCode = () => {
    if (referralStats?.referral_code) {
      navigator.clipboard.writeText(referralStats.referral_code);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  const copyReferralLink = () => {
    if (referralStats?.referral_code) {
      const link = `${window.location.origin}?ref=${referralStats.referral_code}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    }
  };

  if (loading) {
    return <div>Loading referral information...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Gift className="h-5 w-5" />
          <span>Referral Program</span>
        </CardTitle>
        <CardDescription>
          Invite friends and earn rewards when they join
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Code Section */}
        <div className="space-y-3">
          <Label>Your Referral Code</Label>
          <div className="flex space-x-2">
            <Input 
              value={referralStats?.referral_code || ''} 
              readOnly 
              className="font-mono text-lg text-center"
            />
            <Button variant="outline" onClick={copyReferralCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={copyReferralLink}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Referral Link
          </Button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{referralStats?.total_referrals || 0}</div>
            <div className="text-sm text-muted-foreground">Total Referrals</div>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <Coins className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{referralStats?.pending_rewards || 0}</div>
            <div className="text-sm text-muted-foreground">Pending Rewards</div>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <Gift className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{referralStats?.total_rewards_earned || 0}</div>
            <div className="text-sm text-muted-foreground">Total Earned</div>
          </div>
        </div>

        {/* How it Works */}
        <div className="space-y-3">
          <h4 className="font-medium">How it works:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">1</Badge>
              <span>Share your referral code or link with friends</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">2</Badge>
              <span>Friends sign up using your referral code</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">3</Badge>
              <span>You both earn 100 bonus coins when they make their first transaction</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
