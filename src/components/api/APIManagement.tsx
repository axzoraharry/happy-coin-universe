import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Key, Copy, Eye, EyeOff, Plus, Trash2, Globe } from 'lucide-react';
import { AccountStatusGuard } from '../common/AccountStatusGuard';

interface APIKey {
  id: string;
  application_name: string;
  api_key: string;
  secret_key: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  webhook_url: string | null;
  allowed_domains: string[] | null;
}

interface GenerateApiKeysResponse {
  success: boolean;
  error?: string;
  api_key_id?: string;
  api_key?: string;
  secret_key?: string;
  application_name?: string;
}

export function APIManagement() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newApp, setNewApp] = useState({
    name: '',
    webhook_url: '',
    allowed_domains: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAPIKeys();
  }, []);

  const fetchAPIKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error: any) {
      console.error('Error fetching API keys:', error);
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAPIKey = async () => {
    if (!newApp.name.trim()) {
      toast({
        title: "Error",
        description: "Application name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const domainsArray = newApp.allowed_domains 
        ? newApp.allowed_domains.split(',').map(d => d.trim()).filter(d => d)
        : null;

      const { data, error } = await supabase.rpc('generate_api_keys', {
        p_user_id: user.id,
        p_application_name: newApp.name,
        p_webhook_url: newApp.webhook_url || null,
        p_allowed_domains: domainsArray
      });

      if (error) throw error;

      // Type assertion for the response data
      const response = data as GenerateApiKeysResponse;

      if (response?.success) {
        toast({
          title: "API Keys Generated",
          description: "Your API keys have been created successfully",
        });
        setNewApp({ name: '', webhook_url: '', allowed_domains: '' });
        setShowCreateForm(false);
        fetchAPIKeys();
      } else {
        throw new Error(response?.error || 'Failed to generate API keys');
      }
    } catch (error: any) {
      console.error('Error creating API key:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create API keys",
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

  const deactivateAPIKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', keyId);

      if (error) throw error;

      toast({
        title: "API Key Deactivated",
        description: "The API key has been deactivated",
      });
      fetchAPIKeys();
    } catch (error: any) {
      console.error('Error deactivating API key:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate API key",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
        <div className="h-64 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <AccountStatusGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              API Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage API keys for external applications to integrate with your wallet
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create API Key</span>
          </Button>
        </div>

        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New API Key</CardTitle>
              <CardDescription>
                Generate API credentials for external application integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appName">Application Name *</Label>
                <Input
                  id="appName"
                  placeholder="My E-commerce Store"
                  value={newApp.name}
                  onChange={(e) => setNewApp(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://your-app.com/webhook"
                  value={newApp.webhook_url}
                  onChange={(e) => setNewApp(prev => ({ ...prev, webhook_url: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domains">Allowed Domains (Optional)</Label>
                <Textarea
                  id="domains"
                  placeholder="example.com, app.example.com"
                  value={newApp.allowed_domains}
                  onChange={(e) => setNewApp(prev => ({ ...prev, allowed_domains: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of domains that can use this API key
                </p>
              </div>

              <div className="flex space-x-2">
                <Button onClick={createAPIKey}>Create API Key</Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {apiKeys.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Key className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first API key to start integrating external applications with your wallet.
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  Create API Key
                </Button>
              </CardContent>
            </Card>
          ) : (
            apiKeys.map((apiKey) => (
              <Card key={apiKey.id} className={!apiKey.is_active ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{apiKey.application_name}</span>
                        <Badge variant={apiKey.is_active ? 'default' : 'secondary'}>
                          {apiKey.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Created on {new Date(apiKey.created_at).toLocaleDateString()}
                        {apiKey.last_used_at && (
                          <> • Last used: {new Date(apiKey.last_used_at).toLocaleDateString()}</>
                        )}
                      </CardDescription>
                    </div>
                    {apiKey.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deactivateAPIKey(apiKey.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={apiKey.api_key}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(apiKey.api_key, 'API Key')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Secret Key</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type={showSecrets[apiKey.id] ? 'text' : 'password'}
                        value={apiKey.secret_key}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSecretVisibility(apiKey.id)}
                      >
                        {showSecrets[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(apiKey.secret_key, 'Secret Key')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {apiKey.webhook_url && (
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={apiKey.webhook_url}
                          readOnly
                          className="text-sm"
                        />
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  {apiKey.allowed_domains && apiKey.allowed_domains.length > 0 && (
                    <div className="space-y-2">
                      <Label>Allowed Domains</Label>
                      <div className="flex flex-wrap gap-2">
                        {apiKey.allowed_domains.map((domain, index) => (
                          <Badge key={index} variant="outline">
                            {domain}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AccountStatusGuard>
  );
}
