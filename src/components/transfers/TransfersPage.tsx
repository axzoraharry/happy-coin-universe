
import { TransferForm } from './TransferForm';
import { WalletActions } from '../wallet/WalletActions';

export function TransfersPage() {
  return (
    <div className="space-y-6">
      <WalletActions />
      <TransferForm />
    </div>
  );
}
