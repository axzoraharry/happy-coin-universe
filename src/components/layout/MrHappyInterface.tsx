
import { useState, useEffect } from 'react';
import { MrHappyOrb } from '../ai/MrHappyOrb';
import { Button } from '../ui/button';
import { Mic, MicOff, MessageSquare, Brain } from 'lucide-react';
import { useEmotionalState } from '@/hooks/useEmotionalState';
import { mrHappyAgent, type ConversationMessage, type FinancialAction } from '@/lib/deepgram/voiceAgent';
import { useToast } from '@/hooks/use-toast';

interface MrHappyInterfaceProps {
  className?: string;
}

export function MrHappyInterface({ className = '' }: MrHappyInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState<ConversationMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  const { emotionalState, updateEmotion } = useEmotionalState();
  const { toast } = useToast();

  useEffect(() => {
    // Initialize Mr Happy voice agent
    mrHappyAgent.initialize(handleNewMessage, handleFinancialAction);
  }, []);

  const handleNewMessage = (message: ConversationMessage) => {
    setConversations(prev => [...prev, message]);
    
    if (message.role === 'assistant') {
      setMessage(message.content);
      updateEmotion('happy', 0.8, 'Responding to user');
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleFinancialAction = async (action: FinancialAction): Promise<string> => {
    setIsProcessing(true);
    updateEmotion('thinking', 0.9, 'Processing financial action');
    
    try {
      switch (action.type) {
        case 'check_balance':
          // Simulate balance check
          toast({
            title: "Balance Check",
            description: "Your current balance is ₹5,280 (Happy Paisa: 2.5 HP)",
          });
          return "Your current balance is ₹5,280, and you have 2.5 Happy Paisa. Looking good!";
          
        case 'transfer':
          if (action.parameters.amount && action.parameters.recipient) {
            toast({
              title: "Transfer Initiated",
              description: `Transferring ₹${action.parameters.amount} to ${action.parameters.recipient}`,
            });
            return `Great! I've initiated a transfer of ₹${action.parameters.amount} to ${action.parameters.recipient}. The transaction is processing.`;
          }
          return "I'd be happy to help with a transfer! Could you please specify the amount and recipient?";
          
        case 'pay_bill':
          toast({
            title: "Bill Payment",
            description: `Processing ${action.parameters.billType} bill payment`,
          });
          return `Perfect! I'm processing your ${action.parameters.billType} bill payment. You'll receive a confirmation shortly.`;
          
        case 'create_card':
          toast({
            title: "Virtual Card",
            description: "Creating new virtual card...",
          });
          return "Excellent! I'm creating a new virtual card for you. It will be ready in just a moment with all security features enabled.";
          
        case 'analyze_spending':
          toast({
            title: "Spending Analysis",
            description: "Analyzing your recent transactions...",
          });
          return "Let me analyze your spending patterns... You've been doing great! Your biggest category this month is dining at ₹1,200, and you're 15% under budget. Well done!";
          
        default:
          return "I understand what you're asking for, but I need a bit more information to help you with that.";
      }
    } catch (error) {
      console.error('Error executing financial action:', error);
      return "I'm sorry, I encountered an issue processing that request. Please try again or contact support if the problem persists.";
    } finally {
      setIsProcessing(false);
      updateEmotion('happy', 0.7, 'Action completed');
    }
  };

  const handleVoiceToggle = async () => {
    if (isListening) {
      // Stop listening
      setIsListening(false);
      setIsConnected(false);
      updateEmotion('neutral', 0.5, 'Voice session ended');
      await mrHappyAgent.endConversation();
      setMessage("Thanks for chatting! I'm here whenever you need me.");
      setTimeout(() => setMessage(''), 3000);
    } else {
      // Start listening
      try {
        setIsListening(true);
        setIsProcessing(true);
        updateEmotion('excited', 0.8, 'Starting voice conversation');
        setMessage("Connecting to Mr Happy...");
        
        await mrHappyAgent.startConversation();
        setIsConnected(true);
        setIsProcessing(false);
        updateEmotion('happy', 0.9, 'Voice conversation active');
        setMessage("I'm listening! Go ahead and tell me what you need.");
        
      } catch (error) {
        console.error('Error starting voice conversation:', error);
        setIsListening(false);
        setIsProcessing(false);
        setIsConnected(false);
        updateEmotion('concerned', 0.6, 'Voice connection failed');
        setMessage("Sorry, I couldn't start the voice conversation. Please check your microphone permissions.");
        
        toast({
          title: "Voice Connection Failed",
          description: "Please ensure microphone permissions are enabled and try again.",
          variant: "destructive",
        });
        
        setTimeout(() => setMessage(''), 5000);
      }
    }
  };

  const handleTextChat = () => {
    setShowChat(!showChat);
    updateEmotion('happy', 0.7, 'Text chat toggled');
    setMessage(showChat ? "Chat minimized" : "Chat is ready! I can help with transfers, bills, balance checks, and more!");
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
                : isConnected
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
            }`}
            disabled={isProcessing}
            title={isListening ? 'Stop conversation' : isConnected ? 'Connected - Click to end' : 'Start voice conversation'}
          >
            {isListening ? (
              <MicOff className="h-5 w-5 text-white" />
            ) : isConnected ? (
              <Brain className="h-5 w-5 text-white animate-pulse" />
            ) : (
              <Mic className="h-5 w-5 text-white" />
            )}
          </Button>

          <Button
            onClick={handleTextChat}
            className={`w-12 h-12 rounded-full p-0 shadow-lg transition-all duration-300 ${
              showChat 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
            }`}
            title={showChat ? 'Hide chat history' : 'Show chat history'}
          >
            <MessageSquare className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* Conversation History */}
        {showChat && conversations.length > 0 && (
          <div className="absolute bottom-20 right-0 w-80 max-h-60 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Chat with Mr Happy</h3>
            </div>
            <div className="max-h-48 overflow-y-auto p-4 space-y-3">
              {conversations.slice(-5).map((conv) => (
                <div
                  key={conv.id}
                  className={`flex ${conv.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                      conv.role === 'user'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {conv.content}
                    {conv.action && (
                      <div className="text-xs mt-1 opacity-75">
                        Action: {conv.action.type}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
