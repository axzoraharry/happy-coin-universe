
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Book, Zap } from 'lucide-react';

export function APIDocumentation() {
  const baseUrl = "https://zygpupmeradizrachnqj.supabase.co/functions/v1";

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Book className="h-6 w-6" />
        <h2 className="text-2xl font-bold">API Documentation</h2>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Getting Started</span>
              </CardTitle>
              <CardDescription>
                Integrate your application with the Happy Coins wallet system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Authentication</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  All API requests require an API key passed in the <code>x-api-key</code> header.
                </p>
                <div className="bg-muted p-3 rounded font-mono text-sm">
                  x-api-key: ak_your_api_key_here
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Base URL</h4>
                <div className="bg-muted p-3 rounded font-mono text-sm">
                  {baseUrl}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Response Format</h4>
                <p className="text-sm text-muted-foreground">
                  All responses are in JSON format with a consistent structure.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Badge variant="default">POST</Badge>
                <span>/wallet-payment</span>
              </CardTitle>
              <CardDescription>
                Process a payment from a user's wallet to your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Request Body</h4>
                <div className="bg-muted p-4 rounded font-mono text-sm overflow-x-auto">
                  <pre>{`{
  "external_order_id": "order_123456",
  "user_email": "user@example.com",
  "amount": 25.50,
  "description": "Premium subscription",
  "callback_url": "https://your-app.com/webhook",
  "metadata": {
    "plan": "premium",
    "duration": "monthly"
  }
}`}</pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Parameters</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">required</Badge>
                    <code className="text-sm">external_order_id</code>
                    <span className="text-sm text-muted-foreground">Unique identifier for your order</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">required</Badge>
                    <code className="text-sm">user_email</code>
                    <span className="text-sm text-muted-foreground">Email of the user making payment</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">required</Badge>
                    <code className="text-sm">amount</code>
                    <span className="text-sm text-muted-foreground">Amount in Happy Coins (numeric)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">optional</Badge>
                    <code className="text-sm">description</code>
                    <span className="text-sm text-muted-foreground">Payment description</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">optional</Badge>
                    <code className="text-sm">callback_url</code>
                    <span className="text-sm text-muted-foreground">Webhook URL for payment confirmation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">optional</Badge>
                    <code className="text-sm">metadata</code>
                    <span className="text-sm text-muted-foreground">Additional data (JSON object)</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Success Response</h4>
                <div className="bg-muted p-4 rounded font-mono text-sm overflow-x-auto">
                  <pre>{`{
  "success": true,
  "payment_request_id": "uuid",
  "transaction_id": "uuid",
  "reference_id": "EXT-1234567890-order_123456",
  "new_balance": 124.50,
  "message": "Payment processed successfully"
}`}</pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Error Response</h4>
                <div className="bg-muted p-4 rounded font-mono text-sm overflow-x-auto">
                  <pre>{`{
  "error": "Insufficient funds"
}`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>cURL Example</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded font-mono text-sm overflow-x-auto">
                <pre>{`curl -X POST "${baseUrl}/wallet-payment" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ak_your_api_key_here" \\
  -d '{
    "external_order_id": "order_123456",
    "user_email": "customer@example.com",
    "amount": 25.50,
    "description": "Premium subscription payment",
    "callback_url": "https://your-app.com/webhook"
  }'`}</pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>JavaScript Example</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded font-mono text-sm overflow-x-auto">
                <pre>{`const response = await fetch('${baseUrl}/wallet-payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'ak_your_api_key_here'
  },
  body: JSON.stringify({
    external_order_id: 'order_123456',
    user_email: 'customer@example.com',
    amount: 25.50,
    description: 'Premium subscription payment',
    callback_url: 'https://your-app.com/webhook'
  })
});

const result = await response.json();
console.log(result);`}</pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Python Example</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded font-mono text-sm overflow-x-auto">
                <pre>{`import requests

url = '${baseUrl}/wallet-payment'
headers = {
    'Content-Type': 'application/json',
    'x-api-key': 'ak_your_api_key_here'
}
data = {
    'external_order_id': 'order_123456',
    'user_email': 'customer@example.com',
    'amount': 25.50,
    'description': 'Premium subscription payment',
    'callback_url': 'https://your-app.com/webhook'
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result)`}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
