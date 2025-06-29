
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { EnhancedTransactionService } from '@/lib/virtualCard/enhancedTransactionService';
import { useToast } from '@/hooks/use-toast';

interface EnhancedTransactionTestProps {
  cards: Array<{ id: string; masked_card_number: string; status: string }>;
}

export function EnhancedTransactionTest({ cards }: EnhancedTransactionTestProps) {
  const [selectedCard, setSelectedCard] = useState<string>('');
  const [transactionType, setTransactionType] = useState<string>('purchase');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [merchantInfo, setMerchantInfo] = useState<string>('{}');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleProcessTransaction = async () => {
    if (!selectedCard) {
      toast({
        title: "Error",
        description: "Please select a card",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      setResult(null);

      let parsedMerchantInfo = {};
      if (merchantInfo.trim()) {
        try {
          parsedMerchantInfo = JSON.parse(merchantInfo);
        } catch {
          toast({
            title: "Error",
            description: "Invalid merchant info JSON",
            variant: "destructive"
          });
          return;
        }
      }

      const response = await EnhancedTransactionService.processTransaction({
        card_id: selectedCard,
        transaction_type: transactionType as any,
        amount: amount ? parseFloat(amount) : 0,
        description,
        merchant_info: parsedMerchantInfo
      });

      setResult(response);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Transaction processed successfully",
        });
      } else {
        toast({
          title: "Transaction Failed",
          description: response.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult({ success: false, error: errorMessage });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLimitValidation = async () => {
    if (!selectedCard || !amount) {
      toast({
        title: "Error",
        description: "Please select a card and enter an amount",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const validation = await EnhancedTransactionService.validateTransactionLimits({
        card_id: selectedCard,
        amount: parseFloat(amount)
      });

      setResult({
        type: 'validation',
        ...validation
      });

      if (validation.valid) {
        toast({
          title: "Amount Valid",
          description: "Transaction amount is within limits",
        });
      } else {
        toast({
          title: "Amount Invalid",
          description: validation.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Enhanced Transaction API Test
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="card-select">Select Card</Label>
            <Select value={selectedCard} onValueChange={setSelectedCard}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a card" />
              </SelectTrigger>
              <SelectContent>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    <div className="flex items-center gap-2">
                      <span>{card.masked_card_number}</span>
                      <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                        {card.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-type">Transaction Type</Label>
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="purchase">Purchase</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="validation">Validation</SelectItem>
                <SelectItem value="activation">Activation</SelectItem>
                <SelectItem value="deactivation">Deactivation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (HC)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Transaction description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="merchant-info">Merchant Info (JSON)</Label>
          <Textarea
            id="merchant-info"
            placeholder='{"merchant_id": "MERCHANT_123", "category": "retail"}'
            value={merchantInfo}
            onChange={(e) => setMerchantInfo(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleProcessTransaction} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Processing...' : 'Process Transaction'}
          </Button>
          <Button 
            onClick={handleLimitValidation} 
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            {isLoading ? 'Validating...' : 'Validate Limits'}
          </Button>
        </div>

        {result && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {result.success || result.valid ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="font-medium">
                  {result.type === 'validation' ? 'Validation Result' : 'Transaction Result'}
                </span>
              </div>

              {result.type === 'validation' ? (
                <div className="bg-muted p-3 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Valid: <Badge variant={result.valid ? 'default' : 'destructive'}>{result.valid ? 'Yes' : 'No'}</Badge></div>
                    <div>Daily Remaining: <span className="font-mono">{result.daily_remaining} HC</span></div>
                    <div>Monthly Remaining: <span className="font-mono">{result.monthly_remaining} HC</span></div>
                    <div>Daily Limit: <span className="font-mono">{result.daily_limit} HC</span></div>
                  </div>
                  {result.error && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">{result.error}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-muted p-3 rounded-lg">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
