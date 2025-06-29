
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { CreditCard, Plus, Shield } from 'lucide-react';

interface VirtualCardHeaderProps {
  showIssueDialog: boolean;
  setShowIssueDialog: (show: boolean) => void;
  showValidationDialog: boolean;
  setShowValidationDialog: (show: boolean) => void;
}

export function VirtualCardHeader({
  showIssueDialog,
  setShowIssueDialog,
  showValidationDialog,
  setShowValidationDialog
}: VirtualCardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-xl">
            <CreditCard className="h-7 w-7 text-primary" />
          </div>
          Virtual Card Management
        </h2>
        <p className="text-muted-foreground text-lg">
          Create, manage, and validate your virtual debit cards
        </p>
      </div>
      <div className="flex gap-2">
        <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
              <Plus className="h-4 w-4 mr-2" />
              Issue New Card
            </Button>
          </DialogTrigger>
        </Dialog>

        <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Validate Card
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>
    </div>
  );
}
