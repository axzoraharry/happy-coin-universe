
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trash2, Settings } from 'lucide-react';
import { VirtualCard, VirtualCardTransaction, VirtualCardAPI } from '@/lib/virtualCard';
import { VirtualCardDisplay } from './VirtualCardDisplay';
import { CardTransactions } from './CardTransactions';
import { DeleteCardDialog } from './DeleteCardDialog';
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
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const handleCardAction = async (action: string, cardId: string) => {
    setIsLoading(true);
    
    try {
      let newStatus: 'active' | 'inactive' | 'blocked' | 'expired';
      
      switch (action) {
        case 'freeze':
          newStatus = 'inactive';
          break;
        case 'unfreeze':
          newStatus = 'active';
          break;
        default:
          return;
      }
      
      const result = await VirtualCardAPI.updateCardStatus(cardId, newStatus);
      
      if (result.success) {
        toast({
          title: "Card Updated",
          description: `Card has been ${newStatus === 'active' ? 'activated' : 'frozen'}`,
        });
        onCardUpdated();
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update card status",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Card action error:', error);
      toast({
        title: "Action Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCard = () => {
    setShowDeleteDialog(true);
  };

  const handleCardDeleted = () => {
    onCardUpdated();
  };

  return (
    <>
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Card Details</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteCard}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Card
            </Button>
          </div>
        </div>

        <VirtualCardDisplay
          card={selectedCard}
          showDetails={showDetails}
          onToggleDetails={() => setShowDetails(!showDetails)}
          onCardAction={handleCardAction}
        />

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <CardTransactions 
              transactions={transactions}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      <DeleteCardDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        card={selectedCard}
        onCardDeleted={handleCardDeleted}
      />
    </>
  );
}
