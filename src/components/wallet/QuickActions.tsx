
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Send, 
  Plus, 
  ArrowLeftRight, 
  Coins, 
  Gift, 
  CreditCard,
  Server,
  Wallet,
  Zap,
  TrendingUp
} from 'lucide-react';

export function QuickActions() {
  const primaryActions = [
    {
      to: "/coins",
      icon: Plus,
      title: "Add Funds",
      description: "Purchase Happy Coins",
      color: "green",
      gradient: "from-green-500/10 to-green-600/10",
      hoverColor: "hover:bg-green-500/5"
    },
    {
      to: "/transfers",
      icon: Send,
      title: "Send Money",
      description: "Transfer to friends",
      color: "blue",
      gradient: "from-blue-500/10 to-blue-600/10",
      hoverColor: "hover:bg-blue-500/5"
    },
    {
      to: "/coins",
      icon: ArrowLeftRight,
      title: "Exchange",
      description: "Convert currencies",
      color: "purple",
      gradient: "from-purple-500/10 to-purple-600/10",
      hoverColor: "hover:bg-purple-500/5"
    },
    {
      to: "/coins",
      icon: Gift,
      title: "Earn Rewards",
      description: "Complete offers",
      color: "orange",
      gradient: "from-orange-500/10 to-orange-600/10",
      hoverColor: "hover:bg-orange-500/5"
    }
  ];

  const advancedActions = [
    {
      to: "/happy-paisa",
      icon: Server,
      title: "Happy Paisa Ledger",
      description: "Advanced wallet service with enhanced security",
      color: "blue",
      badge: "Advanced"
    },
    {
      to: "/coins",
      icon: CreditCard,
      title: "Purchase Coins",
      description: "Buy with credit card or bank transfer",
      color: "green",
      badge: "Popular"
    }
  ];

  return (
    <Card className="border-2 border-primary/10 bg-gradient-to-r from-card via-primary/5 to-card shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-lg">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          Quick Actions
        </CardTitle>
        <CardDescription className="text-base">
          Fast access to your most-used wallet operations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Actions Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {primaryActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Link key={index} to={action.to} className="group">
                <Button 
                  variant="outline" 
                  className={`w-full h-auto flex-col gap-3 p-6 border-2 border-dashed border-muted-foreground/20 ${action.hoverColor} bg-gradient-to-br ${action.gradient} hover:border-${action.color}-500/40 hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]`}
                >
                  <div className={`p-3 bg-gradient-to-br from-${action.color}-500/10 to-${action.color}-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className={`h-6 w-6 text-${action.color}-600`} />
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-sm font-semibold">{action.title}</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Divider with gradient */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gradient-to-r from-transparent via-muted-foreground/20 to-transparent"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-4 text-muted-foreground font-medium">Advanced Services</span>
          </div>
        </div>

        {/* Advanced Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          {advancedActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Link key={index} to={action.to} className="group">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-4 h-auto p-4 bg-gradient-to-r from-muted/30 to-muted/10 hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/20 border border-muted-foreground/10 hover:border-muted-foreground/20 transition-all duration-300 group-hover:scale-[1.01]"
                >
                  <div className={`p-3 bg-gradient-to-br from-${action.color}-500/10 to-${action.color}-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className={`h-5 w-5 text-${action.color}-600`} />
                  </div>
                  <div className="text-left flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{action.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-${action.color}-500/10 text-${action.color}-700 border border-${action.color}-500/20`}>
                        {action.badge}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Call-to-action footer */}
        <div className="bg-gradient-to-r from-primary/5 via-blue-600/5 to-purple-600/5 p-4 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Need Help?</h4>
              <p className="text-xs text-muted-foreground">Get assistance with your wallet operations</p>
            </div>
            <Button variant="outline" size="sm" className="hover:bg-primary/5 hover:border-primary/20">
              Contact Support
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
