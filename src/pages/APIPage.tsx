
import { APIManagement } from '@/components/api/APIManagement';

export default function APIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8">
        <APIManagement />
      </div>
    </div>
  );
}
