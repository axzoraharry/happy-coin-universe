
import { APIDocumentation } from '@/components/api/APIDocumentation';
import { APIManagement } from '@/components/api/APIManagement';
import { IntegrationGuide } from '@/components/api/IntegrationGuide';
import { PaymentRequests } from '@/components/api/PaymentRequests';
import { ServiceStatus } from '@/components/monitoring/ServiceStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function APIPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Management</h1>
        <p className="text-muted-foreground">
          Manage your API keys, monitor services, and integrate with Happy Coins payment system
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="management">API Keys</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <APIDocumentation />
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <APIManagement />
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          <IntegrationGuide />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentRequests />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <ServiceStatus />
        </TabsContent>
      </Tabs>
    </div>
  );
}
