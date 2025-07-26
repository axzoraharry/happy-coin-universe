import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, Shield, Lightbulb, RefreshCw } from 'lucide-react';
import { TransactionAnalyzer, TransactionInsight, SpendingPattern } from '@/lib/ai/transactionAnalyzer';
import { useToast } from '@/hooks/use-toast';

interface TransactionInsightsProps {
  transactions: any[];
  selectedTransaction?: any;
}

export function TransactionInsights({ transactions, selectedTransaction }: TransactionInsightsProps) {
  const [insights, setInsights] = useState<TransactionInsight | null>(null);
  const [spendingPatterns, setSpendingPatterns] = useState<SpendingPattern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    initializeAI();
  }, []);

  useEffect(() => {
    if (selectedTransaction && modelsLoaded) {
      analyzeSelectedTransaction();
    }
  }, [selectedTransaction, modelsLoaded]);

  const initializeAI = async () => {
    try {
      setIsLoading(true);
      toast({
        title: "🧠 Initializing AI Models",
        description: "Loading transaction analysis capabilities...",
      });
      
      await TransactionAnalyzer.initializeModels();
      setModelsLoaded(true);
      
      if (transactions.length > 0) {
        await analyzeSpendingPatterns();
      }
      
      toast({
        title: "✨ AI Ready",
        description: "Transaction insights are now available!",
      });
    } catch (error) {
      console.error('Error initializing AI:', error);
      toast({
        title: "Error",
        description: "Failed to initialize AI models. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeSelectedTransaction = async () => {
    if (!selectedTransaction) return;
    
    try {
      setIsLoading(true);
      const insight = await TransactionAnalyzer.analyzeTransaction(selectedTransaction);
      setInsights(insight);
    } catch (error) {
      console.error('Error analyzing transaction:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeSpendingPatterns = async () => {
    try {
      const patterns = await TransactionAnalyzer.analyzeSpendingPatterns(transactions);
      setSpendingPatterns(patterns);
    } catch (error) {
      console.error('Error analyzing spending patterns:', error);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE': return 'bg-green-100 text-green-800';
      case 'NEGATIVE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };

  if (isLoading && !modelsLoaded) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 animate-pulse" />
            Loading AI Models
          </CardTitle>
          <CardDescription>
            Initializing transaction analysis capabilities...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={33} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">
            Downloading and initializing Hugging Face models...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Transaction Insights
            <Button
              variant="outline"
              size="sm"
              onClick={initializeAI}
              disabled={isLoading}
              className="ml-auto"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Analysis
            </Button>
          </CardTitle>
          <CardDescription>
            Powered by Hugging Face Transformers - AI-driven transaction analysis
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="transaction" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transaction">Transaction Analysis</TabsTrigger>
          <TabsTrigger value="patterns">Spending Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="transaction" className="space-y-4">
          {selectedTransaction && insights ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Badge className={getRiskColor(insights.riskLevel)}>
                      {insights.riskLevel.toUpperCase()} RISK
                    </Badge>
                    <Badge className={getSentimentColor(insights.sentiment.label)}>
                      {insights.sentiment.label} ({Math.round(insights.sentiment.score * 100)}%)
                    </Badge>
                    <Badge variant="outline">
                      {insights.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insights.insights.map((insight, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insights.recommendations.map((rec, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">
                  Select a transaction to view AI insights
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spending Patterns Analysis</CardTitle>
              <CardDescription>
                AI-powered categorization and trend analysis of your spending habits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {spendingPatterns.map((pattern, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{pattern.category}</span>
                        <span>{getTrendIcon(pattern.trend)}</span>
                        <Badge variant="outline">
                          {pattern.frequency} transactions
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${pattern.amount.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          {pattern.percentage.toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                    <Progress value={pattern.percentage} className="w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}