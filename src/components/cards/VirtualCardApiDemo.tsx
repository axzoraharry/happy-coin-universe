
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CardNumberUtils } from '@/lib/virtualCard/cardNumberUtils';

interface VirtualCardApiDemoProps {
  cards: Array<{ id: string; masked_card_number: string; status: string }>;
}

export function VirtualCardApiDemo({ cards }: VirtualCardApiDemoProps) {
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session?.user);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getSelectedCardNumber = () => {
    if (!selectedCardId) return '';
    return CardNumberUtils.getConsistentCardNumber(selectedCardId);
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please log in to access the Virtual Card API demo.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Virtual Card API Demo
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/api', '_blank')}
            className="ml-auto"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            API Endpoints
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Card Selection */}
        <div className="space-y-3">
          <Label>Card Number (for API testing)</Label>
          <div className="space-y-2">
            <Input
              value={getSelectedCardNumber()}
              readOnly
              className="font-mono"
              placeholder="Select a card below"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(getSelectedCardNumber(), 'Card number')}
              disabled={!selectedCardId}
              className="w-full"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Card Number
            </Button>
          </div>
        </div>

        {/* Card List */}
        <div className="space-y-2">
          <Label>Your active cards:</Label>
          <div className="space-y-2">
            {cards.filter(card => card.status === 'active').map((card) => (
              <div
                key={card.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedCardId === card.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedCardId(card.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {CardNumberUtils.getMaskedCardNumber(card.id)}
                    </span>
                    <Badge variant="default">
                      {card.status}
                    </Badge>
                  </div>
                  {selectedCardId === card.id && (
                    <Badge variant="secondary">Selected</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Full number: {CardNumberUtils.getConsistentCardNumber(card.id)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Usage Example */}
        <div className="space-y-3">
          <Label>Example API Usage</Label>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-xs overflow-auto">
{`curl -X POST https://zygpupmeradizrachnqj.supabase.co/functions/v1/card-transaction-api/process-transaction \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "x-api-key: YOUR_X_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "card_number": "${getSelectedCardNumber() || 'SELECT_A_CARD_FIRST'}",
    "amount": 100,
    "transaction_type": "purchase",
    "description": "Test transaction"
  }'`}
            </pre>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(
              `curl -X POST https://zygpupmeradizrachnqj.supabase.co/functions/v1/card-transaction-api/process-transaction \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "x-api-key: YOUR_X_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "card_number": "${getSelectedCardNumber() || 'SELECT_A_CARD_FIRST'}",
    "amount": 100,
    "transaction_type": "purchase",
    "description": "Test transaction"
  }'`,
              'cURL command'
            )}
            disabled={!selectedCardId}
            className="w-full"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy cURL Command
          </Button>
        </div>

        {/* Additional Info */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">API Information</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Replace YOUR_API_KEY with your actual Authorization Bearer token</li>
            <li>• Replace YOUR_X_API_KEY with your actual x-api-key from the API Management page</li>
            <li>• All card numbers are consistently generated based on your card IDs</li>
            <li>• Transaction amounts are in Happy Coins (HC)</li>
            <li>• API endpoint supports purchase, refund, validation, activation, and deactivation</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
