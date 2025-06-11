
import { WalletDashboard } from '@/components/wallet/WalletDashboard';
import { WalletActions } from '@/components/wallet/WalletActions';
import { TransactionsList } from '@/components/transactions/TransactionsList';
import { NotificationsList } from '@/components/notifications/NotificationsList';
import { OffersList } from '@/components/offers/OffersList';
import { UserProfile } from '@/components/profile/UserProfile';
import { TransfersPage } from '@/components/transfers/TransfersPage';
import { DailyLoginBonus } from '@/components/offers/DailyLoginBonus';
import { CoinExchange } from '@/components/coins/CoinExchange';
import { PurchaseCoins } from '@/components/coins/PurchaseCoins';

interface PageRendererProps {
  currentPage: string;
}

export function PageRenderer({ currentPage }: PageRendererProps) {
  switch (currentPage) {
    case 'dashboard':
      return (
        <div className="space-y-6">
          <WalletDashboard />
          <div className="grid gap-6 lg:grid-cols-2">
            <WalletActions />
            <div>
              <TransactionsList />
            </div>
          </div>
        </div>
      );
    case 'coins':
      return (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Coins & Rewards</h1>
            <p className="text-muted-foreground">
              Earn coins through daily bonuses, complete offers, exchange them for Happy Coins, or purchase directly.
            </p>
          </div>

          <WalletDashboard />

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
    case 'transfers':
      return <TransfersPage />;
    case 'notifications':
      return <NotificationsList />;
    case 'offers':
      return <OffersList />;
    case 'profile':
      return <UserProfile />;
    default:
      return (
        <div className="space-y-6">
          <WalletDashboard />
          <div className="grid gap-6 lg:grid-cols-2">
            <WalletActions />
            <div>
              <TransactionsList />
            </div>
          </div>
        </div>
      );
  }
}
