
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface TransferAmountInputProps {
  amount: string;
  description: string;
  onAmountChange: (amount: string) => void;
  onDescriptionChange: (description: string) => void;
}

const MINIMUM_TRANSFER_AMOUNT = 1;
const MINIMUM_ACCOUNT_BALANCE = 1;

export function TransferAmountInput({
  amount,
  description,
  onAmountChange,
  onDescriptionChange
}: TransferAmountInputProps) {
  const amountNumber = parseFloat(amount) || 0;
  const isValidAmount = amountNumber >= MINIMUM_TRANSFER_AMOUNT;

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Minimum transfer: {MINIMUM_TRANSFER_AMOUNT} HC • Minimum account balance: {MINIMUM_ACCOUNT_BALANCE} HC must remain after transfer
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount (Happy Coins)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          min={MINIMUM_TRANSFER_AMOUNT}
          step="0.01"
          className={!isValidAmount && amount ? 'border-red-500' : ''}
        />
        {!isValidAmount && amount && (
          <p className="text-sm text-red-500">
            Minimum transfer amount is {MINIMUM_TRANSFER_AMOUNT} HC
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="What's this transfer for?"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}
