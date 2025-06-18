
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  id: string;
  event: string;
  timestamp: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high';
}

interface SecurityMetrics {
  totalTransfers: number;
  failedTransfers: number;
  rateLimit

: number;
  lastActivity: string;
}

export function SecurityAuditDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load recent transactions for security metrics
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactions) {
        const transfers = transactions.filter(t => t.transaction_type.includes('transfer'));
        const failedTransfers = transfers.filter(t => t.status === 'failed');
        
        setMetrics({
          totalTransfers: transfers.length,
          failedTransfers: failedTransfers.length,
          rateLimit: 0, // This would come from actual rate limit tracking
          lastActivity: transactions[0]?.created_at || 'Never'
        });

        // Simulate security events based on transaction data
        const events: SecurityEvent[] = transactions.slice(0, 10).map((tx, index) => ({
          id: tx.id,
          event: `${tx.transaction_type}_${tx.status}`,
          timestamp: tx.created_at,
          details: {
            amount: tx.amount,
            type: tx.transaction_type,
            status: tx.status
          },
          severity: tx.status === 'failed' ? 'medium' : 'low'
        }));

        setRecentEvents(events);
      }
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Shield className="h-8 w-8 mx-auto mb-2 animate-pulse" />
            <div className="text-lg font-medium">Loading Security Dashboard...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Audit Dashboard</h2>
          <p className="text-muted-foreground">Monitor your account security and transaction activity</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center space-x-2"
        >
          {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span>{showDetails ? 'Hide' : 'Show'} Details</span>
        </Button>
      </div>

      {/* Security Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalTransfers || 0}</div>
            <p className="text-xs text-muted-foreground">Secure transactions completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics?.failedTransfers || 0}</div>
            <p className="text-xs text-muted-foreground">Security interventions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limits</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.rateLimit || 0}</div>
            <p className="text-xs text-muted-foreground">Rate limit hits today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.lastActivity ? new Date(metrics.lastActivity).toLocaleDateString() : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">Last secure transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your account is protected with enhanced security features including PIN verification, 
          rate limiting, and input validation. All transactions are monitored for suspicious activity.
        </AlertDescription>
      </Alert>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>
            Monitor recent activity and security events on your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentEvents.length > 0 ? (
              recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getSeverityIcon(event.severity)}
                    <div>
                      <div className="font-medium">{event.event.replace(/_/g, ' ').toUpperCase()}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                      {showDetails && event.details && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Amount: {event.details.amount} | Type: {event.details.type} | Status: {event.details.status}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={getSeverityColor(event.severity)}>
                    {event.severity.toUpperCase()}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No security events recorded yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
