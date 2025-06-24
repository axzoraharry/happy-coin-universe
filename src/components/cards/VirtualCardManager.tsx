
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Plus, 
  Eye, 
  EyeOff, 
  Freeze, 
  Shield, 
  Settings,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wallet
} from 'lucide-react';
import { VirtualCardDisplay } from './VirtualCardDisplay';
import { CardControls } from './CardControls';
import { CardTransactions } from './CardTransactions';
import { CardIssuanceForm } from './CardIssuanceForm';
import { useToast } from '@/hooks/use-toast';

interface VirtualCard {
  id: string;
  masked_number: string;
  expiry_date: string;
  status: 'active' | 'frozen' | 'pending' | 'blocked';
  created_at: string;
  spend_limit_daily: number;
  spend_limit_monthly: number;
  balance: number;
  last_used?: string;
}

export function VirtualCardManager() {
  const [cards, setCards] = useState<VirtualCard[]>([
    {
      id: 'card_001',
      masked_number: '**** **** **** 1234',
      expiry_date: '12/26',
      status: 'active',
      created_at: '2024-01-15',
      spend_limit_daily: 5000,
      spend_limit_monthly: 50000,
      balance: 2500.00,
      last_used: '2024-06-20'
    }
  ]);
  
  const [selectedCard, setSelectedCard] = useState<VirtualCard | null>(cards[0] || null);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [showIssuanceForm, setShowIssuanceForm] = useState(false);
  const { toast } = useToast();

  const handleCardAction = async (action: string, cardId: string) => {
    // Placeholder for actual API integration with Card Issuing Service
    console.log(`Card action: ${action} for card: ${cardId}`);
    
    switch (action) {
      case 'freeze':
        toast({
          title: "Card Frozen",
          description: "Your virtual card has been temporarily frozen",
        });
        break;
      case 'unfreeze':
        toast({
          title: "Card Unfrozen",
          description: "Your virtual card is now active",
        });
        break;
      default:
        break;
    }
  };

  const handleCardIssuance = async (cardData: any) => {
    // Placeholder for actual card issuance API call
    console.log('Issuing new card:', cardData);
    
    toast({
      title: "Card Issuance Initiated",
      description: "Your virtual debit card request is being processed. You'll receive it within 24 hours.",
    });
    
    setShowIssuanceForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'frozen': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'blocked': return 'bg-red-500/10 text-red-700 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'frozen': return <Freeze className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'blocked': return <AlertTriangle className="h-3 w-3" />;
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
            Virtual Debit Cards
          </h2>
          <p className="text-muted-foreground text-lg">
            Use your Happy Paisa anywhere cards are accepted
          </p>
        </div>
        <Button 
          onClick={() => setShowIssuanceForm(true)}
          className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Issue New Card
        </Button>
      </div>

      {/* Regulatory Notice */}
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-amber-800">Regulatory Partnership Notice</h4>
              <p className="text-sm text-amber-700">
                Virtual cards are issued in partnership with RBI-authorized financial institutions. 
                Full KYC verification is required for card issuance as per RBI PPI guidelines.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards Overview */}
      {cards.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Card Selection & Display */}
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
                        Exp: {card.expiry_date}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="font-mono text-lg font-semibold">{card.masked_number}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Balance</span>
                        <span className="font-semibold">{card.balance.toFixed(2)} HC</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Card Management Tabs */}
          <div className="lg:col-span-2">
            {selectedCard && (
              <Tabs defaultValue="details" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 bg-muted/30 p-1 rounded-lg">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="controls">Controls</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="wallet">Wallet</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <VirtualCardDisplay 
                    card={selectedCard}
                    showDetails={showCardDetails}
                    onToggleDetails={() => setShowCardDetails(!showCardDetails)}
                    onCardAction={handleCardAction}
                  />
                </TabsContent>

                <TabsContent value="controls" className="space-y-4">
                  <CardControls 
                    card={selectedCard}
                    onUpdateControls={(controls) => console.log('Update controls:', controls)}
                  />
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                  <CardTransactions cardId={selectedCard.id} />
                </TabsContent>

                <TabsContent value="wallet" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Digital Wallet Integration
                      </CardTitle>
                      <CardDescription>
                        Add your virtual card to mobile wallets for contactless payments
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <Button variant="outline" className="justify-start">
                          <Smartphone className="h-4 w-4 mr-2" />
                          Add to Google Pay
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <Smartphone className="h-4 w-4 mr-2" />
                          Add to Apple Pay
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Push provisioning will be available once regulatory partnerships are established
                      </p>
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
                  Issue your first virtual debit card to start using Happy Paisa for online purchases and transactions worldwide.
                </p>
              </div>
              <Button 
                onClick={() => setShowIssuanceForm(true)}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Issue Your First Card
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card Issuance Form Modal */}
      {showIssuanceForm && (
        <CardIssuanceForm
          onIssue={handleCardIssuance}
          onCancel={() => setShowIssuanceForm(false)}
        />
      )}
    </div>
  );
}
