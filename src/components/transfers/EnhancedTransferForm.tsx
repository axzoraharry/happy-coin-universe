
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeftRight } from 'lucide-react';
import { SecureTransferForm } from './SecureTransferForm';
import { TransferForm } from './TransferForm';

export function EnhancedTransferForm() {
  return (
    <Card className="backdrop-blur-sm bg-gradient-to-r from-card/80 to-card/60 border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent flex items-center">
          <ArrowLeftRight className="h-5 w-5 mr-2 text-green-600" />
          Happy Coins Transfer
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Choose your preferred transfer method
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="secure" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="secure" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Shield className="h-4 w-4 mr-2" />
              Secure Transfer
            </TabsTrigger>
            <TabsTrigger value="basic" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Basic Transfer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="secure" className="space-y-4">
            <div className="bg-green-50 p-3 rounded-lg border border-green-200 mb-4">
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">Recommended: Secure Transfer</p>
                  <p>Enhanced security with PIN verification and recipient validation</p>
                </div>
              </div>
            </div>
            <SecureTransferForm />
          </TabsContent>

          <TabsContent value="basic" className="space-y-4">
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-4">
              <div className="flex items-start space-x-2">
                <ArrowLeftRight className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Basic Transfer</p>
                  <p>Simple transfer without additional security verification</p>
                </div>
              </div>
            </div>
            <TransferForm />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
