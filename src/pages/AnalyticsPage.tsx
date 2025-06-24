
import { WalletAnalyticsDashboard } from '@/components/analytics/WalletAnalyticsDashboard';
import { WalletActions } from '@/components/wallet/WalletActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Share2,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <BarChart3 className="h-8 w-8 mr-3 text-primary" />
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground">
          Comprehensive insights into your financial activity and spending patterns
        </p>
      </div>

      {/* Quick Actions */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-600/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Advanced Analytics
              </h3>
              <p className="text-sm text-muted-foreground">
                Export reports, share insights, and customize your analytics view
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Analytics Dashboard */}
      <WalletAnalyticsDashboard />

      {/* Additional Features */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Analytics Schedule
            </CardTitle>
            <CardDescription>
              Set up automated reports and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <div>
                <p className="font-medium">Weekly Summary</p>
                <p className="text-sm text-muted-foreground">Every Monday at 9:00 AM</p>
              </div>
              <Badge variant="outline">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <div>
                <p className="font-medium">Monthly Report</p>
                <p className="text-sm text-muted-foreground">First day of each month</p>
              </div>
              <Badge variant="outline">Active</Badge>
            </div>
            <Button variant="outline" className="w-full">
              Configure Schedules
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Insights</CardTitle>
            <CardDescription>
              Key takeaways from your financial data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Your spending is down 15% this month
                  </p>
                  <p className="text-xs text-green-700">
                    Great job managing your expenses!
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Virtual card usage increased by 30%
                  </p>
                  <p className="text-xs text-blue-700">
                    You're maximizing your digital payments
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-800">
                    Most active on weekdays
                  </p>
                  <p className="text-xs text-purple-700">
                    Consider setting weekday budgets
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secure Wallet Actions */}
      <WalletActions />
    </div>
  );
}
