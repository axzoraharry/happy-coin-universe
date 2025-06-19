
import { EnhancedTransferForm } from './EnhancedTransferForm';
import { WalletActions } from '../wallet/WalletActions';

export function TransfersPage() {
  return (
    <div className="space-y-6">
      <WalletActions />
      <EnhancedTransferForm />
    </div>
  );
}
