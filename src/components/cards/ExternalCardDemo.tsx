
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { ExternalCardService, ExternalCardDetails } from '@/lib/virtualCard/externalCardService';
import { useToast } from '@/hooks/use-toast';

export function ExternalCardDemo() {
  const [cardDetails, setCardDetails] = useState<ExternalCardDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testAmount, setTestAmount] = useState<string>('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const { toast } = useToast();

  const fetchActiveCard = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await ExternalCardService.getActiveVirtualCard();
      
      if (result.success && result.card) {
        setCardDetails(result.card);
        toast({
          title: "Card Retrieved",
          description: "Active virtual card details loaded successfully",
        });
      } else {
        setError(result.error || 'No active card found');
        setCardDetails(null);
      }
    } catch (err) {
      setError('Failed to fetch card details');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const validateAmount = async () => {
    if (!testAmount || isNaN(Number(testAmount))) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid number",
        variant: "destructive"
      });
      return;
    }

    const result = await ExternalCardService.validateTransactionAmount(Number(testAmount));
    setValidationResult(result);
    
    if (result.valid) {
      toast({
        title: "Amount Valid",
        description: "This transaction amount is within your limits",
      });
    } else {
      toast({
        title: "Amount Invalid",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchActiveCard();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            External Application Demo
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            This demonstrates how external applications can retrieve and validate virtual card details
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={fetchActiveCard} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Loading...' : 'Fetch Active Card'}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {cardDetails && (
            <div className="space-y-4">
              <Separator />
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Active Virtual Card</h3>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {cardDetails.status.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Card Number</p>
                    <p className="font-mono text-sm">{cardDetails.masked_card_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Expires</p>
                    <p className="text-sm">{cardDetails.expiry_date}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Daily Limit</p>
                    <p className="text-sm">{cardDetails.daily_limit} HC</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Daily Remaining</p>
                    <p className="text-sm font-semibold text-green-600">{cardDetails.daily_remaining} HC</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Transaction Validation Test</h4>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="amount">Test Amount (HC)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={testAmount}
                      onChange={(e) => setTestAmount(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={validateAmount} variant="outline">
                      Validate
                    </Button>
                  </div>
                </div>

                {validationResult && (
                  <div className={`border rounded-lg p-3 ${
                    validationResult.valid 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {validationResult.valid ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        validationResult.valid ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {validationResult.valid ? 'Amount is valid' : validationResult.error}
                      </span>
                    </div>
                    {validationResult.limits && (
                      <div className="mt-2 text-xs text-gray-600">
                        <p>Daily remaining: {validationResult.limits.daily_remaining} HC</p>
                        <p>Monthly remaining: {validationResult.limits.monthly_remaining} HC</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
