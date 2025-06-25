
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Webhook, Plus, ExternalLink, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WebhookLog {
  id: string;
  webhook_url: string;
  payload: any;
  response_status: number;
  success: boolean;
  attempt_count: number;
  created_at: string;
}

export function TransferWebhooks() {
  const [webhooks, setWebhooks] = useState<WebhookLog[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadWebhookLogs();
  }, []);

  const loadWebhookLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error: any) {
      console.error('Error loading webhook logs:', error);
    }
  };

  const testWebhook = async () => {
    if (!newWebhookUrl) {
      toast({
        title: "Missing URL",
        description: "Please provide a webhook URL to test",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate a webhook payload
      const testPayload = {
        event_type: 'transfer.completed',
        data: {
          transaction_id: 'TXN-' + Date.now(),
          reference_id: 'REF-' + Date.now(),
          sender_id: 'test-sender',
          recipient_id: 'test-recipient',
          amount: 10.00,
          description: 'Test transfer webhook',
          timestamp: new Date().toISOString()
        }
      };

      const response = await fetch(newWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Source': 'happy-wallet'
        },
        body: JSON.stringify(testPayload)
      });

      toast({
        title: response.ok ? "Webhook Test Successful" : "Webhook Test Failed",
        description: `Status: ${response.status} ${response.statusText}`,
        variant: response.ok ? "default" : "destructive",
      });

      // Refresh logs
      loadWebhookLogs();

    } catch (error: any) {
      console.error('Webhook test error:', error);
      toast({
        title: "Webhook Test Failed",
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
            <Webhook className="h-5 w-5" />
            <span>Transfer Webhooks</span>
          </CardTitle>
          <CardDescription>
            Configure webhooks to receive real-time notifications about transfer events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Webhook Events</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><code>transfer.completed</code> - Transfer successfully processed</li>
                  <li><code>transfer.failed</code> - Transfer failed or rejected</li>
                  <li><code>transfer.pending</code> - Transfer pending verification</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook-url">Test Webhook URL</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://your-app.com/webhooks/transfers"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                />
                <Button onClick={testWebhook} disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? 'Testing...' : 'Test'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Payload Example</CardTitle>
          <CardDescription>
            Example payload sent to your webhook endpoint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm overflow-x-auto">
{`{
  "event_type": "transfer.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "transaction_id": "TXN-1705312200",
    "reference_id": "REF-ABC123",
    "sender_id": "user-123",
    "recipient_id": "user-456",
    "amount": 25.50,
    "description": "Payment for services",
    "pin_verified": true,
    "sender_new_balance": 74.50,
    "recipient_new_balance": 125.50
  }
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Webhook Logs</CardTitle>
          <CardDescription>
            Monitor webhook delivery status and responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No webhook logs yet</p>
              <p className="text-sm">Test a webhook above to see logs here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {log.webhook_url}
                      </code>
                      <Badge variant={log.success ? "default" : "destructive"}>
                        {log.response_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(log.created_at).toLocaleString()} • 
                      Attempt {log.attempt_count}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
