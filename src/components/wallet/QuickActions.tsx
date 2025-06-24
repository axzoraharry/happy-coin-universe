
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
  Wallet
} from 'lucide-react';

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          Common wallet operations and currency management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Link to="/coins">
            <Button variant="outline" className="w-full h-auto flex-col gap-2 p-4 hover:bg-primary/5">
              <Plus className="h-5 w-5 text-green-600" />
              <span className="text-xs font-medium">Add Funds</span>
            </Button>
          </Link>
          
          <Link to="/transfers">
            <Button variant="outline" className="w-full h-auto flex-col gap-2 p-4 hover:bg-blue-500/5">
              <Send className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-medium">Send Money</span>
            </Button>
          </Link>
          
          <Link to="/coins">
            <Button variant="outline" className="w-full h-auto flex-col gap-2 p-4 hover:bg-yellow-500/5">
              <ArrowLeftRight className="h-5 w-5 text-yellow-600" />
              <span className="text-xs font-medium">Exchange</span>
            </Button>
          </Link>
          
          <Link to="/coins">
            <Button variant="outline" className="w-full h-auto flex-col gap-2 p-4 hover:bg-purple-500/5">
              <Gift className="h-5 w-5 text-purple-600" />
              <span className="text-xs font-medium">Earn Rewards</span>
            </Button>
          </Link>
        </div>
        
        <div className="mt-4 pt-4 border-t border-muted">
          <div className="grid gap-2 md:grid-cols-2">
            <Link to="/happy-paisa">
              <Button variant="ghost" className="w-full justify-start gap-2 h-auto p-3">
                <Server className="h-4 w-4 text-blue-600" />
                <div className="text-left">
                  <div className="text-sm font-medium">Happy Paisa Ledger</div>
                  <div className="text-xs text-muted-foreground">Advanced wallet service</div>
                </div>
              </Button>
            </Link>
            
            <Link to="/coins">
              <Button variant="ghost" className="w-full justify-start gap-2 h-auto p-3">
                <CreditCard className="h-4 w-4 text-green-600" />
                <div className="text-left">
                  <div className="text-sm font-medium">Purchase Coins</div>
                  <div className="text-xs text-muted-foreground">Buy with credit card</div>
                </div>
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
