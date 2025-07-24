import { NotificationsList } from '@/components/notifications/NotificationsList';
import { PageHeader } from '@/components/common/PageHeader';

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <PageHeader 
          title="Notifications" 
          description="Stay updated with your latest transactions and account activity"
        />
        <NotificationsList />
      </div>
    </div>
  );
}