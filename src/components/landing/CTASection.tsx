
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface CTASectionProps {
  onGetStarted: () => void;
}

export function CTASection({ onGetStarted }: CTASectionProps) {
  const handleCreateAccount = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('CTA section - Create Account clicked');
    onGetStarted();
  };

  return (
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
          onClick={handleCreateAccount}
          variant="secondary"
          className="text-lg px-8 py-3"
        >
          Create Free Account
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
