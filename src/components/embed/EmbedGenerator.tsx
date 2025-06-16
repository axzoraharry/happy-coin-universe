
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, Code, Eye, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PaymentWidget } from './PaymentWidget';

interface EmbedConfig {
  apiKey: string;
  amount: number;
  orderId: string;
  description: string;
  userEmail: string;
  theme: 'light' | 'dark';
  compact: boolean;
}

export function EmbedGenerator() {
  const [config, setConfig] = useState<EmbedConfig>({
    apiKey: '',
    amount: 10,
    orderId: 'order-123',
    description: 'Test Payment',
    userEmail: '',
    theme: 'light',
    compact: false,
  });
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const generateEmbedCode = () => {
    const widgetConfig = {
      apiKey: config.apiKey,
      amount: config.amount,
      orderId: config.orderId,
      description: config.description,
      userEmail: config.userEmail || undefined,
      theme: config.theme,
      compact: config.compact,
    };

    const configString = JSON.stringify(widgetConfig, null, 2)
      .replace(/"/g, "'")
      .replace(/\n/g, '\n    ');

    // Use the actual domain where this widget is hosted
    const scriptUrl = `${window.location.origin}/embed/widget.js`;

    return `<!-- HappyCoins Payment Widget -->
<div id="happycoins-payment-widget"></div>
<script src="${scriptUrl}"></script>
<script>
  // Option 1: Render immediately (DOM must be ready)
  HappyCoinsWidget.render('happycoins-payment-widget', ${configString});

  // Option 2: Render when DOM is ready (recommended)
  // HappyCoinsWidget.renderWhenReady('happycoins-payment-widget', ${configString});
</script>`;
  };

  const generateAutoInitCode = () => {
    return `<!-- HappyCoins Payment Widget (Auto-init) -->
<div id="happycoins-payment-widget" 
     data-happycoins-payment
     data-api-key="${config.apiKey}"
     data-amount="${config.amount}"
     data-order-id="${config.orderId}"
     data-description="${config.description}"
     data-user-email="${config.userEmail}"
     data-theme="${config.theme}"
     data-compact="${config.compact}">
</div>
<script src="${window.location.origin}/embed/widget.js"></script>`;
  };

  const generateReactCode = () => {
    const props = [
      `apiKey="${config.apiKey}"`,
      `amount={${config.amount}}`,
      `orderId="${config.orderId}"`,
      `description="${config.description}"`,
      config.userEmail ? `userEmail="${config.userEmail}"` : null,
      `theme="${config.theme}"`,
      config.compact ? 'compact={true}' : null,
      'onSuccess={(result) => console.log("Payment success:", result)}',
      'onError={(error) => console.log("Payment error:", error)}',
    ].filter(Boolean).join('\n      ');

    return `import { PaymentWidget } from '@/components/embed/PaymentWidget';

function App() {
  return (
    <PaymentWidget
      ${props}
    />
  );
}`;
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
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="h-5 w-5" />
            <span>Payment Widget Generator</span>
          </CardTitle>
          <CardDescription>
            Configure and generate embed code for the HappyCoins payment widget
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key *</Label>
              <Input
                id="apiKey"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="ak_..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (HC) *</Label>
              <Input
                id="amount"
                type="number"
                value={config.amount}
                onChange={(e) => setConfig(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                min="0.01"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderId">Order ID *</Label>
              <Input
                id="orderId"
                value={config.orderId}
                onChange={(e) => setConfig(prev => ({ ...prev, orderId: e.target.value }))}
                placeholder="order-123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userEmail">User Email (Optional)</Label>
              <Input
                id="userEmail"
                type="email"
                value={config.userEmail}
                onChange={(e) => setConfig(prev => ({ ...prev, userEmail: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={config.theme} onValueChange={(value: 'light' | 'dark') => setConfig(prev => ({ ...prev, theme: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compact">Compact Mode</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="compact"
                  checked={config.compact}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, compact: checked }))}
                />
                <span className="text-sm text-muted-foreground">
                  {config.compact ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Payment description"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
            </Button>
            <Badge variant={config.apiKey ? 'default' : 'secondary'}>
              {config.apiKey ? 'Ready' : 'API Key Required'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {showPreview && config.apiKey && (
        <Card>
          <CardHeader>
            <CardTitle>Widget Preview</CardTitle>
            <CardDescription>
              This is how the payment widget will appear on external websites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center p-6 bg-gray-50 rounded-lg">
              <PaymentWidget
                apiKey={config.apiKey}
                amount={config.amount}
                orderId={config.orderId}
                description={config.description}
                userEmail={config.userEmail}
                theme={config.theme}
                compact={config.compact}
                onSuccess={(result) => console.log('Payment success:', result)}
                onError={(error) => console.log('Payment error:', error)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Troubleshooting Card */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            <span>Common Integration Issues</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-orange-800">
          <div className="space-y-2 text-sm">
            <p><strong>"Container element not found" error:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Make sure the div with the specified ID exists before the script runs</li>
              <li>Use <code>renderWhenReady()</code> instead of <code>render()</code> for better timing</li>
              <li>Check that the container ID matches exactly (case sensitive)</li>
              <li>Ensure the script loads after the HTML element is created</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>HTML Embed Code (Recommended)</CardTitle>
            <CardDescription>
              Copy this code and paste it into any website. Uses renderWhenReady() for better reliability.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{generateEmbedCode()}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(generateEmbedCode(), 'HTML embed code')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auto-Init HTML</CardTitle>
            <CardDescription>
              Alternative method using data attributes for automatic initialization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{generateAutoInitCode()}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(generateAutoInitCode(), 'Auto-init HTML code')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>React Component</CardTitle>
            <CardDescription>
              For React applications, use this component directly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{generateReactCode()}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(generateReactCode(), 'React component code')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
