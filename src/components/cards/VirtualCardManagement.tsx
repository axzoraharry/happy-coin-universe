
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CreditCard, 
  Plus, 
  Eye, 
  EyeOff, 
  Snowflake, 
  Shield, 
  Settings,
  Power,
  PowerOff,
  History,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lock,
  Calendar
} from 'lucide-react';
import { VirtualCardAPI, VirtualCard, VirtualCardTransaction } from '@/lib/virtualCardApi';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function VirtualCardManagement() {
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [transactions, setTransactions] = useState<VirtualCardTransaction[]>([]);
  const [selectedCard, setSelectedCard] = useState<VirtualCard | null>(null);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  
  // Form states
  const [issueForm, setIssueForm] = useState({
    pin: '',
    confirmPin: '',
    dailyLimit: '5000',
    monthlyLimit: '50000'
  });
  
  const [validationForm, setValidationForm] = useState({
    cardNumber: '',
    pin: ''
  });

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

  const handleIssueCard = async () => {
    if (issueForm.pin !== issueForm.confirmPin) {
      toast({
        title: "Error",
        description: "PINs do not match",
        variant: "destructive"
      });
      return;
    }

    if (!/^\d{4}$/.test(issueForm.pin)) {
      toast({
        title: "Error",
        description: "PIN must be exactly 4 digits",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const result = await VirtualCardAPI.issueVirtualCard({
        pin: issueForm.pin,
        daily_limit: parseFloat(issueForm.dailyLimit),
        monthly_limit: parseFloat(issueForm.monthlyLimit)
      });

      if (result.success) {
        toast({
          title: "Card Issued Successfully",
          description: "Your virtual card has been created and activated",
        });
        
        // Show card details temporarily
        toast({
          title: "Card Details (Save These!)",
          description: `Card: ${result.card_number}, CVV: ${result.cvv}, Expires: ${format(new Date(result.expiry_date), 'MM/yy')}`,
          duration: 10000
        });

        setShowIssueDialog(false);
        setIssueForm({ pin: '', confirmPin: '', dailyLimit: '5000', monthlyLimit: '50000' });
        await loadUserCards();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Card Issuance Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateCard = async () => {
    try {
      setIsLoading(true);
      const result = await VirtualCardAPI.validateCard({
        card_number: validationForm.cardNumber,
        pin: validationForm.pin,
        ip_address: window.location.hostname,
        user_agent: navigator.userAgent
      });

      if (result.success) {
        toast({
          title: "Card Validation Successful",
          description: `Card is valid and active. Daily limit: ${result.daily_limit}, Spent: ${result.daily_spent}`,
        });
      } else {
        toast({
          title: "Card Validation Failed",
          description: result.error || "Invalid card details",
          variant: "destructive"
        });
      }

      setShowValidationDialog(false);
      setValidationForm({ cardNumber: '', pin: '' });
    } catch (error) {
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
        await loadUserCards();
      } else {
        throw new Error(result.error);
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-xl">
              <CreditCard className="h-7 w-7 text-primary" />
            </div>
            Virtual Card Management
          </h2>
          <p className="text-muted-foreground text-lg">
            Create, manage, and validate your virtual debit cards
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                <Plus className="h-4 w-4 mr-2" />
                Issue New Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Issue New Virtual Card</DialogTitle>
                <DialogDescription>
                  Create a new virtual debit card with custom limits
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pin">4-Digit PIN</Label>
                    <Input
                      id="pin"
                      type="password"
                      maxLength={4}
                      value={issueForm.pin}
                      onChange={(e) => setIssueForm({...issueForm, pin: e.target.value})}
                      placeholder="1234"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPin">Confirm PIN</Label>
                    <Input
                      id="confirmPin"
                      type="password"
                      maxLength={4}
                      value={issueForm.confirmPin}
                      onChange={(e) => setIssueForm({...issueForm, confirmPin: e.target.value})}
                      placeholder="1234"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dailyLimit">Daily Limit (HC)</Label>
                    <Input
                      id="dailyLimit"
                      type="number"
                      value={issueForm.dailyLimit}
                      onChange={(e) => setIssueForm({...issueForm, dailyLimit: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyLimit">Monthly Limit (HC)</Label>
                    <Input
                      id="monthlyLimit"
                      type="number"
                      value={issueForm.monthlyLimit}
                      onChange={(e) => setIssueForm({...issueForm, monthlyLimit: e.target.value})}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleIssueCard} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Issuing..." : "Issue Card"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Validate Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Validate Virtual Card</DialogTitle>
                <DialogDescription>
                  Check if a card number and PIN combination is valid
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    type="text"
                    maxLength={16}
                    value={validationForm.cardNumber}
                    onChange={(e) => setValidationForm({...validationForm, cardNumber: e.target.value})}
                    placeholder="4000123456789012"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validationPin">PIN</Label>
                  <Input
                    id="validationPin"
                    type="password"
                    maxLength={4}
                    value={validationForm.pin}
                    onChange={(e) => setValidationForm({...validationForm, pin: e.target.value})}
                    placeholder="1234"
                  />
                </div>
                <Button 
                  onClick={handleValidateCard} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Validating..." : "Validate Card"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards Management */}
      {cards.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Card List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-semibold">Your Cards</h3>
            <div className="space-y-3">
              {cards.map((card) => (
                <Card 
                  key={card.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedCard?.id === card.id 
                      ? 'border-primary shadow-lg bg-gradient-to-r from-primary/5 to-blue-600/5' 
                      : 'hover:border-primary/20'
                  }`}
                  onClick={() => setSelectedCard(card)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={`${getStatusColor(card.status)} flex items-center gap-1 px-2 py-1`}>
                        {getStatusIcon(card.status)}
                        {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {format(new Date(card.expiry_date), 'MM/yy')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="font-mono text-sm">**** **** **** ****</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Daily Spent</span>
                        <span className="font-semibold">{card.current_daily_spent} / {card.daily_limit} HC</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Card Details and Management */}
          <div className="lg:col-span-2">
            {selectedCard && (
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
            )}
          </div>
        </div>
      ) : (
        // No Cards State
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-full flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No Virtual Cards Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Issue your first virtual debit card to start managing your digital payments securely.
                </p>
              </div>
              <Button 
                onClick={() => setShowIssueDialog(true)}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Issue Your First Card
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
