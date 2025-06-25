
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Key, Plus, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ApiKey {
  id: string;
  application_name: string;
  api_key: string;
  secret_key: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

export function APIManagement() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newAppName, setNewAppName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error: any) {
      console.error('Error loading API keys:', error);
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      });
    }
  };

  const generateApiKey = async () => {
    if (!newAppName.trim()) {
      toast({
        title: "Missing Application Name",
        description: "Please provide an application name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('generate_api_keys', {
        p_user_id: user.id,
        p_application_name: newAppName.trim(),
        p_webhook_url: webhookUrl.trim() || null,
        p_allowed_domains: null
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "API Key Generated",
          description: `New API key created for ${newAppName}`,
        });
        setNewAppName('');
        setWebhookUrl('');
        loadApiKeys();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error generating API key:', error);
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleApiKey = async (apiKeyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', apiKeyId);

      if (error) throw error;

      toast({
        title: currentStatus ? "API Key Disabled" : "API Key Enabled",
        description: `API key has been ${currentStatus ? 'disabled' : 'enabled'}`,
      });

      loadApiKeys();
    } catch (error: any) {
      console.error('Error toggling API key:', error);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleSecretVisibility = (keyId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
    });
  };

  const maskSecret = (secret: string) => {
    return secret.substring(0, 8) + '...';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>API Key Management</span>
          </CardTitle>
          <CardDescription>
            Generate and manage API keys for accessing the Happy Wallet REST API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="app-name">Application Name</Label>
              <Input
                id="app-name"
                placeholder="My App"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL (Optional)</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://your-app.com/webhooks"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={generateApiKey} disabled={loading} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {loading ? 'Generating...' : 'Generate New API Key'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Manage your existing API keys and monitor their usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No API keys yet</p>
              <p className="text-sm">Generate your first API key to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div key={key.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{key.application_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(key.created_at).toLocaleDateString()}
                        {key.last_used_at && (
                          <span> • Last used {new Date(key.last_used_at).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={key.is_active ? "default" : "secondary"}>
                        {key.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleApiKey(key.id, key.is_active)}
                      >
                        {key.is_active ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">API Key</Label>
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 bg-muted p-2 rounded text-sm font-mono">
                          {showSecrets[key.id] ? key.api_key : maskSecret(key.api_key)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSecretVisibility(key.id)}
                        >
                          {showSecrets[key.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(key.api_key, 'API Key')}
                        >
                          📋
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Secret Key</Label>
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 bg-muted p-2 rounded text-sm font-mono">
                          {showSecrets[key.id] ? key.secret_key : maskSecret(key.secret_key)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(key.secret_key, 'Secret Key')}
                        >
                          📋
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Guidelines</CardTitle>
          <CardDescription>
            Important information about using your API keys securely
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-2">🔒 Security Best Practices</h4>
            <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
              <li>Never expose API keys in client-side code or public repositories</li>
              <li>Use environment variables to store API keys securely</li>
              <li>Rotate API keys regularly for enhanced security</li>
              <li>Monitor API key usage and disable unused keys</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">📊 Rate Limits</h4>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li>Transfer API: 100 requests per hour per API key</li>
              <li>API Management: 1000 requests per hour per API key</li>
              <li>Webhook deliveries: 50 per minute per endpoint</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
