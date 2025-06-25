
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Book, Code, Webhook, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InternalTransferAPI } from './InternalTransferAPI';
import { TransferWebhooks } from './TransferWebhooks';

export function EnhancedAPIDocumentation() {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Code snippet copied successfully",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Documentation</h1>
          <p className="text-muted-foreground mt-2">
            Complete REST API reference for Happy Wallet integration
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">v2.0</Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <Book className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="transfer">
            <Send className="h-4 w-4 mr-2" />
            Transfers
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook className="h-4 w-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="examples">
            <Code className="h-4 w-4 mr-2" />
            Examples
          </TabsTrigger>
          <TabsTrigger value="changelog">
            📋
            Changelog
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Learn how to integrate with the Happy Wallet API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Base URL</h4>
                <div className="bg-muted p-3 rounded font-mono text-sm">
                  https://zygpupmeradizrachnqj.supabase.co/functions/v1/
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Authentication</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  The API supports two authentication methods:
                </p>
                <div className="space-y-2">
                  <div className="p-3 border rounded">
                    <h5 className="font-medium">JWT Bearer Token</h5>
                    <p className="text-sm text-muted-foreground">
                      For direct user access with Supabase authentication
                    </p>
                    <code className="text-sm bg-muted px-2 py-1 rounded mt-1 inline-block">
                      Authorization: Bearer &lt;jwt_token&gt;
                    </code>
                  </div>
                  <div className="p-3 border rounded">
                    <h5 className="font-medium">API Key</h5>
                    <p className="text-sm text-muted-foreground">
                      For server-to-server integration
                    </p>
                    <code className="text-sm bg-muted px-2 py-1 rounded mt-1 inline-block">
                      x-api-key: ak_your_api_key_here
                    </code>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Rate Limits</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded">
                    <h5 className="font-medium">Transfers</h5>
                    <p className="text-sm text-muted-foreground">100 requests per hour</p>
                  </div>
                  <div className="p-3 border rounded">
                    <h5 className="font-medium">API Management</h5>
                    <p className="text-sm text-muted-foreground">1000 requests per hour</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Standard Response Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Success Response</h4>
                  <div className="bg-muted p-3 rounded">
                    <pre className="text-sm">
{`{
  "success": true,
  "data": {
    // Response data here
  }
}`}
                    </pre>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Error Response</h4>
                  <div className="bg-muted p-3 rounded">
                    <pre className="text-sm">
{`{
  "success": false,
  "error": "Human readable error message",
  "error_code": "MACHINE_READABLE_CODE"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfer" className="space-y-6">
          <InternalTransferAPI />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <TransferWebhooks />
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Code Examples</CardTitle>
              <CardDescription>
                Implementation examples in different programming languages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">JavaScript / Node.js</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`// Internal Transfer Example
const response = await fetch('https://zygpupmeradizrachnqj.supabase.co/functions/v1/internal-transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    // OR use API key:
    // 'x-api-key': 'ak_your_api_key_here'
  },
  body: JSON.stringify({
    recipient_email: 'recipient@example.com',
    amount: 25.50,
    description: 'Payment for services',
    user_pin: '1234' // Optional for PIN verification
  })
});

const result = await response.json();
if (result.success) {
  console.log('Transfer successful:', result.data);
} else {
  console.error('Transfer failed:', result.error);
}`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded">
                  <pre className="text-sm overflow-x-auto">
{`// Internal Transfer Example
const response = await fetch('https://zygpupmeradizrachnqj.supabase.co/functions/v1/internal-transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    // OR use API key:
    // 'x-api-key': 'ak_your_api_key_here'
  },
  body: JSON.stringify({
    recipient_email: 'recipient@example.com',
    amount: 25.50,
    description: 'Payment for services',
    user_pin: '1234' // Optional for PIN verification
  })
});

const result = await response.json();
if (result.success) {
  console.log('Transfer successful:', result.data);
} else {
  console.error('Transfer failed:', result.error);
}`}
                  </pre>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Python</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`import requests

