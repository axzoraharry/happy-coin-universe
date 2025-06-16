
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Webhook, CreditCard, BookOpen, ExternalLink } from 'lucide-react';

export function IntegrationGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Integration Options</span>
          </CardTitle>
          <CardDescription>
            Choose the integration method that best fits your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Code className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Direct API Integration</h3>
                <Badge variant="outline">Recommended</Badge>
              </div>
              <p className="text-muted-foreground">
                Full control over the payment flow with server-to-server communication. 
                Best for applications that need custom UI and detailed transaction handling.
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Complete customization</li>
                <li>• Server-side processing</li>
                <li>• Webhook notifications</li>
                <li>• Advanced error handling</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Embed Widget</h3>
                <Badge variant="secondary">Easy Setup</Badge>
              </div>
              <p className="text-muted-foreground">
                Pre-built payment widget that can be embedded directly into any website. 
                Perfect for quick integration with minimal development effort.
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Ready-to-use UI</li>
                <li>• Simple embed code</li>
                <li>• Multiple themes</li>
                <li>• Mobile responsive</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="api" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="api">API Integration</TabsTrigger>
          <TabsTrigger value="embed">Embed Widget</TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Integration Guide</CardTitle>
              <CardDescription>
                Learn how to integrate HappyCoins payments using our REST API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Step 1: Authentication</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm">
{`// Include your API key in the request headers
const headers = {
  'Content-Type': 'application/json',
  'x-api-key': 'your-api-key-here'
};`}
                  </pre>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Step 2: Create Payment Request</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm">
{`// POST to the payment endpoint
const response = await fetch('${window.location.origin}/api/wallet-payment', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({
    external_order_id: 'order-123',
    user_email: 'customer@example.com',
    amount: 25.00,
    description: 'Product purchase',
    callback_url: 'https://your-site.com/webhook'
  })
});

const result = await response.json();
if (result.success) {
  console.log('Payment successful:', result.reference_id);
}`}
                  </pre>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold flex items-center space-x-2">
                  <Webhook className="h-4 w-4" />
                  <span>Step 3: Handle Webhooks (Optional)</span>
                </h4>
                <p className="text-sm text-muted-foreground">
                  If you provide a callback_url, we'll send payment notifications to your endpoint:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm">
{`{
  "external_order_id": "order-123",
  "payment_request_id": "uuid",
  "transaction_id": "uuid", 
  "reference_id": "EXT-1234567890-order-123",
  "amount": 25.00,
  "status": "completed",
  "timestamp": "2023-12-01T10:00:00Z"
}`}
                  </pre>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Error Handling</h4>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <pre className="text-sm text-red-800">
{`{
  "success": false,
  "error": "Insufficient funds"
}

// Common errors:
// - "Invalid API key"
// - "User not found" 
// - "Insufficient funds"
// - "User wallet not found"`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="embed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Embed Widget Guide</CardTitle>
              <CardDescription>
                Quick setup guide for the HappyCoins payment widget
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Step 1: Include the Widget Script</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm">
{`<!-- Add this to your HTML head or before closing body tag -->
<script src="https://your-domain.com/embed/widget.js"></script>`}
                  </pre>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Step 2: Add Widget Container</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm">
{`<!-- Place this where you want the payment widget to appear -->
<div id="happycoins-payment-widget"></div>`}
                  </pre>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Step 3: Initialize the Widget</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm">
{`<script>
  HappyCoinsWidget.render('happycoins-payment-widget', {
    apiKey: 'your-api-key',
    amount: 25.00,
    orderId: 'order-123',
    description: 'Product purchase',
    theme: 'light', // or 'dark'
    compact: false, // or true for smaller widget
    onSuccess: function(result) {
      console.log('Payment successful:', result);
      // Redirect or show success message
    },
    onError: function(error) {
      console.log('Payment failed:', error);
      // Show error message
    }
  });
</script>`}
                  </pre>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Configuration Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Badge variant="outline">Required</Badge>
                    <ul className="text-sm space-y-1">
                      <li><code>apiKey</code> - Your API key</li>
                      <li><code>amount</code> - Payment amount</li>
                      <li><code>orderId</code> - Unique order ID</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="secondary">Optional</Badge>
                    <ul className="text-sm space-y-1">
                      <li><code>description</code> - Payment description</li>
                      <li><code>userEmail</code> - Pre-fill user email</li>
                      <li><code>theme</code> - 'light' or 'dark'</li>
                      <li><code>compact</code> - Compact mode</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">
                Check out our comprehensive documentation and code examples
              </p>
            </div>
            <Button variant="outline" className="flex items-center space-x-2">
              <ExternalLink className="h-4 w-4" />
              <span>View Documentation</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
