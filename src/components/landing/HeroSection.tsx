
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, MessageCircle, Brain, Heart, Smile, Users } from 'lucide-react';
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
    <div className="relative overflow-hidden">
      {/* Axzora ambient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-blue-900/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,182,193,0.1),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(147,51,234,0.1),transparent_50%)]"></div>
      
      <div className="relative container mx-auto px-4 py-20">
        <div className="text-center space-y-8 max-w-6xl mx-auto">
          {/* Axzora badge */}
          <div className="flex justify-center">
            <Badge className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white border-none px-6 py-3 text-lg font-medium shadow-lg">
              <Heart className="h-5 w-5 mr-2 animate-pulse" />
              Powered by Axzora
            </Badge>
          </div>

          {/* Hero title with emotional intelligence emphasis */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-white via-pink-200 to-purple-200 bg-clip-text text-transparent leading-tight">
              Meet Mr. Happy 2.0
              <br />
              <span className="text-4xl md:text-6xl lg:text-7xl bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 bg-clip-text text-transparent">
                Your Lovable AI Companion
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-purple-200 max-w-4xl mx-auto leading-relaxed">
              Experience the future of emotionally intelligent AI. Mr. Happy doesn't just help—he understands, 
              empathizes, and delights. Manage your Happy Paisa (₹1000 each), book travel, shop, and more through 
              natural, empathetic conversations that build genuine trust and joy.
            </p>
          </div>

          {/* Emotional intelligence features */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto my-12">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <Brain className="h-8 w-8 text-pink-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Emotionally Intelligent</h3>
              <p className="text-purple-200 text-sm">Adapts to your mood and provides empathetic responses</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <Smile className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Delightfully Engaging</h3>
              <p className="text-purple-200 text-sm">Every interaction is designed to bring joy and satisfaction</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <Users className="h-8 w-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Relationship Building</h3>
              <p className="text-purple-200 text-sm">Remembers your preferences and grows with you</p>
            </div>
          </div>

          {/* Call to action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {onGetStarted ? (
              <Button
                size="lg"
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white border-none px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-xl"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleGetStarted}
              >
                <Heart className="h-5 w-5 mr-2" />
                Start Your Lovable Journey
              </Button>
            ) : (
              <Link to="/auth">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white border-none px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-xl"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <Heart className="h-5 w-5 mr-2" />
                  Start Your Lovable Journey
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="lg"
              className="border-pink-400 text-pink-200 hover:bg-pink-800/30 px-8 py-4 text-lg backdrop-blur-sm"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Experience the Difference
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-12 text-purple-300">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <span>Ethically Designed AI</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-400" />
              <span>Privacy First</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span>Built for Well-being</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
