
import { useState, useEffect } from 'react';
import { Heart, Smile, Frown, AlertCircle, Star } from 'lucide-react';

interface EmotionalFeedbackProps {
  emotion?: 'happy' | 'sad' | 'neutral' | 'excited' | 'concerned' | 'thinking';
  intensity?: number; // 0-1 scale
  isListening?: boolean;
  className?: string;
}

export function EmotionalFeedback({ 
  emotion = 'neutral', 
  intensity = 0.5, 
  isListening = false,
  className = '' 
}: EmotionalFeedbackProps) {
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        setPulsePhase(prev => (prev + 1) % 4);
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isListening]);

  const getEmotionConfig = () => {
    const configs = {
      happy: {
        icon: Smile,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-400/20',
        glowColor: 'shadow-yellow-400/30'
      },
      sad: {
        icon: Frown,
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/20',
        glowColor: 'shadow-blue-400/30'
      },
      excited: {
        icon: Star,
        color: 'text-pink-400',
        bgColor: 'bg-pink-400/20',
        glowColor: 'shadow-pink-400/30'
      },
      concerned: {
        icon: AlertCircle,
        color: 'text-orange-400',
        bgColor: 'bg-orange-400/20',
        glowColor: 'shadow-orange-400/30'
      },
      thinking: {
        icon: Heart,
        color: 'text-purple-400',
        bgColor: 'bg-purple-400/20',
        glowColor: 'shadow-purple-400/30'
      },
      neutral: {
        icon: Heart,
        color: 'text-gray-400',
        bgColor: 'bg-gray-400/20',
        glowColor: 'shadow-gray-400/30'
      }
    };
    return configs[emotion] || configs.neutral;
  };

  const config = getEmotionConfig();
  const Icon = config.icon;

  // Calculate scale and opacity based on intensity and listening state
  const scale = isListening 
    ? 1 + (pulsePhase * 0.1) + (intensity * 0.2)
    : 1 + (intensity * 0.2);
  
  const opacity = 0.6 + (intensity * 0.4);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Outer glow ring */}
      <div 
        className={`absolute inset-0 rounded-full ${config.bgColor} ${config.glowColor} shadow-lg transition-all duration-300`}
        style={{
          transform: `scale(${scale})`,
          opacity: opacity * 0.8
        }}
      />
      
      {/* Inner glow */}
      <div 
        className={`absolute inset-2 rounded-full ${config.bgColor} transition-all duration-200`}
        style={{
          transform: `scale(${isListening ? 1 + (pulsePhase * 0.05) : 1})`,
          opacity: opacity * 0.6
        }}
      />
      
      {/* Icon */}
      <div className="relative z-10 p-3">
        <Icon 
          className={`h-6 w-6 ${config.color} transition-all duration-200`} 
          style={{
            transform: `scale(${isListening ? 1 + (pulsePhase * 0.1) : 1})`,
          }}
        />
      </div>
      
      {/* Listening indicator dots */}
      {isListening && (
        <div className="absolute -bottom-2 flex space-x-1">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`w-1 h-1 rounded-full ${config.color.replace('text-', 'bg-')} transition-opacity duration-200`}
              style={{
                opacity: pulsePhase === index ? 1 : 0.3
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
