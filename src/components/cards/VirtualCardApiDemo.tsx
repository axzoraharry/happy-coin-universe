
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, CheckCircle, XCircle, Code, Play, Key } from 'lucide-react';
import { EnhancedTransactionService } from '@/lib/virtualCard/enhancedTransactionService';
import { useToast } from '@/hooks/use-toast';

export function VirtualCardApiDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState('process-transaction');
  
  // Form states
  const [cardId, setCardId] = useState('');
  const [transactionType, setTransactionType] = useState('purchase');
  const [amount, setAmount] = useState('100');
  const [description, setDescription] = useState('Test transaction');
  const [cardNumber, setCardNumber] = useState('');
  const [pin, setPin] = useState('');
  const [userId, setUserId] = useState('');
  const [dailyLimit, setDailyLimit] = useState('5000');
  const [monthlyLimit, setMonthlyLimit] = useState('50000');

  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleApiCall = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      let response;

      switch (selectedEndpoint) {
        case 'process-transaction':
          response = await EnhancedTransactionService.processTransaction({
            card_id: cardId,
            transaction_type: transactionType as any,
            amount: parseFloat(amount),
            description,
            merchant_info: { demo: true }
          });
          break;

        case 'validate-limits':
          response = await EnhancedTransactionService.validateTransactionLimits({
            card_id: cardId,
            amount: parseFloat(amount)
          });
          break;

        case 'validate-card':
          response = await EnhancedTransactionService.validateCard({
            card_number: cardNumber,
            pin,
            ip_address: '127.0.0.1',
            user_agent: 'Virtual Card API Demo'
          });
          break;

        case 'get-card-details':
          response = await EnhancedTransactionService.getCardDetails(cardId, pin);
          break;

        case 'get-transactions':
          response = await EnhancedTransactionService.getTransactions(cardId, 10);
          break;

        case 'issue-card':
          response = await EnhancedTransactionService.issueCard({
            user_id: userId,
            pin,
            daily_limit: parseFloat(dailyLimit),
            monthly_limit: parseFloat(monthlyLimit)
          });
          break;

        default:
          throw new Error('Unknown endpoint');
      }

      setResult(response);

      if (response.success) {
        toast({
          title: "Success",
          description: "API call completed successfully",
        });
      } else {
        toast({
          title: "API Error",
          description: response.error || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      setResult({ success: false, error: errorMessage });
      
      toast({
        title: "Request Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getExampleCode = () => {
    const baseUrl = 'https://zygpupmeradizrachnqj.supabase.co/functions/v1/card-transaction-api';
    
    switch (selectedEndpoint) {
      case 'process-transaction':
        return `// Process a card transaction
const response = await fetch('${baseUrl}/process-transaction', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key-here'
  },
  body: JSON.stringify({
    card_id: '${cardId}',
    transaction_type: '${transactionType}',
    amount: ${amount},
    description: '${description}',
    merchant_info: { merchant_id: 'TEST_MERCHANT' }
  })
});

const result = await response.json();
console.log(result);`;

      case 'validate-limits':
        return `// Validate transaction limits
const response = await fetch('${baseUrl}/validate-limits', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key-here'
  },
  body: JSON.stringify({
    card_id: '${cardId}',
    amount: ${amount}
  })
});

const result = await response.json();
console.log(result);`;

      case 'validate-card':
        return `// Validate card credentials
const response = await fetch('${baseUrl}/validate-card', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key-here'
  },
  body: JSON.stringify({
    card_number: '${cardNumber}',
    pin: '${pin}',
    ip_address: '127.0.0.1'
  })
});

const result = await response.json();
console.log(result);`;

      case 'get-card-details':
        return `// Get card details
const response = await fetch('${baseUrl}/get-card-details', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key-here'
  },
  body: JSON.stringify({
    card_id: '${cardId}',
    user_pin: '${pin}'
  })
});

const result = await response.json();
console.log(result);`;

      case 'get-transactions':
        return `// Get card transactions
const response = await fetch('${baseUrl}/get-transactions?card_id=${cardId}&limit=10', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key-here'
  }
});

const result = await response.json();
console.log(result);`;

      case 'issue-card':
        return `// Issue new virtual card
const response = await fetch('${baseUrl}/issue-card', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key-here'
  },
  body: JSON.stringify({
    user_id: '${userId}',
    pin: '${pin}',
    daily_limit: ${dailyLimit},
    monthly_limit: ${monthlyLimit}
  })
});

const result = await response.json();
console.log(result);`;

      default:
        return '// Select an endpoint to see example code';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Virtual Card API Demo
          <Badge variant="secondary" className="ml-2">
            <Key className="h-3 w-3 mr-1" />
            API Endpoints
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="process-transaction">Process</TabsTrigger>
            <TabsTrigger value="validate-limits">Validate</TabsTrigger>
            <TabsTrigger value="validate-card">Auth</TabsTrigger>
            <TabsTrigger value="get-card-details">Details</TabsTrigger>
            <TabsTrigger value="get-transactions">History</TabsTrigger>
            <TabsTrigger value="issue-card">Issue</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 space-y-4">
            {/* Process Transaction */}
            <TabsContent value="process-transaction" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="card-id">Card ID</Label>
                  <Input
                    id="card-id"
                    placeholder="Enter card ID"
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transaction-type">Transaction Type</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value)}
                  >
                    <option value="purchase">Purchase</option>
                    <option value="refund">Refund</option>
                    <option value="validation">Validation</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="100"
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
            </TabsContent>

            {/* Validate Limits */}
            <TabsContent value="validate-limits" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validate-card-id">Card ID</Label>
                  <Input
                    id="validate-card-id"
                    placeholder="Enter card ID"
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validate-amount">Amount to Validate</Label>
                  <Input
                    id="validate-amount"
                    type="number"
                    placeholder="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Validate Card */}
            <TabsContent value="validate-card" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input
                    id="card-number"
                    placeholder="Enter card number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-pin">PIN</Label>
                  <Input
                    id="card-pin"
                    type="password"
                    placeholder="Enter PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Get Card Details */}
            <TabsContent value="get-card-details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="details-card-id">Card ID</Label>
                  <Input
                    id="details-card-id"
                    placeholder="Enter card ID"
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details-pin">PIN (Optional)</Label>
                  <Input
                    id="details-pin"
                    type="password"
                    placeholder="Enter PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Get Transactions */}
            <TabsContent value="get-transactions" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transactions-card-id">Card ID</Label>
                <Input
                  id="transactions-card-id"
                  placeholder="Enter card ID"
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                />
              </div>
            </TabsContent>

            {/* Issue Card */}
            <TabsContent value="issue-card" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-id">User ID</Label>
                  <Input
                    id="user-id"
                    placeholder="Enter user ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-pin">PIN</Label>
                  <Input
                    id="new-pin"
                    type="password"
                    placeholder="Enter 4-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daily-limit">Daily Limit</Label>
                  <Input
                    id="daily-limit"
                    type="number"
                    placeholder="5000"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly-limit">Monthly Limit</Label>
                  <Input
                    id="monthly-limit"
                    type="number"
                    placeholder="50000"
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <Button 
          onClick={handleApiCall} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Processing...' : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Test API Endpoint
            </>
          )}
        </Button>

        {/* Code Example */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Example Code</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(getExampleCode())}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
          </div>
          <Textarea
            value={getExampleCode()}
            readOnly
            rows={12}
            className="font-mono text-sm"
          />
        </div>

        {/* Results */}
        {result && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="font-medium">API Response</span>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-xs overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
