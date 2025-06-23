
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, MessageCircle, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeroSectionProps {
  onGetStarted?: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-10"></div>
      <div className="relative container mx-auto px-4 py-20">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none px-4 py-2 text-lg">
              <Sparkles className="h-5 w-5 mr-2" />
              Axzora's Mr. Happy 2.0
            </Badge>
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight">
              Your AI-Powered
              <br />
              Digital Universe
            </h1>
            <p className="text-xl md:text-2xl text-purple-200 max-w-4xl mx-auto leading-relaxed">
              Experience the future of digital interaction with our unified AI ecosystem. 
              Manage finances, book travel, shop, and more—all through natural conversation 
              powered by Happy Paisa (1 HP = ₹1000).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {onGetStarted ? (
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleGetStarted}
              >
                <Brain className="h-5 w-5 mr-2" />
                Start Your AI Journey
              </Button>
            ) : (
              <Link to="/auth">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <Brain className="h-5 w-5 mr-2" />
                  Start Your AI Journey
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="lg"
              className="border-purple-400 text-purple-200 hover:bg-purple-800/30 px-8 py-4 text-lg"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Watch Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
