
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Gift, Clock, Users, CheckCircle } from 'lucide-react';

interface Offer {
  id: string;
  title: string;
  description: string;
  coin_reward: number;
  offer_type: string;
  expires_at: string | null;
}

export function OffersList() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [completedOffers, setCompletedOffers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOffers();
    fetchCompletedOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error: any) {
      console.error('Error fetching offers:', error);
      toast({
        title: "Error",
        description: "Failed to load offers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedOffers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_offers')
        .select('offer_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setCompletedOffers(data?.map(item => item.offer_id) || []);
    } catch (error: any) {
      console.error('Error fetching completed offers:', error);
    }
  };

  const claimOffer = async (offerId: string, coinReward: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Record the completed offer
      const { error: offerError } = await supabase
        .from('user_offers')
        .insert({
          user_id: user.id,
          offer_id: offerId,
          coins_earned: coinReward
        });

      if (offerError) throw offerError;

      // Update user coins
      const { error: coinsError } = await supabase.rpc('update_user_coins', {
        user_id: user.id,
        coins_to_add: coinReward
      });

      if (coinsError) {
        // If RPC doesn't exist, update directly
        const { data: currentCoins } = await supabase
          .from('user_coins')
          .select('total_coins, earned_today')
          .eq('user_id', user.id)
          .single();

        if (currentCoins) {
          await supabase
            .from('user_coins')
            .update({
              total_coins: currentCoins.total_coins + coinReward,
              earned_today: currentCoins.earned_today + coinReward,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);
        }
      }

      setCompletedOffers([...completedOffers, offerId]);
      toast({
        title: "Offer Claimed!",
        description: `You earned ${coinReward} coins!`,
      });
    } catch (error: any) {
      console.error('Error claiming offer:', error);
      toast({
        title: "Error",
        description: "Failed to claim offer",
        variant: "destructive",
      });
    }
  };

  const getOfferIcon = (type: string) => {
    switch (type) {
      case 'daily':
        return <Clock className="h-4 w-4" />;
      case 'referral':
        return <Users className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const getOfferBadge = (type: string): JSX.Element => {
    switch (type) {
      case 'daily':
        return <Badge variant="default">daily</Badge>;
      case 'weekly':
        return <Badge variant="secondary">weekly</Badge>;
      case 'referral':
        return <Badge variant="outline">referral</Badge>;
      case 'task':
        return <Badge variant="default">task</Badge>;
      case 'bonus':
        return <Badge variant="destructive">bonus</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return <div>Loading offers...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Offers</CardTitle>
        <CardDescription>Earn coins by completing these offers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {offers.length === 0 ? (
            <p className="text-muted-foreground">No offers available</p>
          ) : (
            offers.map((offer) => {
              const isCompleted = completedOffers.includes(offer.id);
              return (
                <div key={offer.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getOfferIcon(offer.offer_type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{offer.title}</h3>
                        {getOfferBadge(offer.offer_type)}
                      </div>
                      <p className="text-sm text-muted-foreground">{offer.description}</p>
                      {offer.expires_at && (
                        <p className="text-xs text-muted-foreground">
                          Expires: {new Date(offer.expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600 mb-2">{offer.coin_reward} coins</p>
                    {isCompleted ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">Completed</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => claimOffer(offer.id, offer.coin_reward)}
                      >
                        Claim
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
