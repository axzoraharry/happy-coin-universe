import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { MrHappyOrb } from '@/components/ai/MrHappyOrb';
import { useEmotionalState } from '@/hooks/useEmotionalState';
import { useCoreAssistant } from '@/hooks/useCoreAssistant';
import { useToast } from '@/hooks/use-toast';
import { mrHappyAgent, type ConversationMessage, type FinancialAction } from '@/lib/deepgram/voiceAgent';
import { MessageCircle, Mic, MicOff, Send } from 'lucide-react';

interface MrHappyInterfaceProps {
  className?: string;
}

export function MrHappyInterface({ className }: MrHappyInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [showChat, setShowChat] = useState(false);
  const [textInput, setTextInput] = useState('');
  
  const { emotionalState, updateEmotion } = useEmotionalState();
  const { 
    messages: conversationHistory, 
    isConnected, 
    isProcessing: assistantProcessing,
    sendMessage: sendCoreMessage,
    connect: connectAssistant,
    disconnect: disconnectAssistant,
    currentEmotion
  } = useCoreAssistant();
  const { toast } = useToast();

  useEffect(() => {
    // Initialize Mr. Happy agent for voice
    mrHappyAgent.initialize(handleNewMessage, handleFinancialAction);
    
    // Auto-connect to core assistant
    connectAssistant();
    
    return () => {
      disconnectAssistant();
    };
  }, []);

  // Update emotion based on core assistant state
  useEffect(() => {
    if (currentEmotion !== emotionalState.currentEmotion) {
      updateEmotion(currentEmotion as any, 0.8, 'Core assistant emotion update');
    }
  }, [currentEmotion, updateEmotion, emotionalState.currentEmotion]);

  const handleNewMessage = (message: ConversationMessage) => {
    setMessage(message.content);
    
    // Update emotional state based on message content
    if (message.role === 'assistant') {
      if (message.content.includes('error') || message.content.includes('sorry')) {
        updateEmotion('concerned', 0.7, 'Error or apology detected');
      } else if (message.content.includes('success') || message.content.includes('completed')) {
        updateEmotion('happy', 0.8, 'Success message detected');
      } else if (message.content.includes('processing') || message.content.includes('working')) {
        updateEmotion('thinking', 0.6, 'Processing message detected');
      } else {
        updateEmotion('neutral', 0.5, 'Standard response');
      }
    }
  };

  const handleFinancialAction = async (action: FinancialAction): Promise<string> => {
    setIsProcessing(true);
    updateEmotion('thinking', 0.9, 'Processing financial action');
    
    try {
      // Forward action to core assistant
      await sendCoreMessage(`Please ${action.type} ${JSON.stringify(action.parameters)}`);
      
      switch (action.type) {
        case 'check_balance':
          return "Let me check your balance for you.";
        case 'transfer':
          return "I'll help you with that transfer.";
        case 'pay_bill':
          return "Processing your bill payment request.";
        case 'create_card':
          return "Creating a new virtual card for you.";
        case 'analyze_spending':
          return "Analyzing your spending patterns now.";
        default:
          return "I'm processing your request.";
      }
    } catch (error) {
      console.error('Error executing financial action:', error);
      return "I'm sorry, I encountered an issue processing that request.";
    } finally {
      setIsProcessing(false);
      updateEmotion('happy', 0.7, 'Action completed');
    }
  };

  const handleVoiceToggle = async () => {
    if (isListening) {
      setIsListening(false);
      updateEmotion('neutral', 0.5, 'Voice session ended');
      await mrHappyAgent.endConversation();
      setMessage("Voice session ended. I'm still here to help via text!");
      setTimeout(() => setMessage(''), 3000);
    } else {
      try {
        setIsListening(true);
        setIsProcessing(true);
        updateEmotion('excited', 0.8, 'Starting voice conversation');
        setMessage("Starting voice conversation...");
        
        await mrHappyAgent.startConversation();
        setIsProcessing(false);
        updateEmotion('happy', 0.9, 'Voice conversation active');
        setMessage("I'm listening! Tell me how I can help.");
        
      } catch (error) {
        console.error('Error starting voice conversation:', error);
        setIsListening(false);
        setIsProcessing(false);
        updateEmotion('concerned', 0.6, 'Voice connection failed');
        setMessage("Voice connection failed. You can still chat with me using text!");
        
        toast({
          title: "Voice Connection Failed",
          description: "Please check microphone permissions and try again.",
          variant: "destructive",
        });
        
        setTimeout(() => setMessage(''), 5000);
      }
    }
  };

  const handleTextChat = () => {
    setShowChat(!showChat);
    if (!showChat && !isConnected) {
      connectAssistant();
    }
  };

  const handleSendTextMessage = async () => {
    if (!textInput.trim() || !isConnected) return;
    
    const messageText = textInput.trim();
    setTextInput('');
    
    try {
      await sendCoreMessage(messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Message Failed",
        description: "Unable to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendTextMessage();
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        {/* Mr. Happy Orb */}
        <MrHappyOrb
          isActive={isConnected}
          emotion={emotionalState.currentEmotion}
          isListening={isListening}
          isProcessing={isProcessing || assistantProcessing}
          message={message}
          className="w-16 h-16"
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
            title={isListening ? 'Stop voice conversation' : 'Start voice conversation'}
          >
            {isListening ? (
              <MicOff className="h-5 w-5 text-white" />
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
            title={showChat ? 'Hide chat' : 'Show chat'}
          >
            <MessageCircle className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* Enhanced Chat Interface */}
        {showChat && (
          <Card className="absolute bottom-24 right-0 w-80 h-96 bg-card/95 backdrop-blur-sm border shadow-xl">
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Mr. Happy Assistant</h3>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
              
              <ScrollArea className="flex-1 mb-3">
                <div className="space-y-3">
                  {conversationHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-primary/10 ml-4 text-primary'
                          : 'bg-muted mr-4 text-muted-foreground'
                      }`}
                    >
                      <div className="text-sm font-medium mb-1">
                        {msg.role === 'user' ? 'You' : 'Mr. Happy'}
                      </div>
                      <div className="text-sm">{msg.content}</div>
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-2 text-xs opacity-75">
                          Actions available: {msg.actions.map(a => a.type).join(', ')}
                        </div>
                      )}
                      <div className="text-xs opacity-60 mt-1">
                        {msg.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  {assistantProcessing && (
                    <div className="bg-muted mr-4 p-3 rounded-lg">
                      <div className="text-sm font-medium mb-1">Mr. Happy</div>
                      <div className="text-sm text-muted-foreground">Thinking...</div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              {/* Text Input */}
              <div className="flex gap-2">
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  disabled={!isConnected || assistantProcessing}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendTextMessage}
                  disabled={!textInput.trim() || !isConnected || assistantProcessing}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}