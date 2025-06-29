
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  CreditCard, 
  Settings,
  Power,
  PowerOff,
  History,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lock,
  Trash2
} from 'lucide-react';
import { VirtualCard, VirtualCardTransaction, VirtualCardAPI } from '@/lib/virtualCard';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'inactive': return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
      case 'blocked': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'expired': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'inactive': return <PowerOff className="h-3 w-3" />;
      case 'blocked': return <AlertTriangle className="h-3 w-3" />;
      case 'expired': return <Clock className="h-3 w-3" />;
      default: return <CreditCard className="h-3 w-3" />;
    }
  };

  const handleUpdateCardStatus = async (cardId: string, newStatus: 'active' | 'inactive' | 'blocked') => {
    try {
      setIsLoading(true);
      const result = await VirtualCardAPI.updateCardStatus(cardId, newStatus);
      
      if (result.success) {
        toast({
          title: "Card Status Updated",
          description: `Card status changed to ${newStatus}`,
        });
        onCardUpdated();
      } else {
        throw new Error(result.error || 'Status update failed');
      }
    } catch (error) {
      toast({
        title: "Status Update Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      setIsLoading(true);
      const result = await VirtualCardAPI.deleteVirtualCard(cardId);
      
      if (result.success) {
        toast({
          title: "Card Deleted",
          description: result.message || "Virtual card has been permanently deleted",
        });
        onCardUpdated();
      } else {
        throw new Error(result.error || 'Card deletion failed');
      }
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lg:col-span-2">
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1 rounded-lg">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Card Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={`${getStatusColor(selectedCard.status)} flex items-center gap-1 w-fit mt-1`}>
                    {getStatusIcon(selectedCard.status)}
                    {selectedCard.status.charAt(0).toUpperCase() + selectedCard.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Card Type</Label>
                  <p className="text-sm capitalize">{selectedCard.card_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Issuer</Label>
                  <p className="text-sm">{selectedCard.issuer_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Expiry Date</Label>
                  <p className="text-sm">{format(new Date(selectedCard.expiry_date), 'MMMM yyyy')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Daily Limit</Label>
                  <p className="text-sm">{selectedCard.daily_limit} HC</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Monthly Limit</Label>
                  <p className="text-sm">{selectedCard.monthly_limit} HC</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Daily Spent</Label>
                  <p className="text-sm">{selectedCard.current_daily_spent} HC</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Monthly Spent</Label>
                  <p className="text-sm">{selectedCard.current_monthly_spent} HC</p>
                </div>
              </div>
              {selectedCard.last_used_at && (
                <div>
                  <Label className="text-sm font-medium">Last Used</Label>
                  <p className="text-sm">{format(new Date(selectedCard.last_used_at), 'PPpp')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Card Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Button 
                  variant={selectedCard.status === 'active' ? "destructive" : "default"}
                  onClick={() => handleUpdateCardStatus(
                    selectedCard.id, 
                    selectedCard.status === 'active' ? 'inactive' : 'active'
                  )}
                  disabled={isLoading}
                >
                  {selectedCard.status === 'active' ? (
                    <>
                      <PowerOff className="h-4 w-4 mr-2" />
                      Deactivate Card
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 mr-2" />
                      Activate Card
                    </>
                  )}
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleUpdateCardStatus(selectedCard.id, 'blocked')}
                  disabled={isLoading || selectedCard.status === 'blocked'}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Block Card
                </Button>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-semibold text-sm text-red-800 mb-3">Danger Zone</h4>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="w-full bg-red-600 hover:bg-red-700"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Card Permanently
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Delete Virtual Card
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>
                          Are you sure you want to permanently delete this virtual card? This action cannot be undone.
                        </p>
                        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                          <p className="text-sm text-red-800 font-medium">
                            Card ending in ****{selectedCard.card_number?.slice(-4) || '****'}
                          </p>
                          <p className="text-sm text-red-700">
                            Status: {selectedCard.status} | Daily Limit: {selectedCard.daily_limit} HC
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          All transaction history for this card will also be permanently deleted.
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteCard(selectedCard.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium capitalize">{transaction.transaction_type.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(transaction.created_at), 'PPpp')}
                        </p>
                      </div>
                      <div className="text-right">
                        {transaction.amount > 0 && (
                          <p className="font-semibold">{transaction.amount} HC</p>
                        )}
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No transactions found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
