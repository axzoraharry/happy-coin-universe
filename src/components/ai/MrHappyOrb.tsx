
import { useState, useEffect } from 'react';
import { EmotionalFeedback } from './EmotionalFeedback';

interface MrHappyOrbProps {
  isActive?: boolean;
  emotion?: 'happy' | 'sad' | 'neutral' | 'excited' | 'concerned' | 'thinking';
  isListening?: boolean;
  isProcessing?: boolean;
  message?: string;
  className?: string;
}

export function MrHappyOrb({ 
  isActive = false,
  emotion = 'neutral',
  isListening = false,
  isProcessing = false,
  message,
  className = ''
}: MrHappyOrbProps) {
  const [breathePhase, setBreathePhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBreathePhase(prev => (prev + 1) % 60); // 60 frames for smooth breathing
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Breathing animation - gentle scale variation
  const breatheScale = 1 + Math.sin(breathePhase * 0.1) * 0.05;

  return (
    <div className={`relative ${className}`}>
      {/* Mr. Happy's Orb Container */}
      <div 
        className="relative"
        style={{
          transform: `scale(${breatheScale})`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <EmotionalFeedback
          emotion={emotion}
          intensity={isActive ? 0.8 : 0.3}
          isListening={isListening}
          className="w-16 h-16"
        />
        
        {/* Processing indicator */}
        {isProcessing && (
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-spin border-t-purple-400">
            <div className="absolute top-1 left-1/2 w-1 h-1 bg-purple-400 rounded-full transform -translate-x-1/2" />
          </div>
        )}
      </div>

      {/* Message bubble */}
      {message && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-20">
          <div className="bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-2xl shadow-lg border border-white/20 max-w-xs text-sm animate-fade-in">
            {message}
            {/* Speech bubble tail */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white/90" />
            </div>
          </div>
        </div>
      )}

      {/* Ambient particles for active state */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-400/60 rounded-full animate-ping"
              style={{
                top: `${20 + i * 20}%`,
                left: `${20 + i * 20}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
