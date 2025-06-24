
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Server, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { happyPaisaApi } from '@/lib/happyPaisaApi';

interface ServiceHealth {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

export function ServiceStatus() {
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    checkHealth();
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const healthData = await happyPaisaApi.healthCheck();
      setHealth(healthData);
      setIsOnline(true);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
      setIsOnline(false);
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    return isOnline ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = () => {
    if (loading) return <Badge variant="secondary">Checking...</Badge>;
    return <Badge variant={isOnline ? "default" : "destructive"}>{isOnline ? "Online" : "Offline"}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Happy Paisa Ledger Status</span>
          </div>
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Monitor the health and status of the Happy Paisa Ledger service
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium">Service Status</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkHealth}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Check Now
          </Button>
        </div>

        {health && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service:</span>
              <span className="font-medium">{health.service}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version:</span>
              <span className="font-medium">{health.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium capitalize">{health.status}</span>
            </div>
          </div>
        )}

        {lastChecked && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Last checked: {lastChecked.toLocaleTimeString()}</span>
          </div>
        )}

        <div className="bg-muted p-3 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Service Endpoint:</strong> http://localhost:8004
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            <strong>Health Check:</strong> /health
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
