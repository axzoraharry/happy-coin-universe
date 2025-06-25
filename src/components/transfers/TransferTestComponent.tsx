
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function TransferTestComponent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testDatabaseFunction = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Not Authenticated",
          description: "Please log in to test the function",
          variant: "destructive",
        });
        return;
      }

      console.log('Testing process_secure_wallet_transfer_v2 function...');
      
      // Test the function with dummy data (will fail but show us the response)
      const { data, error } = await supabase.rpc('process_secure_wallet_transfer_v2', {
        sender_id: user.id,
        recipient_id: '00000000-0000-0000-0000-000000000000', // Dummy recipient
        transfer_amount: 1,
        transfer_description: 'Test transfer',
        sender_pin: null
      });

      console.log('Function response:', { data, error });
      setResult({ data, error, timestamp: new Date().toISOString() });

      if (error) {
        toast({
          title: "Function Test Result",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Function Test Result",
          description: `Success: ${JSON.stringify(data)}`,
        });
      }
    } catch (err: any) {
      console.error('Test error:', err);
      setResult({ error: err.message, timestamp: new Date().toISOString() });
      toast({
        title: "Test Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4 border-2 border-dashed border-yellow-300 bg-yellow-50/50">
      <CardHeader>
        <CardTitle className="text-sm text-yellow-800">
          🧪 Database Function Test (Debug Mode)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testDatabaseFunction} 
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? 'Testing...' : 'Test Database Function'}
        </Button>
        
        {result && (
          <div className="bg-white p-3 rounded border text-xs">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
