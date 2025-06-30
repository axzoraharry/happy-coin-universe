
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VirtualCard, VirtualCardAPI } from '@/lib/virtualCard';

interface DeleteCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  card: VirtualCard | null;
  onCardDeleted: () => void;
}

export function DeleteCardDialog({
  isOpen,
  onClose,
  card,
  onCardDeleted
}: DeleteCardDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!card) return;

    setIsDeleting(true);
    
    try {
      const result = await VirtualCardAPI.deleteVirtualCard(card.id);
      
      if (result.success) {
        toast({
          title: "Card Deleted",
          description: result.message || "Virtual card has been permanently deleted",
        });
        onCardDeleted();
        onClose();
      } else {
        toast({
          title: "Delete Failed",
          description: result.error || "Failed to delete virtual card",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Delete card error:', error);
      toast({
        title: "Delete Failed",
        description: "An unexpected error occurred while deleting the card",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Virtual Card
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete this virtual card? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        {card && (
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Card Number:</span>
              <span className="font-mono text-sm">{card.masked_card_number || `**** **** **** ****`}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <span className="text-sm capitalize">{card.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Daily Limit:</span>
              <span className="text-sm">{card.daily_limit} HC</span>
            </div>
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1"
          >
            {isDeleting ? "Deleting..." : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Card
              </>
            )}
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 mt-0.5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Warning</p>
              <p>Deleting this card will permanently remove all card data and transaction history. This action cannot be reversed.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
