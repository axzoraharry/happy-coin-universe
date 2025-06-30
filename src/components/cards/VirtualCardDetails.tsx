
import { useState } from 'react';
import { VirtualCard, VirtualCardTransaction } from '@/lib/virtualCard';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VirtualCardInfo } from './VirtualCardInfo';
import { VirtualCardActions } from './VirtualCardActions';
import { CardTransactions } from './CardTransactions';
import { CardTransactionAnalytics } from './CardTransactionAnalytics';
import { EnhancedTransactionTest } from './EnhancedTransactionTest';

interface VirtualCardDetailsProps {
  selectedCard: VirtualCard;
  transactions: VirtualCardTransaction[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onCardUpdated: () => void;
}

export function VirtualCardDetails({
  selectedCard,
  transactions,
  isLoading,
  setIsLoading,
  onCardUpdated
}: VirtualCardDetailsProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTransactionComplete = () => {
    onCardUpdated();
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="lg:col-span-2 space-y-6">
      <Card>
        <CardContent className="p-6">
          <VirtualCardInfo selectedCard={selectedCard} />
          <VirtualCardActions
            selectedCard={selectedCard}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onCardUpdated={handleTransactionComplete}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="test-api">Test API</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <CardTransactions 
                transactions={transactions} 
                isLoading={isLoading} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <CardTransactionAnalytics 
            cardId={selectedCard.id} 
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="test-api" className="space-y-4">
          <EnhancedTransactionTest 
            cards={[{
              id: selectedCard.id,
              masked_card_number: selectedCard.masked_card_number || '',
              status: selectedCard.status
            }]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
