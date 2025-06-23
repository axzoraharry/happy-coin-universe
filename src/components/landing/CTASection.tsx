
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface CTASectionProps {
  onGetStarted?: () => void;
}

export function CTASection({ onGetStarted }: CTASectionProps) {
  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    }
  };

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="text-center bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-3xl p-12 border border-purple-500/30">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
          Ready to Experience the Future?
        </h2>
        <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
          Join millions of users who trust Axzora's Mr. Happy 2.0 for their digital lifestyle. 
          Start your journey today with our AI-powered platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {onGetStarted ? (
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300"
              onClick={handleGetStarted}
            >
              Get Started Free
            </Button>
          ) : (
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300"
              >
                Get Started Free
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="lg"
            className="border-purple-400 text-purple-200 hover:bg-purple-800/30 px-8 py-4 text-lg"
          >
            Schedule Demo
          </Button>
        </div>
      </div>
    </div>
  );
}
