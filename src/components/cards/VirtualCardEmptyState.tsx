
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus } from 'lucide-react';

interface VirtualCardEmptyStateProps {
  onIssueCard: () => void;
}

export function VirtualCardEmptyState({ onIssueCard }: VirtualCardEmptyStateProps) {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-full flex items-center justify-center">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">No Virtual Cards Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Issue your first virtual debit card to start managing your digital payments securely.
            </p>
          </div>
          <Button 
            onClick={onIssueCard}
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Issue Your First Card
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
