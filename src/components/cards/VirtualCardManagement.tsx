
import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VirtualCardAPI, VirtualCard, VirtualCardTransaction } from '@/lib/virtualCard';
import { useToast } from '@/hooks/use-toast';
import { VirtualCardHeader } from './VirtualCardHeader';
import { VirtualCardIssueDialog } from './VirtualCardIssueDialog';
import { VirtualCardValidationDialog } from './VirtualCardValidationDialog';
import { VirtualCardList } from './VirtualCardList';
import { VirtualCardDetails } from './VirtualCardDetails';
import { VirtualCardEmptyState } from './VirtualCardEmptyState';
import { VirtualCardDebugPanel } from './VirtualCardDebugPanel';
import { ExternalCardDemo } from './ExternalCardDemo';

export function VirtualCardManagement() {
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [transactions, setTransactions] = useState<VirtualCardTransaction[]>([]);
  const [selectedCard, setSelectedCard] = useState<VirtualCard | null>(null);
  const [visibleCardNumbers, setVisibleCardNumbers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadUserCards();
  }, []);

  useEffect(() => {
    if (selectedCard) {
      loadCardTransactions(selectedCard.id);
    }
  }, [selectedCard]);

  const loadUserCards = async () => {
    try {
      setIsLoading(true);
      const userCards = await VirtualCardAPI.getUserCards();
      setCards(userCards);
      if (userCards.length > 0 && !selectedCard) {
        setSelectedCard(userCards[0]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load virtual cards",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCardTransactions = async (cardId: string) => {
    try {
      const cardTransactions = await VirtualCardAPI.getCardTransactions(cardId);
      setTransactions(cardTransactions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load card transactions",
        variant: "destructive"
      });
    }
  };

  const toggleCardNumberVisibility = (cardId: string) => {
    setVisibleCardNumbers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const handleCardUpdated = async () => {
    const currentCardId = selectedCard?.id;
    await loadUserCards();
    
    if (currentCardId && !cards.find(card => card.id === currentCardId)) {
      const remainingCards = cards.filter(card => card.id !== currentCardId);
      setSelectedCard(remainingCards.length > 0 ? remainingCards[0] : null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <VirtualCardHeader
        showIssueDialog={showIssueDialog}
        setShowIssueDialog={setShowIssueDialog}
        showValidationDialog={showValidationDialog}
        setShowValidationDialog={setShowValidationDialog}
      />

      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <VirtualCardIssueDialog
          showIssueDialog={showIssueDialog}
          setShowIssueDialog={setShowIssueDialog}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onCardIssued={loadUserCards}
        />
      </Dialog>

      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <VirtualCardValidationDialog
          showValidationDialog={showValidationDialog}
          setShowValidationDialog={setShowValidationDialog}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      </Dialog>

      <VirtualCardDebugPanel />

      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cards">Card Management</TabsTrigger>
          <TabsTrigger value="external">External API Demo</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-6">
          {cards.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <VirtualCardList
                cards={cards}
                selectedCard={selectedCard}
                setSelectedCard={setSelectedCard}
                visibleCardNumbers={visibleCardNumbers}
                toggleCardNumberVisibility={toggleCardNumberVisibility}
              />

              {selectedCard && (
                <VirtualCardDetails
                  selectedCard={selectedCard}
                  transactions={transactions}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  onCardUpdated={handleCardUpdated}
                />
              )}
            </div>
          ) : (
            <VirtualCardEmptyState onIssueCard={() => setShowIssueDialog(true)} />
          )}
        </TabsContent>

        <TabsContent value="external" className="space-y-6">
          <ExternalCardDemo cards={cards} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
