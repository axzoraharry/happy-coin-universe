
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield } from 'lucide-react';
import { TransactionPinSetup } from './TransactionPinSetup';
import { TransferForm } from '../transfers/TransferForm';

export function WalletActions() {
  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-sm bg-gradient-to-r from-card/80 to-card/60 border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent flex items-center">
            <Shield className="h-5 w-5 mr-2 text-green-600" />
            Secure Wallet Actions
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage your Happy Coins with enhanced security features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transfer" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="transfer" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Secure Transfer
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Security Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transfer" className="space-y-4">
              <TransferForm />
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <TransactionPinSetup />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