# Internal Transfer Example
url = "https://zygpupmeradizrachnqj.supabase.co/functions/v1/internal-transfer"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_JWT_TOKEN",
    # OR use API key:
    # "x-api-key": "ak_your_api_key_here"
}
data = {
    "recipient_email": "recipient@example.com",
    "amount": 25.50,
    "description": "Payment for services",
    "user_pin": "1234"  # Optional
}

response = requests.post(url, headers=headers, json=data)
result = response.json()

if result.get("success"):
    print("Transfer successful:", result["data"])
else:
    print("Transfer failed:", result.get("error"))`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded">
                  <pre className="text-sm overflow-x-auto">
{`import requests

# Internal Transfer Example
url = "https://zygpupmeradizrachnqj.supabase.co/functions/v1/internal-transfer"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_JWT_TOKEN",
    # OR use API key:
    # "x-api-key": "ak_your_api_key_here"
}
data = {
    "recipient_email": "recipient@example.com",
    "amount": 25.50,
    "description": "Payment for services",
    "user_pin": "1234"  # Optional
}

response = requests.post(url, headers=headers, json=data)
result = response.json()

if result.get("success"):
    print("Transfer successful:", result["data"])
else:
    print("Transfer failed:", result.get("error"))`}
                  </pre>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">PHP</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`<?php
// Internal Transfer Example
$url = "https://zygpupmeradizrachnqj.supabase.co/functions/v1/internal-transfer";
$headers = [
    "Content-Type: application/json",
    "Authorization: Bearer YOUR_JWT_TOKEN",
    // OR use API key:
    // "x-api-key: ak_your_api_key_here"
];
$data = [
    "recipient_email" => "recipient@example.com",
    "amount" => 25.50,
    "description" => "Payment for services",
    "user_pin" => "1234" // Optional
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if ($result['success']) {
    echo "Transfer successful: " . json_encode($result['data']);
} else {
    echo "Transfer failed: " . $result['error'];
}
?>`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded">
                  <pre className="text-sm overflow-x-auto">
{`<?php
// Internal Transfer Example
$url = "https://zygpupmeradizrachnqj.supabase.co/functions/v1/internal-transfer";
$headers = [
    "Content-Type: application/json",
    "Authorization: Bearer YOUR_JWT_TOKEN",
    // OR use API key:
    // "x-api-key: ak_your_api_key_here"
];
$data = [
    "recipient_email" => "recipient@example.com",
    "amount" => 25.50,
    "description" => "Payment for services",
    "user_pin" => "1234" // Optional
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if ($result['success']) {
    echo "Transfer successful: " . json_encode($result['data']);
} else {
    echo "Transfer failed: " . $result['error'];
}
?>`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changelog" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Changelog</CardTitle>
              <CardDescription>
                Track updates and changes to the Happy Wallet API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-l-2 border-green-500 pl-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="default">v2.0</Badge>
                  <span className="text-sm text-muted-foreground">Latest</span>
                </div>
                <h4 className="font-medium">Internal Transfer API</h4>
                <p className="text-sm text-muted-foreground">
                  Added dedicated REST endpoint for internal transfers with enhanced security
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>New <code>/internal-transfer</code> endpoint</li>
                  <li>Support for both JWT and API key authentication</li>
                  <li>Enhanced error codes and responses</li>
                  <li>PIN verification support</li>
                  <li>Daily transfer limits</li>
                  <li>Webhook notifications</li>
                </ul>
              </div>

              <div className="border-l-2 border-blue-500 pl-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="secondary">v1.5</Badge>
                  <span className="text-sm text-muted-foreground">Previous</span>
                </div>
                <h4 className="font-medium">Enhanced External Payments</h4>
                <p className="text-sm text-muted-foreground">
                  Improved external payment processing with better error handling
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Improved PIN verification</li>
                  <li>Better error messages</li>
                  <li>Enhanced rate limiting</li>
                </ul>
              </div>

              <div className="border-l-2 border-gray-400 pl-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline">v1.0</Badge>
                  <span className="text-sm text-muted-foreground">Initial</span>
                </div>
                <h4 className="font-medium">Initial API Release</h4>
                <p className="text-sm text-muted-foreground">
                  Basic wallet payment functionality
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>External payment processing</li>
                  <li>API key management</li>
                  <li>Basic authentication</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
