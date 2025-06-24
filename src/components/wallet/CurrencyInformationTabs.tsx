
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Info,
  Wallet,
  Coins,
  Server,
  Banknote,
  ArrowUpRight
} from 'lucide-react';

export function CurrencyInformationTabs() {
  return (
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
  );
}
