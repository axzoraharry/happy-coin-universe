
import { UnifiedWalletDashboard } from '@/components/wallet/UnifiedWalletDashboard';
import { QuickActions } from '@/components/wallet/QuickActions';
import { DailyLoginBonus } from '@/components/offers/DailyLoginBonus';
import { OffersList } from '@/components/offers/OffersList';
import { CoinExchange } from '@/components/coins/CoinExchange';
import { PurchaseCoins } from '@/components/coins/PurchaseCoins';
import { SimpleTransferForm } from '@/components/transfers/SimpleTransferForm';

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

      <div className="grid gap-6 lg:grid-cols-2">
        <PurchaseCoins />
        <SimpleTransferForm />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DailyLoginBonus />
        <CoinExchange />
      </div>

      <div>
        <OffersList />
      </div>
    </div>
  );
}
