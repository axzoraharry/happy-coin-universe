
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings } from 'lucide-react';
import { TransactionPinSetup } from './TransactionPinSetup';
import { EnhancedTransferForm } from '../transfers/EnhancedTransferForm';

export function WalletActions() {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-sm bg-gradient-to-r from-card/80 to-card/60 border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Wallet Actions
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage your Happy Coins with ease
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transfer" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="transfer" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Transfer
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transfer" className="space-y-4">
              <EnhancedTransferForm />
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
