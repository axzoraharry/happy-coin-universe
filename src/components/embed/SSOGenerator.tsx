
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Copy, Code, Eye, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SSOWidget } from './SSOWidget';

interface SSOConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  appName: string;
  theme: 'light' | 'dark';
  compact: boolean;
}

export function SSOGenerator() {
  const [config, setConfig] = useState<SSOConfig>({
    clientId: '',
    redirectUri: 'https://yourapp.com/auth/callback',
    scope: 'profile email',
    state: crypto.randomUUID(),
    appName: 'My Application',
    theme: 'light',
    compact: false,
  });
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const generateEmbedCode = () => {
    const widgetConfig = {
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scope: config.scope,
      state: config.state,
      appName: config.appName,
      theme: config.theme,
      compact: config.compact,
    };

    const configString = JSON.stringify(widgetConfig, null, 2)
      .replace(/"/g, "'")
      .replace(/\n/g, '\n    ');

    // Use the actual domain where this widget is hosted
    const scriptUrl = `${window.location.origin}/embed/sso-widget.js`;

    return `<!-- HappyCoins SSO Widget -->
<div id="happycoins-sso-widget"></div>
<script src="${scriptUrl}"></script>
<script>
  // Option 1: Render immediately (DOM must be ready)
  HappyCoinsSSOWidget.render('happycoins-sso-widget', ${configString});

  // Option 2: Render when DOM is ready (recommended)
  // HappyCoinsSSOWidget.renderWhenReady('happycoins-sso-widget', ${configString});
</script>`;
  };

  const generateAutoInitCode = () => {
    return `<!-- HappyCoins SSO Widget (Auto-init) -->
<div id="happycoins-sso-widget" 
     data-happycoins-sso
     data-client-id="${config.clientId}"
     data-redirect-uri="${config.redirectUri}"
     data-scope="${config.scope}"
     data-state="${config.state}"
     data-app-name="${config.appName}"
     data-theme="${config.theme}"
     data-compact="${config.compact}">
</div>
<script src="${window.location.origin}/embed/sso-widget.js"></script>`;
  };

  const generateReactCode = () => {
    const props = [
      `clientId="${config.clientId}"`,
      `redirectUri="${config.redirectUri}"`,
      `scope="${config.scope}"`,
      config.state ? `state="${config.state}"` : null,
      `appName="${config.appName}"`,
      `theme="${config.theme}"`,
      config.compact ? 'compact={true}' : null,
      'onSuccess={(authCode) => console.log("Auth success:", authCode)}',
      'onError={(error) => console.log("Auth error:", error)}',
    ].filter(Boolean).join('\n      ');

    return `import { SSOWidget } from '@/components/embed/SSOWidget';

function App() {
  return (
    <SSOWidget
      ${props}
    />
  );
}`;
  };

  const generateAPIExample = () => {
    return `// Step 1: Get authorization code (redirect user to this URL)
const authUrl = '${window.location.origin}/api/sso-auth/authorize?' +
  new URLSearchParams({
    client_id: '${config.clientId}',
    redirect_uri: '${config.redirectUri}',
    scope: '${config.scope}',
    state: '${config.state}',
    response_type: 'code'
  });

// Step 2: Exchange code for access token
const tokenResponse = await fetch('${window.location.origin}/api/sso-auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: authorizationCode, // from step 1 callback
    client_id: '${config.clientId}',
    client_secret: 'YOUR_CLIENT_SECRET',
    redirect_uri: '${config.redirectUri}'
  })
});

const { access_token } = await tokenResponse.json();

// Step 3: Get user information
const userResponse = await fetch('${window.location.origin}/api/sso-auth/userinfo', {
  headers: { 'Authorization': \`Bearer \${access_token}\` }
});

const userInfo = await userResponse.json();
console.log('User info:', userInfo);`;
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
            <Shield className="h-5 w-5" />
            <span>SSO Authentication Generator</span>
          </CardTitle>
          <CardDescription>
            Configure and generate embed code for HappyCoins SSO authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID (API Key) *</Label>
              <Input
                id="clientId"
                value={config.clientId}
                onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
                placeholder="ak_..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="redirectUri">Redirect URI *</Label>
              <Input
                id="redirectUri"
                value={config.redirectUri}
                onChange={(e) => setConfig(prev => ({ ...prev, redirectUri: e.target.value }))}
                placeholder="https://yourapp.com/auth/callback"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope">Scope</Label>
              <Input
                id="scope"
                value={config.scope}
                onChange={(e) => setConfig(prev => ({ ...prev, scope: e.target.value }))}
                placeholder="profile email wallet"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appName">Application Name</Label>
              <Input
                id="appName"
                value={config.appName}
                onChange={(e) => setConfig(prev => ({ ...prev, appName: e.target.value }))}
                placeholder="My Application"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State (Security)</Label>
              <Input
                id="state"
                value={config.state}
                onChange={(e) => setConfig(prev => ({ ...prev, state: e.target.value }))}
                placeholder="Random string for security"
              />
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

          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
            </Button>
            <Badge variant={config.clientId ? 'default' : 'secondary'}>
              {config.clientId ? 'Ready' : 'Client ID Required'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {showPreview && config.clientId && (
        <Card>
          <CardHeader>
            <CardTitle>SSO Widget Preview</CardTitle>
            <CardDescription>
              This is how the SSO authentication widget will appear
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center p-6 bg-gray-50 rounded-lg">
              <SSOWidget
                clientId={config.clientId}
                redirectUri={config.redirectUri}
                scope={config.scope}
                state={config.state}
                appName={config.appName}
                theme={config.theme}
                compact={config.compact}
                onSuccess={(authCode) => console.log('SSO success:', authCode)}
                onError={(error) => console.log('SSO error:', error)}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>React Component</CardTitle>
            <CardDescription>
              For React applications
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Integration</CardTitle>
            <CardDescription>
              Direct API integration example
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                <code>{generateAPIExample()}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(generateAPIExample(), 'API integration code')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
