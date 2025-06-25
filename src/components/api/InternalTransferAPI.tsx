import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Send, Code, ExternalLink, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { APIKeyTestComponent } from './APIKeyTestComponent';

export function InternalTransferAPI() {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [userPin, setUserPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const { toast } = useToast();

  const testTransfer = async () => {
    if (!recipientEmail || !amount) {
      toast({
        title: "Missing Fields",
        description: "Please provide recipient email and amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to test the API",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke('internal-transfer', {
        body: {
          recipient_email: recipientEmail,
          amount: parseFloat(amount),
          description: description || undefined,
          user_pin: userPin || undefined
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response:', response);
      setResponse(response);

      if (response.error) {
        toast({
          title: "API Error",
          description: response.error.message || "Transfer failed",
          variant: "destructive",
        });
      } else if (response.data?.success) {
        toast({
          title: "Transfer Successful",
          description: `Reference: ${response.data.data?.reference_id}`,
        });
      } else {
        toast({
          title: "Transfer Failed",
          description: response.data?.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Test error:', error);
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Internal Transfer API</span>
          </CardTitle>
          <CardDescription>
            REST API endpoint for secure internal wallet transfers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Code className="h-4 w-4" />
              <span className="font-mono text-sm">POST /functions/v1/internal-transfer</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Secure endpoint for transferring Happy Coins between users with PIN verification
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Authentication Methods</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>JWT:</strong> Use Authorization: Bearer &lt;token&gt; (for logged-in users)</li>
                  <li><strong>API Key:</strong> Use x-api-key: &lt;api-key&gt; (for external integrations)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Request Headers</h4>
              <div className="space-y-1 text-sm font-mono bg-muted p-3 rounded">
                <div>Authorization: Bearer &lt;token&gt;</div>
                <div className="text-muted-foreground">OR</div>
                <div>x-api-key: &lt;api-key&gt;</div>
                <div>Content-Type: application/json</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Request Body</h4>
              <div className="space-y-1 text-sm font-mono bg-muted p-3 rounded">
                <div>recipient_email: string</div>
                <div>amount: number</div>
                <div className="text-muted-foreground">description?: string</div>
                <div className="text-muted-foreground">user_pin?: string</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test with JWT Authentication</CardTitle>
          <CardDescription>
            Test the internal transfer API with your logged-in session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); testTransfer(); }} className="space-y-4">
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
              {loading ? 'Testing...' : 'Test Transfer API (JWT)'}
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

      <APIKeyTestComponent />

      <Card>
        <CardHeader>
          <CardTitle>Error Codes</CardTitle>
          <CardDescription>
            Common error codes returned by the API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <code className="bg-muted px-2 py-1 rounded">INVALID_API_KEY</code>
                <p className="text-muted-foreground mt-1">API key is invalid or inactive</p>
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded">INVALID_API_KEY_FORMAT</code>
                <p className="text-muted-foreground mt-1">API key format is incorrect</p>
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded">AUTH_REQUIRED</code>
                <p className="text-muted-foreground mt-1">No authentication provided</p>
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded">MISSING_FIELDS</code>
                <p className="text-muted-foreground mt-1">Required fields are missing</p>
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded">INVALID_AMOUNT</code>
                <p className="text-muted-foreground mt-1">Transfer amount is invalid</p>
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded">RECIPIENT_NOT_FOUND</code>
                <p className="text-muted-foreground mt-1">Recipient email not found</p>
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded">INSUFFICIENT_FUNDS</code>
                <p className="text-muted-foreground mt-1">Sender has insufficient balance</p>
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded">SELF_TRANSFER</code>
                <p className="text-muted-foreground mt-1">Cannot transfer to yourself</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
