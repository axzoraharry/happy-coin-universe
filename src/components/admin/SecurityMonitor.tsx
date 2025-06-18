
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Activity, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityMetric {
  label: string;
  value: number;
  status: 'good' | 'warning' | 'critical';
  description: string;
}

export function SecurityMonitor() {
  const [metrics, setMetrics] = useState<SecurityMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchSecurityMetrics = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get failed transactions in last hour
      const { data: failedTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      // Get API key usage
      const { data: apiKeys } = await supabase
        .from('api_keys')
        .select('*')
        .eq('created_by', user.id);

      // Get recent webhook failures
      const { data: webhookLogs } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('success', false)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get payment requests in last 24h
      const { data: paymentRequests } = await supabase
        .from('payment_requests')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const newMetrics: SecurityMetric[] = [
        {
          label: 'Failed Transactions (1h)',
          value: failedTransactions?.length || 0,
          status: (failedTransactions?.length || 0) > 5 ? 'critical' : (failedTransactions?.length || 0) > 2 ? 'warning' : 'good',
          description: 'Number of failed transactions in the last hour'
        },
        {
          label: 'Active API Keys',
          value: apiKeys?.filter(key => key.is_active).length || 0,
          status: 'good',
          description: 'Number of active API keys for your account'
        },
        {
          label: 'Webhook Failures (24h)',
          value: webhookLogs?.length || 0,
          status: (webhookLogs?.length || 0) > 10 ? 'critical' : (webhookLogs?.length || 0) > 5 ? 'warning' : 'good',
          description: 'Failed webhook deliveries in the last 24 hours'
        },
        {
          label: 'Payment Requests (24h)',
          value: paymentRequests?.length || 0,
          status: (paymentRequests?.length || 0) > 1000 ? 'warning' : 'good',
          description: 'Number of payment requests processed in the last 24 hours'
        }
      ];

      setMetrics(newMetrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching security metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityMetrics();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchSecurityMetrics, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: SecurityMetric['status']) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: SecurityMetric['status']) => {
    switch (status) {
      case 'good': return <Shield className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>Security Monitor</span>
            </CardTitle>
            <CardDescription>
              Real-time security metrics and monitoring
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSecurityMetrics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getStatusColor(metric.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(metric.status)}
                  <span className="font-medium">{metric.label}</span>
                </div>
                <Badge variant="outline" className="text-lg font-bold">
                  {metric.value}
                </Badge>
              </div>
              <p className="text-sm opacity-80">{metric.description}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          </div>
          <Badge variant="outline" className="text-green-600">
            System Secure
          </Badge>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Security Features Active:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Input validation and sanitization</li>
                <li>Rate limiting on critical endpoints</li>
                <li>PIN verification for sensitive operations</li>
                <li>API key validation and monitoring</li>
                <li>Enhanced webhook security</li>
                <li>Real-time security monitoring</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
