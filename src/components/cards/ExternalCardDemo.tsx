
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VirtualCardApiDemo } from './VirtualCardApiDemo';
import { EnhancedTransactionTest } from './EnhancedTransactionTest';

interface ExternalCardDemoProps {
  cards?: Array<{ id: string; masked_card_number: string; status: string }>;
}

export function ExternalCardDemo({ cards = [] }: ExternalCardDemoProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="api-demo" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="api-demo">API Demo</TabsTrigger>
          <TabsTrigger value="transaction-test">Transaction Test</TabsTrigger>
        </TabsList>

        <TabsContent value="api-demo" className="space-y-6">
          <VirtualCardApiDemo />
        </TabsContent>

        <TabsContent value="transaction-test" className="space-y-6">
          <EnhancedTransactionTest cards={cards} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
