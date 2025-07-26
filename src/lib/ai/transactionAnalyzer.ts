import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface TransactionInsight {
  sentiment: {
    label: string;
    score: number;
  };
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
  insights: string[];
  recommendations: string[];
}

export interface SpendingPattern {
  category: string;
  amount: number;
  frequency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentage: number;
}

export class TransactionAnalyzer {
  private static sentimentAnalyzer: any = null;
  private static classifier: any = null;

  static async initializeModels() {
    if (!this.sentimentAnalyzer) {
      console.log('Loading sentiment analysis model...');
      this.sentimentAnalyzer = await pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
      );
    }

    if (!this.classifier) {
      console.log('Loading text classification model...');
      this.classifier = await pipeline(
        'zero-shot-classification',
        'Xenova/distilbert-base-uncased-mnli'
      );
    }
  }

  static async analyzeTransaction(transaction: {
    description: string;
    amount: number;
    transaction_type: string;
    merchant_info?: any;
  }): Promise<TransactionInsight> {
    await this.initializeModels();

    const description = transaction.description || 'Transaction';
    const amount = Math.abs(transaction.amount);

    // Sentiment analysis
    const sentimentResult = await this.sentimentAnalyzer(description);
    const sentiment = sentimentResult[0];

    // Category classification
    const categories = [
      'Food & Dining', 'Shopping', 'Transportation', 'Entertainment',
      'Health & Medical', 'Bills & Utilities', 'Travel', 'Education',
      'Financial Services', 'Business', 'Other'
    ];

    const categoryResult = await this.classifier(description, categories);
    const category = categoryResult.labels[0];

    // Risk assessment
    const riskLevel = this.assessRisk(transaction, sentiment);

    // Generate insights
    const insights = this.generateInsights(transaction, sentiment, category);
    const recommendations = this.generateRecommendations(transaction, sentiment, category, riskLevel);

    return {
      sentiment,
      category,
      riskLevel,
      insights,
      recommendations
    };
  }

  static async analyzeSpendingPatterns(transactions: any[]): Promise<SpendingPattern[]> {
    const categoryMap = new Map<string, { total: number; count: number; amounts: number[] }>();

    // Group transactions by category
    for (const transaction of transactions) {
      if (transaction.transaction_type === 'purchase' && transaction.amount > 0) {
        const insight = await this.analyzeTransaction(transaction);
        const category = insight.category;
        
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { total: 0, count: 0, amounts: [] });
        }
        
        const data = categoryMap.get(category)!;
        data.total += transaction.amount;
        data.count += 1;
        data.amounts.push(transaction.amount);
      }
    }

    const totalSpending = Array.from(categoryMap.values()).reduce((sum, data) => sum + data.total, 0);

    // Convert to spending patterns
    const patterns: SpendingPattern[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      amount: data.total,
      frequency: data.count,
      trend: this.calculateTrend(data.amounts),
      percentage: (data.total / totalSpending) * 100
    }));

    return patterns.sort((a, b) => b.amount - a.amount);
  }

  private static assessRisk(
    transaction: any,
    sentiment: { label: string; score: number }
  ): 'low' | 'medium' | 'high' {
    const amount = Math.abs(transaction.amount);
    
    // High risk factors
    if (amount > 10000) return 'high';
    if (sentiment.label === 'NEGATIVE' && sentiment.score > 0.8) return 'high';
    if (transaction.transaction_type === 'validation' && sentiment.label === 'NEGATIVE') return 'high';

    // Medium risk factors
    if (amount > 1000) return 'medium';
    if (sentiment.label === 'NEGATIVE' && sentiment.score > 0.6) return 'medium';

    return 'low';
  }

  private static generateInsights(
    transaction: any,
    sentiment: { label: string; score: number },
    category: string
  ): string[] {
    const insights: string[] = [];
    const amount = Math.abs(transaction.amount);

    // Amount-based insights
    if (amount > 5000) {
      insights.push('💰 Large transaction detected - consider reviewing spending limits');
    } else if (amount < 10) {
      insights.push('🪙 Small transaction - great for daily expenses');
    }

    // Sentiment-based insights
    if (sentiment.label === 'POSITIVE' && sentiment.score > 0.8) {
      insights.push('😊 Transaction has positive sentiment - likely a satisfying purchase');
    } else if (sentiment.label === 'NEGATIVE' && sentiment.score > 0.7) {
      insights.push('⚠️ Transaction has negative sentiment - may indicate issues');
    }

    // Category-based insights
    const categoryInsights: Record<string, string> = {
      'Food & Dining': '🍽️ Dining expense - consider meal planning for savings',
      'Shopping': '🛍️ Retail purchase - check if this aligns with your budget',
      'Transportation': '🚗 Transportation cost - essential for mobility',
      'Entertainment': '🎬 Entertainment expense - good for work-life balance',
      'Health & Medical': '🏥 Health-related expense - important investment',
      'Bills & Utilities': '📱 Utility payment - essential recurring expense',
      'Travel': '✈️ Travel expense - enriching life experience',
      'Education': '📚 Educational investment - great for personal growth'
    };

    if (categoryInsights[category]) {
      insights.push(categoryInsights[category]);
    }

    return insights;
  }

  private static generateRecommendations(
    transaction: any,
    sentiment: { label: string; score: number },
    category: string,
    riskLevel: 'low' | 'medium' | 'high'
  ): string[] {
    const recommendations: string[] = [];
    const amount = Math.abs(transaction.amount);

    // Risk-based recommendations
    if (riskLevel === 'high') {
      recommendations.push('🔴 Review this transaction carefully and verify merchant details');
      recommendations.push('📞 Contact support if this transaction seems suspicious');
    } else if (riskLevel === 'medium') {
      recommendations.push('🟡 Monitor similar transactions and set spending alerts');
    }

    // Amount-based recommendations
    if (amount > 2000) {
      recommendations.push('💳 Consider using payment plans for large purchases');
      recommendations.push('📊 Track this against your monthly budget');
    }

    // Category-specific recommendations
    const categoryRecs: Record<string, string[]> = {
      'Food & Dining': [
        '🥗 Try meal prepping to reduce dining expenses',
        '💡 Look for restaurant deals and discounts'
      ],
      'Shopping': [
        '🛒 Compare prices before making purchases',
        '📝 Create shopping lists to avoid impulse buying'
      ],
      'Entertainment': [
        '🎯 Set monthly entertainment budgets',
        '🔍 Look for free or low-cost entertainment options'
      ]
    };

    if (categoryRecs[category]) {
      recommendations.push(...categoryRecs[category]);
    }

    return recommendations;
  }

  private static calculateTrend(amounts: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (amounts.length < 2) return 'stable';
    
    const mid = Math.floor(amounts.length / 2);
    const firstHalf = amounts.slice(0, mid);
    const secondHalf = amounts.slice(mid);
    
    const firstAvg = firstHalf.reduce((sum, amt) => sum + amt, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, amt) => sum + amt, 0) / secondHalf.length;
    
    const difference = (secondAvg - firstAvg) / firstAvg;
    
    if (difference > 0.1) return 'increasing';
    if (difference < -0.1) return 'decreasing';
    return 'stable';
  }
}