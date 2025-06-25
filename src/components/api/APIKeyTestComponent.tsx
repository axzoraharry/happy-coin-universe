
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Key, Send } from 'lucide-react';

export function APIKeyTestComponent() {
  const [apiKey, setApiKey] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [userPin, setUserPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const { toast } = useToast();

  const testAPIKey = async () => {
    if (!apiKey || !recipientEmail || !amount) {
      toast({
        title: "Missing Fields",
        description: "Please provide API key, recipient email, and amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://zygpupmeradizrachnqj.supabase.co/functions/v1/internal-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          recipient_email: recipientEmail,
          amount: parseFloat(amount),
          description: description || undefined,
          user_pin: userPin || undefined
        })
      });

      const result = await response.json();
      console.log('API Key Test Response:', result);
      setResponse(result);

      if (response.ok && result.success) {
        toast({
          title: "API Key Test Successful",
          description: `Transfer completed: ${result.data?.reference_id}`,
        });
      } else {
        toast({
          title: "API Key Test Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('API Key test error:', error);
      setResponse({ error: error.message });
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Key className="h-5 w-5" />
          <span>API Key Testing</span>
        </CardTitle>
        <CardDescription>
          Test the internal transfer API using API key authentication
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); testAPIKey(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password" 
              placeholder="ak_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Email</Label>
              <Input
                id="recipient"
                type="email"
                placeholder="recipient@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (HC)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="10.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Payment description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin">PIN (Optional)</Label>
            <Input
              id="pin"
              type="password"
              placeholder="4-digit PIN"
              value={userPin}
              onChange={(e) => setUserPin(e.target.value)}
              maxLength={4}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Testing API Key...' : 'Test with API Key'}
          </Button>
        </form>

        {response && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">API Response</h4>
            <div className="bg-muted p-3 rounded text-sm">
              <pre>{JSON.stringify(response, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
