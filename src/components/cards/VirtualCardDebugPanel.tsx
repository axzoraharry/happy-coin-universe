import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle, Info, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface IntegrityCheck {
  total_cards: number;
  active_cards: number;
  expired_cards: number;
  validation_attempts_today: number;
  successful_validations_today: number;
  validation_success_rate: number;
}

export function VirtualCardDebugPanel() {
  const [integrityData, setIntegrityData] = useState<IntegrityCheck | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const checkIntegrity = async () => {
    setIsLoading(true);
    try {
      // Use a direct SQL query instead of RPC call since the function might not be in types
      const { data, error } = await supabase
        .from('virtual_cards')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      // Get basic card statistics
      const { data: allCards } = await supabase
        .from('virtual_cards')
        .select('status, expiry_date');
      
      const { data: validationAttempts } = await supabase
        .from('card_validation_attempts')
        .select('success, created_at')
        .gte('created_at', new Date().toISOString().split('T')[0]);
      
      const totalCards = allCards?.length || 0;
      const activeCards = allCards?.filter(card => 
        card.status === 'active' && new Date(card.expiry_date) > new Date()
      ).length || 0;
      const expiredCards = allCards?.filter(card => 
        new Date(card.expiry_date) <= new Date()
      ).length || 0;
      
      const attemptsToday = validationAttempts?.length || 0;
      const successfulToday = validationAttempts?.filter(attempt => attempt.success).length || 0;
      const successRate = attemptsToday > 0 ? Math.round((successfulToday / attemptsToday) * 100) : 0;
      
      const integrityResult: IntegrityCheck = {
        total_cards: totalCards,
        active_cards: activeCards,
        expired_cards: expiredCards,
        validation_attempts_today: attemptsToday,
        successful_validations_today: successfulToday,
        validation_success_rate: successRate
      };
      
      setIntegrityData(integrityResult);
      toast({
        title: "Integrity Check Complete",
        description: "Virtual card system integrity has been analyzed",
      });
    } catch (error) {
      toast({
        title: "Integrity Check Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (rate: number) => {
    if (rate >= 90) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (rate >= 70) return <Info className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getStatusColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (rate >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <Card className="border-2 border-dashed border-muted">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Virtual Card System Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button 
            onClick={checkIntegrity} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Checking...' : 'Run Integrity Check'}
          </Button>
        </div>

        {integrityData && (
          <>
            <Separator />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {integrityData.total_cards}
                </div>
                <div className="text-sm text-muted-foreground">Total Cards</div>
              </div>
              
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {integrityData.active_cards}
                </div>
                <div className="text-sm text-muted-foreground">Active Cards</div>
              </div>
              
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {integrityData.expired_cards}
                </div>
                <div className="text-sm text-muted-foreground">Expired Cards</div>
              </div>
              
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {integrityData.validation_attempts_today}
                </div>
                <div className="text-sm text-muted-foreground">Today's Attempts</div>
              </div>
              
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {integrityData.successful_validations_today}
                </div>
                <div className="text-sm text-muted-foreground">Successful Today</div>
              </div>
              
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Badge className={`${getStatusColor(integrityData.validation_success_rate)} flex items-center gap-1 w-full justify-center`}>
                  {getStatusIcon(integrityData.validation_success_rate)}
                  {integrityData.validation_success_rate}%
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">Success Rate</div>
              </div>
            </div>

            <Separator />
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">System Status</h4>
              <div className="grid gap-2">
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-sm">Card Generation</span>
                  <Badge variant={integrityData.total_cards > 0 ? 'default' : 'secondary'}>
                    {integrityData.total_cards > 0 ? 'Operational' : 'No Cards'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-sm">Validation System</span>
                  <Badge variant={integrityData.validation_success_rate >= 70 ? 'default' : 'destructive'}>
                    {integrityData.validation_success_rate >= 70 ? 'Healthy' : 'Issues Detected'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-sm">Card Expiry Management</span>
                  <Badge variant={integrityData.expired_cards === 0 ? 'default' : 'secondary'}>
                    {integrityData.expired_cards === 0 ? 'All Current' : `${integrityData.expired_cards} Expired`}
                  </Badge>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
