
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TransferAmountInputProps {
  amount: string;
  description: string;
  onAmountChange: (amount: string) => void;
  onDescriptionChange: (description: string) => void;
}

export function TransferAmountInput({ 
  amount, 
  description, 
  onAmountChange, 
  onDescriptionChange 
}: TransferAmountInputProps) {
  return (
    <>
      {/* Amount Input */}
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (HC)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          min="0.01"
          step="0.01"
          required
        />
      </div>

      {/* Description */}
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
    </>
  );
}
