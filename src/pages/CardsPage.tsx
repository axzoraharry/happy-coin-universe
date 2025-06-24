
import { VirtualCardManager } from '@/components/cards/VirtualCardManager';
import { WalletActions } from '@/components/wallet/WalletActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Shield, 
  Globe, 
  Zap, 
  Users,
  ArrowRight,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CardsPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <CreditCard className="h-8 w-8 mr-3 text-primary" />
          Virtual Debit Cards
        </h1>
        <p className="text-muted-foreground">
          Use your Happy Paisa anywhere in the world with virtual debit cards
        </p>
      </div>

      {/* Service Status Banner */}
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-amber-800 text-lg">Development Phase Notice</h3>
                <p className="text-amber-700">
                  Virtual card issuance is currently in development. We're working with RBI-authorized partners 
                  to bring you secure, compliant virtual debit cards. The UI shown here demonstrates the planned 
                  functionality once regulatory partnerships are established.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    <Shield className="h-3 w-3 mr-1" />
                    RBI Compliant
                  </Badge>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    <Globe className="h-3 w-3 mr-1" />
                    Global Acceptance
                  </Badge>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    <Users className="h-3 w-3 mr-1" />
                    Banking Partnership
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Virtual Card Manager */}
      <VirtualCardManager />

      {/* Integration with Happy Paisa */}
      <Card className="bg-gradient-to-r from-primary/10 to-blue-600/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-primary" />
            <span>Happy Paisa Integration</span>
          </CardTitle>
          <CardDescription>
            Seamless connection between your virtual cards and Happy Paisa wallet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Real-time Balance Sync</h4>
                <p className="text-sm text-muted-foreground">
                  Card transactions instantly reflect in your Happy Paisa balance
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Fixed Exchange Rate</h4>
                <p className="text-sm text-muted-foreground">
                  1 Happy Coin = ₹1000 for all card transactions
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Instant Authorization</h4>
                <p className="text-sm text-muted-foreground">
                  Transactions authorized in real-time based on HC balance
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Need More Happy Coins?</h4>
              <p className="text-sm text-muted-foreground">
                Top up your wallet to enable card transactions
              </p>
            </div>
            <Link to="/coins">
              <Button variant="outline">
                Add Happy Coins
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Secure Wallet Actions */}
      <WalletActions />

      {/* Technical Implementation Note */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Technical Architecture</span>
          </CardTitle>
          <CardDescription>
            Backend services ready for integration with card issuing partners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-800">Ready Components</h4>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Card Issuing Service placeholder</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Happy Paisa Ledger integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Transaction authorization flow</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Real-time balance management</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-800">Integration Points</h4>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span>Banking partner API</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span>Card network integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span>KYC verification service</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span>Push provisioning APIs</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-blue-100 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> All backend services are designed to integrate seamlessly with 
                partner APIs (Stripe Issuing, NymCard, Galileo, or direct bank APIs) once regulatory 
                partnerships are established.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
