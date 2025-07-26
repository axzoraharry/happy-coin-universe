
import { useState, useEffect } from 'react';
import { VirtualCardManager } from '@/components/cards/VirtualCardManager';
import { WalletActions } from '@/components/wallet/WalletActions';
import { TransactionInsights } from '@/components/ai/TransactionInsights';
import { SmartTransactionSearch } from '@/components/ai/SmartTransactionSearch';
import { VoiceAssistant } from '@/components/ai/VoiceAssistant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Shield, 
  Globe, 
  Zap, 
  Users,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Brain,
  Search,
  BarChart3,
  Mic
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { VirtualCardAPI } from '@/lib/virtualCard';
import { useToast } from '@/hooks/use-toast';

export default function CardsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const transactionData = await VirtualCardAPI.getCardTransactions();
      setTransactions(transactionData);
      
      if (transactionData.length === 0) {
        toast({
          title: "No Transactions Found",
          description: "Create a virtual card and make some transactions to see AI insights!",
        });
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSelect = (transaction: any) => {
    setSelectedTransaction(transaction);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Virtual Cards & AI Insights
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Manage your virtual cards with AI-powered transaction analysis, smart search, and predictive insights
        </p>
      </div>

      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="cards" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Cards
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Smart Search
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Voice AI
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-6">
          {/* Service Status Banner */}
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-amber-800 text-lg">AI-Enhanced Virtual Cards</h3>
                    <p className="text-amber-700">
                      Experience the future of financial management with AI-powered transaction insights, 
                      semantic search, and intelligent spending analysis powered by Hugging Face Transformers.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        <Brain className="h-3 w-3 mr-1" />
                        AI Insights
                      </Badge>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        <Search className="h-3 w-3 mr-1" />
                        Smart Search
                      </Badge>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Pattern Analysis
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <VirtualCardManager />
          <WalletActions />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <TransactionInsights 
            transactions={transactions}
            selectedTransaction={selectedTransaction}
          />
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <SmartTransactionSearch 
            transactions={transactions}
            onTransactionSelect={handleTransactionSelect}
          />
          
          {selectedTransaction && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Transaction Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p>{selectedTransaction.description || 'No description'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Amount</p>
                    <p className="font-semibold">${Math.abs(selectedTransaction.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <Badge variant="outline">{selectedTransaction.transaction_type}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant="outline">{selectedTransaction.status}</Badge>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Date</p>
                    <p>{new Date(selectedTransaction.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="voice" className="space-y-6">
          <VoiceAssistant 
            transactions={transactions}
            onTransactionSelect={handleTransactionSelect}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Transactions:</span>
                    <span className="font-semibold">{transactions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Purchase Transactions:</span>
                    <span className="font-semibold">
                      {transactions.filter(t => t.transaction_type === 'purchase').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Refund Transactions:</span>
                    <span className="font-semibold">
                      {transactions.filter(t => t.transaction_type === 'refund').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Volume:</span>
                    <span className="font-semibold">
                      ${transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Features Powered by Hugging Face</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Brain className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Sentiment Analysis</p>
                      <p className="text-sm text-muted-foreground">
                        DistilBERT analyzes transaction sentiment
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Search className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Semantic Search</p>
                      <p className="text-sm text-muted-foreground">
                        Vector embeddings for natural language queries
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Smart Categorization</p>
                      <p className="text-sm text-muted-foreground">
                        Zero-shot classification for spending categories
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Loading transaction analytics...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
