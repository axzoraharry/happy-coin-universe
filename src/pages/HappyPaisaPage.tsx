
import { HappyPaisaDashboard } from '@/components/wallet/HappyPaisaDashboard';
import { HappyPaisaTransferForm } from '@/components/transfers/HappyPaisaTransferForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Server, Shield, Zap } from 'lucide-react';

export default function HappyPaisaPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Wallet className="h-8 w-8 mr-3 text-primary" />
          Happy Paisa Ledger
        </h1>
        <p className="text-muted-foreground">
          Advanced wallet management powered by our secure Go-based ledger service
        </p>
      </div>

      <HappyPaisaDashboard />

      <div className="grid gap-6 lg:grid-cols-2">
        <HappyPaisaTransferForm />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>Service Features</span>
            </CardTitle>
            <CardDescription>
              Powered by our dedicated Happy Paisa Ledger microservice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Secure Transactions</h4>
                <p className="text-sm text-muted-foreground">
                  All transactions are processed through our secure Go-based ledger service
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Real-time Processing</h4>
                <p className="text-sm text-muted-foreground">
                  Instant balance updates and transaction confirmations
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Wallet className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Automatic Wallet Management</h4>
                <p className="text-sm text-muted-foreground">
                  Wallets are automatically created and synchronized across services
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">
                <p className="font-medium">Service Status:</p>
                <p>Running on port 8004 with PostgreSQL backend</p>
                <p>Health check endpoint: /health</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
