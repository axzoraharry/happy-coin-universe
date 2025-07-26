import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, Filter } from 'lucide-react';
import { pipeline } from '@huggingface/transformers';
import { useToast } from '@/hooks/use-toast';

interface SmartTransactionSearchProps {
  transactions: any[];
  onTransactionSelect: (transaction: any) => void;
}

export function SmartTransactionSearch({ transactions, onTransactionSelect }: SmartTransactionSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [embedder, setEmbedder] = useState<any>(null);
  const [transactionEmbeddings, setTransactionEmbeddings] = useState<Map<string, number[]>>(new Map());
  const { toast } = useToast();

  useEffect(() => {
    initializeEmbedder();
  }, []);

  useEffect(() => {
    if (transactions.length > 0 && embedder) {
      generateTransactionEmbeddings();
    }
  }, [transactions, embedder]);

  const initializeEmbedder = async () => {
    try {
      console.log('Loading semantic search model...');
      const model = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
      setEmbedder(model);
      
      toast({
        title: "🔍 Smart Search Ready",
        description: "Semantic transaction search is now available!",
      });
    } catch (error) {
      console.error('Error loading embedder:', error);
      toast({
        title: "Search Error",
        description: "Failed to initialize smart search. Using basic search instead.",
        variant: "destructive",
      });
    }
  };

  const generateTransactionEmbeddings = async () => {
    if (!embedder) return;

    try {
      console.log('Generating embeddings for transactions...');
      const embeddings = new Map<string, number[]>();

      for (const transaction of transactions) {
        const text = `${transaction.description || ''} ${transaction.transaction_type} ${transaction.amount}`;
        const embedding = await embedder(text, { pooling: 'mean', normalize: true });
        embeddings.set(transaction.id, Array.from(embedding.data as Float32Array));
      }

      setTransactionEmbeddings(embeddings);
      console.log(`Generated embeddings for ${embeddings.size} transactions`);
    } catch (error) {
      console.error('Error generating embeddings:', error);
    }
  };

  const cosineSimilarity = (a: number[], b: number[]): number => {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  };

  const performSemanticSearch = async (query: string) => {
    if (!embedder || !query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      // Generate embedding for search query
      const queryEmbedding = await embedder(query, { pooling: 'mean', normalize: true });
      const queryVector = Array.from(queryEmbedding.data as Float32Array);

      // Calculate similarities
      const similarities = transactions.map(transaction => {
        const transactionEmbedding = transactionEmbeddings.get(transaction.id);
        if (!transactionEmbedding) return { transaction, similarity: 0 };

        const similarity = cosineSimilarity(queryVector, transactionEmbedding);
        return { transaction, similarity };
      });

      // Sort by similarity and filter results
      const results = similarities
        .filter(item => item.similarity > 0.3) // Similarity threshold
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10) // Top 10 results
        .map(item => ({
          ...item.transaction,
          similarity: item.similarity
        }));

      setSearchResults(results);

      if (results.length === 0) {
        toast({
          title: "No matches found",
          description: "Try using different keywords or phrases.",
        });
      }
    } catch (error) {
      console.error('Error performing semantic search:', error);
      // Fallback to basic text search
      performBasicSearch(query);
    } finally {
      setIsSearching(false);
    }
  };

  const performBasicSearch = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    const results = transactions.filter(transaction => 
      (transaction.description || '').toLowerCase().includes(lowercaseQuery) ||
      transaction.transaction_type.toLowerCase().includes(lowercaseQuery) ||
      transaction.amount.toString().includes(query)
    );
    setSearchResults(results);
  };

  const handleSearch = () => {
    if (embedder && transactionEmbeddings.size > 0) {
      performSemanticSearch(searchQuery);
    } else {
      performBasicSearch(searchQuery);
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'bg-blue-100 text-blue-800';
      case 'refund': return 'bg-green-100 text-green-800';
      case 'validation': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Smart Transaction Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions with natural language (e.g., 'large dining expenses', 'recent refunds')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? (
              <Filter className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {embedder && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-purple-500" />
            Semantic search enabled - try natural language queries!
          </div>
        )}

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {searchResults.map((transaction) => (
            <div
              key={transaction.id}
              className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onTransactionSelect(transaction)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getTransactionTypeColor(transaction.transaction_type)}>
                      {transaction.transaction_type}
                    </Badge>
                    {transaction.similarity && (
                      <Badge variant="outline">
                        {Math.round(transaction.similarity * 100)}% match
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium">{transaction.description || 'No description'}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(transaction.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatAmount(transaction.amount)}</p>
                  {transaction.status && (
                    <p className="text-xs text-muted-foreground capitalize">
                      {transaction.status}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {searchQuery && searchResults.length === 0 && !isSearching && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No transactions found for "{searchQuery}"</p>
            <p className="text-sm">Try different keywords or check your spelling</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}