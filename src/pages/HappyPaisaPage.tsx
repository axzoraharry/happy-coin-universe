
import { HappyPaisaDashboard } from '@/components/wallet/HappyPaisaDashboard';
import { HappyPaisaTransferDialog } from '@/components/wallet/HappyPaisaTransferDialog';
import { HappyPaisaBuyDialog } from '@/components/wallet/HappyPaisaBuyDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Server, Shield, Zap, Send, ShoppingCart, Star, Globe } from 'lucide-react';

export default function HappyPaisaPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Wallet className="h-8 w-8 mr-3 text-primary" />
          Happy Paisa (HP)
        </h1>
        <p className="text-muted-foreground">
          Digital currency pegged to INR (1 HP = ₹1000) • Powered by Stellar Network
        </p>
      </div>

      <HappyPaisaDashboard />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>
              Manage your Happy Paisa with one-click actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <HappyPaisaBuyDialog>
              <Button className="w-full" size="lg">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy Happy Paisa
              </Button>
            </HappyPaisaBuyDialog>
            
            <HappyPaisaTransferDialog>
              <Button variant="outline" className="w-full" size="lg">
                <Send className="h-4 w-4 mr-2" />
                Send HP
              </Button>
            </HappyPaisaTransferDialog>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center">
                All transactions are secured by the Stellar network
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span>Network Features</span>
            </CardTitle>
            <CardDescription>
              Powered by Stellar blockchain technology
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Blockchain Security</h4>
                <p className="text-sm text-muted-foreground">
                  Secured by Stellar's distributed ledger with cryptographic protection
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Near-Instant Settlement</h4>
                <p className="text-sm text-muted-foreground">
                  3-5 second transaction confirmation with minimal network fees
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Globe className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Global Accessibility</h4>
                <p className="text-sm text-muted-foreground">
                  Send HP anywhere in the world with just a Stellar address
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">
                <p className="font-medium">Fixed Peg Guarantee:</p>
                <p>1 Happy Paisa = ₹1,000 INR (Permanently)</p>
                <p>Network: Stellar Testnet (Low fees, Fast confirmation)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
