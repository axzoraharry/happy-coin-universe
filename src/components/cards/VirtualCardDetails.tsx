
import { useState } from 'react';
import { VirtualCard, VirtualCardTransaction } from '@/lib/virtualCard';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VirtualCardInfo } from './VirtualCardInfo';
import { VirtualCardActions } from './VirtualCardActions';
import { CardTransactions } from './CardTransactions';
import { CardTransactionAnalytics } from './CardTransactionAnalytics';
import { EnhancedTransactionTest } from './EnhancedTransactionTest';
import { useToast } from '@/hooks/use-toast';

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
  const [showDetails, setShowDetails] = useState(false);
  const [secureDetails, setSecureDetails] = useState({
    full_number: '',
    cvv: ''
  });
  const [isLoadingSecure, setIsLoadingSecure] = useState(false);
  const { toast } = useToast();

  const handleTransactionComplete = () => {
    onCardUpdated();
    setRefreshTrigger(prev => prev + 1);
  };

  const handleToggleDetails = () => {
    setShowDetails(!showDetails);
    // Here you would typically fetch secure details from your API
    // For now, using placeholder data
    if (!showDetails && !secureDetails.full_number) {
      setIsLoadingSecure(true);
      // Simulate API call
      setTimeout(() => {
        setSecureDetails({
          full_number: '4532 1234 5678 9012',
          cvv: '123'
        });
        setIsLoadingSecure(false);
      }, 1000);
    }
  };

  const handleCardAction = (action: string, cardId: string) => {
    console.log(`Card action: ${action} for card ${cardId}`);
    // Implement card action logic here
    handleTransactionComplete();
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="lg:col-span-2 space-y-6">
      <Card>
        <CardContent className="p-6">
          <VirtualCardInfo card={selectedCard} />
          <VirtualCardActions
            card={selectedCard}
            showDetails={showDetails}
            onToggleDetails={handleToggleDetails}
            onCardAction={handleCardAction}
            onCopyToClipboard={handleCopyToClipboard}
            secureDetails={secureDetails}
            isLoadingSecure={isLoadingSecure}
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
