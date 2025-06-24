
import { UnifiedWalletDashboard } from '@/components/wallet/UnifiedWalletDashboard';
import { QuickActions } from '@/components/wallet/QuickActions';
import { DailyLoginBonus } from '@/components/offers/DailyLoginBonus';
import { OffersList } from '@/components/offers/OffersList';
import { CoinExchange } from '@/components/coins/CoinExchange';
import { PurchaseCoins } from '@/components/coins/PurchaseCoins';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Wallet, Server } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CoinsPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Coins & Rewards</h1>
        <p className="text-muted-foreground">
          Earn coins through daily bonuses, complete offers, exchange them for Happy Coins, or purchase directly.
        </p>
      </div>

      <UnifiedWalletDashboard />

      <QuickActions />

      {/* Happy Paisa Ledger Integration Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-blue-600/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5 text-primary" />
            <span>Advanced Wallet Management</span>
          </CardTitle>
          <CardDescription>
            Experience our new Happy Paisa Ledger service with enhanced security and real-time processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Wallet className="h-4 w-4 text-green-600" />
                <span>Secure Go-based ledger service</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Server className="h-4 w-4 text-blue-600" />
                <span>Real-time balance synchronization</span>
              </div>
            </div>
            <Link to="/happy-paisa">
              <Button>
                Try Happy Paisa Ledger
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <PurchaseCoins />
        <DailyLoginBonus />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CoinExchange />
      </div>

      <div>
        <OffersList />
      </div>
    </div>
  );
}
