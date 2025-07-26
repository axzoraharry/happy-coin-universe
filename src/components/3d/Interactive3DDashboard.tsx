import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Box, 
  BarChart3, 
  Globe, 
  Zap, 
  Eye,
  Maximize,
  RotateCcw,
  Play,
  Pause
} from 'lucide-react';
import { FinancialData3D } from './FinancialData3D';
import { TransactionAnalyzer, SpendingPattern } from '@/lib/ai/transactionAnalyzer';
import { useToast } from '@/hooks/use-toast';

interface Interactive3DDashboardProps {
  transactions: any[];
}

export function Interactive3DDashboard({ transactions }: Interactive3DDashboardProps) {
  const [currentView, setCurrentView] = useState<'3d-bars' | 'transaction-flow' | 'risk-analysis'>('3d-bars');
  const [spendingPatterns, setSpendingPatterns] = useState<SpendingPattern[]>([]);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (transactions.length > 0) {
      analyzeTransactionData();
    }
  }, [transactions]);

  const analyzeTransactionData = async () => {
    setIsAnalyzing(true);
    try {
      const patterns = await TransactionAnalyzer.analyzeSpendingPatterns(transactions);
      setSpendingPatterns(patterns);
    } catch (error) {
      console.error('Error analyzing transaction data:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze transaction data for 3D visualization.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const spendingData = useMemo(() => {
    if (spendingPatterns.length === 0) {
      // Generate mock data if no patterns available
      return [
        { name: 'Dining', amount: 1200, count: 15, color: '#ff6b6b' },
        { name: 'Shopping', amount: 800, count: 8, color: '#4ecdc4' },
        { name: 'Transport', amount: 600, count: 12, color: '#45b7d1' },
        { name: 'Entertainment', amount: 400, count: 6, color: '#f9ca24' },
        { name: 'Utilities', amount: 300, count: 4, color: '#6c5ce7' },
      ];
    }

    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a55eea', '#26de81', '#fd79a8'];
    
    return spendingPatterns.slice(0, 8).map((pattern, index) => ({
      name: pattern.category.split(' ')[0], // Shorten category names
      amount: pattern.amount,
      count: pattern.frequency,
      color: colors[index % colors.length]
    }));
  }, [spendingPatterns]);

  const viewDescriptions = {
    '3d-bars': 'Interactive 3D bar chart showing spending by category with real-time hover effects',
    'transaction-flow': 'Animated particle system visualizing transaction flow and risk levels',
    'risk-analysis': 'Dynamic risk assessment rings showing transaction security distribution'
  };

  const stats = useMemo(() => {
    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const avgAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    const highRiskCount = transactions.filter(t => Math.abs(t.amount) > 1000).length;
    
    return {
      totalTransactions,
      totalAmount,
      avgAmount,
      highRiskCount,
      riskPercentage: totalTransactions > 0 ? (highRiskCount / totalTransactions) * 100 : 0
    };
  }, [transactions]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      toast({
        title: "3D Visualization",
        description: "Use mouse to rotate, scroll to zoom, drag to pan",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="h-5 w-5" />
            Interactive 3D Financial Visualization
            <Badge variant="secondary">Powered by Three.js</Badge>
          </CardTitle>
          <CardDescription>
            Immersive 3D visualization of your financial data with real-time interactions
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-sm text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalAmount.toFixed(0)}</div>
            <p className="text-sm text-muted-foreground">Combined value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Average Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgAmount.toFixed(0)}</div>
            <p className="text-sm text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.riskPercentage.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">{stats.highRiskCount} transactions</p>
          </CardContent>
        </Card>
      </div>

      <Card className={isFullscreen ? 'fixed inset-4 z-50 bg-background' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                3D Data Visualization
              </CardTitle>
              <CardDescription>
                {viewDescriptions[currentView]}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoRotating(!isAutoRotating)}
              >
                {isAutoRotating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                Auto Rotate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={analyzeTransactionData}
                disabled={isAnalyzing}
              >
                <RotateCcw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
              >
                <Maximize className="h-4 w-4" />
                {isFullscreen ? 'Exit' : 'Fullscreen'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="3d-bars" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                3D Bars
              </TabsTrigger>
              <TabsTrigger value="transaction-flow" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Flow
              </TabsTrigger>
              <TabsTrigger value="risk-analysis" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Risk
              </TabsTrigger>
            </TabsList>

            <TabsContent value={currentView} className="mt-6">
              <FinancialData3D
                transactions={transactions}
                spendingData={spendingData}
                view={currentView}
              />
            </TabsContent>
          </Tabs>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">3D Visualization Controls</h4>
            <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
              <div>🖱️ <strong>Rotate:</strong> Click and drag</div>
              <div>🔍 <strong>Zoom:</strong> Mouse wheel</div>
              <div>✋ <strong>Pan:</strong> Right-click and drag</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {spendingPatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>3D Visualization Data</CardTitle>
            <CardDescription>
              AI-analyzed spending patterns powering the 3D visualizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {spendingData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${item.amount.toFixed(0)} • {item.count} transactions
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}