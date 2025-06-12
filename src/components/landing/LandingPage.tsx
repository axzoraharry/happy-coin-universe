import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Shield, 
  Send, 
  TrendingUp, 
  Bell, 
  Gift, 
  CreditCard,
  Users,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
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
      title: "Easy Deposits",
      description: "Add money to your wallet seamlessly and earn Happy Coins with every deposit."
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

  const benefits = [
    "No hidden fees or charges",
    "24/7 customer support",
    "Multi-platform accessibility",
    "Real-time transaction processing",
    "Comprehensive financial insights",
    "Reward points on every transaction"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              🚀 Now Available
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Your Money,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Simplified
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Experience the future of digital payments with our secure, fast, and user-friendly 
              digital wallet. Send money, manage transactions, earn Happy Coins, and redeem rewards all in one place.
            </p>
            <div className="flex justify-center">
              <Button 
                size="lg" 
                onClick={onGetStarted}
                className="text-lg px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
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

      {/* Benefits Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose Our Digital Wallet?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join thousands of satisfied users who trust our platform for their 
                daily financial needs. Experience seamless transactions with complete peace of mind.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button 
                size="lg" 
                onClick={onGetStarted}
                className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <div className="text-center">
                  <Wallet className="h-16 w-16 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
                  <p className="text-blue-100 mb-6">
                    Create your account in less than 2 minutes and start enjoying 
                    the benefits of our digital wallet platform.
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold">10K+</div>
                      <div className="text-blue-100 text-sm">Active Users</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">$2M+</div>
                      <div className="text-blue-100 text-sm">Transferred</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">99.9%</div>
                      <div className="text-blue-100 text-sm">Uptime</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Financial Experience?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join our growing community and discover a better way to manage your money.
          </p>
          <Button 
            size="lg" 
            onClick={onGetStarted}
            variant="secondary"
            className="text-lg px-8 py-3"
          >
            Create Free Account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
