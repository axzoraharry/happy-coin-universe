
import { EnhancedTransferForm } from './EnhancedTransferForm';
import { WalletActions } from '../wallet/WalletActions';
import { TransferTestComponent } from './TransferTestComponent';

export function TransfersPage() {
  return (
    <div className="space-y-6">
      <WalletActions />
      <EnhancedTransferForm />
      {/* Debug component - remove this in production */}
      <TransferTestComponent />
    </div>
  );
}
