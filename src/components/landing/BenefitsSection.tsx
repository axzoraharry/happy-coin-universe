
import { Button } from '@/components/ui/button';
import { CheckCircle, Wallet, ArrowRight } from 'lucide-react';

interface BenefitsSectionProps {
  onGetStarted: () => void;
}

export function BenefitsSection({ onGetStarted }: BenefitsSectionProps) {
  const benefits = [
    "No hidden fees or charges",
    "24/7 customer support",
    "Multi-platform accessibility",
    "Real-time transaction processing",
    "Comprehensive financial insights",
    "Reward points on every transaction"
  ];

  const handleGetStarted = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Benefits section - Get Started clicked');
    onGetStarted();
  };

  return (
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
              onClick={handleGetStarted}
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
  );
}
