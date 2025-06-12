
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wallet, 
  Shield, 
  Send, 
  TrendingUp, 
  Bell, 
  Gift, 
  CreditCard,
  Users
} from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: Wallet,
      title: "Secure Digital Wallet",
      description: "Keep your money safe with bank-level security and encryption."
    },
    {
      icon: Send,
      title: "Instant Transfers",
      description: "Send money to friends and family instantly with just their email address."
    },
    {
      icon: CreditCard,
      title: "Easy Deposits & Happy Coins",
      description: "Add money to your wallet seamlessly and earn Happy Coins with every transaction."
    },
    {
      icon: TrendingUp,
      title: "Transaction History",
      description: "Track all your transactions with detailed history and analytics."
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Stay updated with real-time notifications for all account activities."
    },
    {
      icon: Gift,
      title: "Rewards & Offers",
      description: "Earn coins and redeem exclusive offers with every transaction."
    },
    {
      icon: Shield,
      title: "Advanced Security",
      description: "Multi-layer security with fraud detection and account protection."
    },
    {
      icon: Users,
      title: "User Management",
      description: "Manage your profile, preferences, and account settings easily."
    }
  ];

  return (
    <div className="py-20 bg-white" data-section="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need in One App
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our comprehensive digital wallet solution provides all the tools you need 
            to manage your finances efficiently and securely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="h-full hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
