
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Activity, 
  Clock, 
  TrendingUp,
  Download,
  RefreshCw,
  Zap
} from 'lucide-react';
import { securityMonitor } from '@/lib/securityMonitor';

interface SecurityMetrics {
  failedLoginAttempts: number;
  suspiciousTransactions: number;
  rateLimit: number;
  anomalousPatterns: number;
  lastThreatDetected?: string;
}

interface SecurityEvent {
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  userId?: string;
  timestamp: string;
}

export function RealTimeSecurityDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<SecurityEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadSecurityData();
    
    // Set up real-time monitoring
    const interval = setInterval(loadSecurityData, 10000); // Update every 10 seconds
    
    // Listen for security alerts
    securityMonitor.onAlert((event) => {
      setRecentAlerts(prev => [event, ...prev.slice(0, 9)]); // Keep last 10 alerts
    });

    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadSecurityData = () => {
    const newMetrics = securityMonitor.getSecurityMetrics();
    setMetrics(newMetrics);
    setLastUpdate(new Date());
  };

  const handleRefresh = () => {
    loadSecurityData();
  };

  const generateReport = () => {
    const report = securityMonitor.generateSecurityReport();
    
    // Create downloadable report
    const reportData = {
      timestamp: new Date().toISOString(),
      ...report
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getThreatLevel = (): { level: string; color: string; description: string } => {
    if (!metrics) return { level: 'Unknown', color: 'gray', description: 'Loading...' };
    
    const totalThreats = metrics.failedLoginAttempts + metrics.suspiciousTransactions + 
                        metrics.anomalousPatterns + metrics.rateLimit;
    
    if (totalThreats === 0) {
      return { level: 'Secure', color: 'green', description: 'No threats detected' };
    } else if (totalThreats < 5) {
      return { level: 'Low Risk', color: 'yellow', description: 'Minimal threat activity' };
    } else if (totalThreats < 15) {
      return { level: 'Medium Risk', color: 'orange', description: 'Moderate threat activity' };
    } else {
      return { level: 'High Risk', color: 'red', description: 'Significant threat activity detected' };
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'low': return <Eye className="h-4 w-4 text-blue-600" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const threatLevel = getThreatLevel();

  if (!metrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Shield className="h-8 w-8 mx-auto mb-2 animate-pulse" />
            <div className="text-lg font-medium">Initializing Security Monitor...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Security Dashboard</h2>
          <p className="text-muted-foreground">
            Advanced threat detection and security monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={generateReport} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Threat Level Overview */}
      <Card className="border-l-4" style={{ borderLeftColor: threatLevel.color }}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" style={{ color: threatLevel.color }} />
            <span>Current Threat Level: {threatLevel.level}</span>
          </CardTitle>
          <CardDescription>{threatLevel.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            <div className="flex items-center space-x-2">
              {isMonitoring && (
                <>
                  <Zap className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">Live Monitoring</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Login Attempts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.failedLoginAttempts}</div>
            <Progress 
              value={(metrics.failedLoginAttempts / 20) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.suspiciousTransactions}</div>
            <Progress 
              value={(metrics.suspiciousTransactions / 10) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limit Hits</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.rateLimit}</div>
            <Progress 
              value={(metrics.rateLimit / 50) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threat Patterns</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.anomalousPatterns}</div>
            <Progress 
              value={(metrics.anomalousPatterns / 5) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">Detected patterns</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Recent Security Alerts</span>
          </CardTitle>
          <CardDescription>
            Real-time security events and threat detection alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((alert, index) => (
                <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="font-medium">
                        {alert.eventType.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                      {alert.details && Object.keys(alert.details).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {Object.entries(alert.details).slice(0, 3).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={getSeverityColor(alert.severity)}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <div className="text-lg font-medium">All Clear</div>
                <div>No security alerts in the last 24 hours</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      {metrics.lastThreatDetected && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Last threat detected:</strong> {new Date(metrics.lastThreatDetected).toLocaleString()}
            <br />
            Consider reviewing your security settings and recent activity.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
