
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
  Banknote,
  Eye,
  EyeOff,
  Info
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
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
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
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="h-32 bg-gradient-to-br from-muted via-muted/60 to-muted/30"></div>
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
    <div className="space-y-8 animate-fade-in">
      {/* Enhanced Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-xl">
              <Wallet className="h-7 w-7 text-primary" />
            </div>
            My Financial Hub
          </h2>
          <p className="text-muted-foreground text-lg">
            Complete overview of your digital wallet ecosystem
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleBalanceVisibility}
            className="hover:bg-muted/50 transition-all duration-200"
          >
            {balanceVisible ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {balanceVisible ? 'Hide' : 'Show'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="hover:bg-primary/5 hover:border-primary/20 transition-all duration-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Enhanced Service Status with Animation */}
      <div className="flex flex-wrap gap-3">
        <Badge 
          variant="default" 
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/20 text-green-700 hover:scale-105 transition-transform duration-200"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <CreditCard className="h-3 w-3" />
          Traditional Wallet Active
        </Badge>
        <Badge 
          variant={isServiceAvailable ? "default" : "destructive"}
          className={`flex items-center gap-2 px-4 py-2 hover:scale-105 transition-transform duration-200 ${
            isServiceAvailable 
              ? 'bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500/20 text-blue-700' 
              : 'bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/20'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${isServiceAvailable ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`}></div>
          <Server className="h-3 w-3" />
          Happy Paisa Ledger {isServiceAvailable ? "Online" : "Offline"}
        </Badge>
      </div>

      {/* Enhanced Balance Cards with Better Hierarchy */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Primary Happy Coins Card */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-blue-600/5 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Happy Coins
                <Badge variant="secondary" className="text-xs px-2 py-0.5">Primary</Badge>
              </CardTitle>
            </div>
            <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 space-y-3">
            <div className="space-y-1">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                {balanceVisible ? `${walletData?.balance?.toFixed(2) || '0.00'} HC` : '••••••'}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                Main wallet currency
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Happy Paisa Advanced Card */}
        <Card className={`group relative overflow-hidden transition-all duration-500 hover:scale-[1.02] cursor-pointer ${
          isServiceAvailable 
            ? 'bg-gradient-to-br from-blue-500/5 via-card to-cyan-500/5 border-blue-500/20 shadow-lg hover:shadow-xl' 
            : 'bg-gradient-to-br from-muted/20 via-card to-muted/10 border-muted opacity-70'
        }`}>
          <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
            isServiceAvailable ? 'from-blue-500/10 via-transparent to-cyan-500/10' : 'from-muted/10 via-transparent to-muted/5'
          }`}></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Happy Paisa
                <Badge variant="outline" className="text-xs px-2 py-0.5 border-blue-500/30">Advanced</Badge>
              </CardTitle>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500/10 to-blue-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Server className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 space-y-3">
            <div className="space-y-1">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {isServiceAvailable ? (
                  balanceVisible ? `${happyPaisaBalance?.balance?.toFixed(2) || '0.00'} HC` : '••••••'
                ) : 'Offline'}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Server className="h-3 w-3 text-blue-600" />
                Ledger service wallet
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Reward Coins Card */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-yellow-500/5 via-card to-orange-500/5 border-yellow-500/20 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Reward Coins
                <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-yellow-500/10 text-yellow-700">Earned</Badge>
              </CardTitle>
            </div>
            <div className="p-3 bg-gradient-to-br from-yellow-500/10 to-yellow-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Coins className="h-5 w-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 space-y-3">
            <div className="space-y-1">
              <div className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                {balanceVisible ? (walletData?.total_coins || 0) : '••••'}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-yellow-600" />
                From activities & offers
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Today's Earnings Card */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-green-500/5 via-card to-emerald-500/5 border-green-500/20 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Today's Earnings
                <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-green-500/10 text-green-700">Live</Badge>
              </CardTitle>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500/10 to-green-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 space-y-3">
            <div className="space-y-1">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {balanceVisible ? (walletData?.earned_today || 0) : '••••'}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-green-600" />
                Coins earned today
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Currency Information with Tabs */}
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-r from-primary/5 via-card to-blue-600/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-lg">
              <Info className="h-5 w-5 text-primary" />
            </div>
            Currency Guide & Information
          </CardTitle>
          <CardDescription className="text-base">
            Everything you need to know about your digital currencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1 rounded-lg">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger value="exchange" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Exchange Rates
              </TabsTrigger>
              <TabsTrigger value="features" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Features
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="group p-4 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-primary">Happy Coins (HC)</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Your primary digital currency. Purchase directly or earn through platform activities.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="group p-4 rounded-lg border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <Coins className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-yellow-700">Reward Coins</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Earned through daily bonuses, completing offers, and platform engagement.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="group p-4 rounded-lg border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <Server className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-700">Happy Paisa Ledger</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Advanced wallet with enhanced security and real-time processing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="exchange" className="space-y-4">
              <div className="bg-gradient-to-r from-primary/5 via-blue-600/5 to-purple-600/5 p-6 rounded-lg border border-primary/20">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-green-600" />
                      Exchange Rates
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center p-2 bg-white/50 rounded border">
                        <span className="font-medium">1000 INR</span>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-primary">1 Happy Coin</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white/50 rounded border">
                        <span className="font-medium">Minimum Transfer</span>
                        <span className="font-semibold text-green-600">0.01 HC</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <ArrowUpRight className="h-5 w-5 text-blue-600" />
                      Conversion
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        Reward Coins can be exchanged for Happy Coins at competitive rates through our exchange system.
                      </p>
                      <Badge variant="outline" className="border-green-500/30 text-green-700">
                        Exchange Available 24/7
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Security Features</h4>
                  <div className="space-y-3">
                    {[
                      { icon: "🔒", title: "End-to-end Encryption", desc: "All transactions are secured" },
                      { icon: "🛡️", title: "Real-time Monitoring", desc: "24/7 fraud detection" },
                      { icon: "🔐", title: "Multi-factor Auth", desc: "Enhanced account security" }
                    ].map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                        <span className="text-lg">{feature.icon}</span>
                        <div>
                          <h5 className="font-medium">{feature.title}</h5>
                          <p className="text-sm text-muted-foreground">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Platform Benefits</h4>
                  <div className="space-y-3">
                    {[
                      { icon: "⚡", title: "Instant Transfers", desc: "Real-time processing" },
                      { icon: "💰", title: "Low Fees", desc: "Competitive transaction costs" },
                      { icon: "📱", title: "Mobile Optimized", desc: "Perfect mobile experience" }
                    ].map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                        <span className="text-lg">{benefit.icon}</span>
                        <div>
                          <h5 className="font-medium">{benefit.title}</h5>
                          <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
