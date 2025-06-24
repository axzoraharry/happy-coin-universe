
import { useState } from 'react';
import { MrHappyOrb } from '../ai/MrHappyOrb';
import { Button } from '../ui/button';
import { Mic, MicOff, MessageSquare } from 'lucide-react';
import { useEmotionalState } from '@/hooks/useEmotionalState';

interface MrHappyInterfaceProps {
  className?: string;
}

export function MrHappyInterface({ className = '' }: MrHappyInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string>('');
  const { emotionalState, updateEmotion } = useEmotionalState();

  const handleVoiceToggle = () => {
    if (isListening) {
      setIsListening(false);
      setIsProcessing(true);
      updateEmotion('thinking', 0.7, 'Processing voice input');
      
      // Simulate processing
      setTimeout(() => {
        setIsProcessing(false);
        setMessage("I'm here to help! What would you like to do today?");
        updateEmotion('happy', 0.8, 'Ready to assist');
        
        // Clear message after 5 seconds
        setTimeout(() => setMessage(''), 5000);
      }, 2000);
    } else {
      setIsListening(true);
      updateEmotion('excited', 0.6, 'Listening for voice input');
      setMessage("I'm listening...");
    }
  };

  const handleTextChat = () => {
    updateEmotion('happy', 0.7, 'Text chat initiated');
    setMessage("Let's chat! Type your message below.");
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        {/* Mr. Happy Orb */}
        <MrHappyOrb
          isActive={isListening || isProcessing}
          emotion={emotionalState.currentEmotion}
          isListening={isListening}
          isProcessing={isProcessing}
          message={message}
        />

        {/* Control Buttons */}
        <div className="flex space-x-3">
          <Button
            onClick={handleVoiceToggle}
            className={`w-12 h-12 rounded-full p-0 shadow-lg transition-all duration-300 ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
            }`}
            disabled={isProcessing}
          >
            {isListening ? (
              <MicOff className="h-5 w-5 text-white" />
            ) : (
              <Mic className="h-5 w-5 text-white" />
            )}
          </Button>

          <Button
            onClick={handleTextChat}
            className="w-12 h-12 rounded-full p-0 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg transition-all duration-300"
          >
            <MessageSquare className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}
