
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export function VirtualCardSecurityNotice() {
  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-blue-800">Security Notice</h4>
            <p className="text-sm text-blue-700">
              Card details are encrypted and auto-hidden for security. Never share your card details with anyone. 
              Report suspicious activity immediately.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
