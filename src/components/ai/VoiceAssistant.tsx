import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useConversation } from '@11labs/react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Bot, 
  User, 
  Settings,
  Play,
  Pause,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TransactionAnalyzer } from '@/lib/ai/transactionAnalyzer';

interface VoiceAssistantProps {
  transactions: any[];
  onTransactionSelect?: (transaction: any) => void;
}

export function VoiceAssistant({ transactions, onTransactionSelect }: VoiceAssistantProps) {
  const [apiKey, setApiKey] = useState('');
  const [agentId, setAgentId] = useState('');
  const [isSetup, setIsSetup] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [messages, setMessages] = useState<Array<{
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);
  const [currentStatus, setCurrentStatus] = useState<string>('disconnected');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => {
      console.log('Voice assistant connected');
      setCurrentStatus('connected');
      toast({
        title: "🎤 Voice Assistant Ready",
        description: "You can now speak with your AI financial assistant!",
      });
      
      // Add welcome message
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: "Hello! I'm your AI financial assistant. I can help you analyze transactions, search your spending history, and provide insights about your financial patterns. What would you like to know?",
        timestamp: new Date()
      }]);
    },
    onDisconnect: () => {
      console.log('Voice assistant disconnected');
      setCurrentStatus('disconnected');
      toast({
        title: "Voice Assistant Disconnected",
        description: "The voice session has ended.",
      });
    },
    onMessage: (message) => {
      console.log('Message received:', message);
      
      // Handle different message types from ElevenLabs
      if (typeof message === 'object' && message.source === 'user') {
        setMessages(prev => [...prev, {
          type: 'user',
          content: message.message,
          timestamp: new Date()
        }]);
      } else if (typeof message === 'object' && message.source === 'ai') {
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: message.message,
          timestamp: new Date()
        }]);
      }
    },
    onError: (error) => {
      console.error('Voice assistant error:', error);
      const errorMessage = typeof error === 'string' ? error : 
                          (error as any)?.message || "An error occurred with the voice assistant.";
      toast({
        title: "Voice Assistant Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
    clientTools: {
      searchTransactions: async (parameters: { query: string }) => {
        console.log('Searching transactions for:', parameters.query);
        
        try {
          // Use our existing AI search capabilities
          const filteredTransactions = transactions.filter(t => 
            (t.description || '').toLowerCase().includes(parameters.query.toLowerCase()) ||
            t.transaction_type.toLowerCase().includes(parameters.query.toLowerCase())
          );

          const result = {
            count: filteredTransactions.length,
            transactions: filteredTransactions.slice(0, 5).map(t => ({
              id: t.id,
              description: t.description || 'No description',
              amount: Math.abs(t.amount),
              type: t.transaction_type,
              date: new Date(t.created_at).toLocaleDateString()
            }))
          };

          return `Found ${result.count} transactions matching "${parameters.query}". Here are the most recent: ${result.transactions.map(t => `${t.description} - $${t.amount} on ${t.date}`).join(', ')}`;
        } catch (error) {
          return `Sorry, I couldn't search your transactions right now. Error: ${error}`;
        }
      },
      
      analyzeSpending: async (parameters: { category?: string; timeframe?: string }) => {
        console.log('Analyzing spending:', parameters);
        
        try {
          const totalSpent = transactions
            .filter(t => t.transaction_type === 'purchase')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
          
          const transactionCount = transactions.filter(t => t.transaction_type === 'purchase').length;
          const avgTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0;

          return `Your spending analysis: Total spent: $${totalSpent.toFixed(2)} across ${transactionCount} transactions. Average transaction amount: $${avgTransaction.toFixed(2)}.`;
        } catch (error) {
          return `Sorry, I couldn't analyze your spending right now. Error: ${error}`;
        }
      },

      getTransactionInsights: async (parameters: { transactionId?: string }) => {
        console.log('Getting transaction insights:', parameters);
        
        try {
          if (transactions.length === 0) {
            return "You don't have any transactions yet. Make some purchases to see AI insights!";
          }

          const recentTransaction = transactions[0];
          const insight = await TransactionAnalyzer.analyzeTransaction(recentTransaction);
          
          return `Latest transaction analysis: ${insight.insights.join('. ')} Risk level: ${insight.riskLevel}. Category: ${insight.category}.`;
        } catch (error) {
          return `Sorry, I couldn't analyze transaction insights right now. Error: ${error}`;
        }
      }
    }
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSetup = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your ElevenLabs API key to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!agentId.trim()) {
      toast({
        title: "Agent ID Required", 
        description: "Please enter your ElevenLabs Agent ID to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsSetup(true);
    localStorage.setItem('elevenlabs_api_key', apiKey);
    localStorage.setItem('elevenlabs_agent_id', agentId);
    
    toast({
      title: "Setup Complete",
      description: "You can now start a voice conversation!",
    });
  };

  const startConversation = async () => {
    try {
      // Check microphone permissions
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start the conversation with the agent
      const conversationId = await conversation.startSession({
        agentId: agentId
      });
      
      console.log('Conversation started:', conversationId);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to use voice features.",
        variant: "destructive",
      });
    }
  };

  const endConversation = async () => {
    await conversation.endSession();
  };

  const handleVolumeChange = async (newVolume: number) => {
    setVolume(newVolume);
    await conversation.setVolume({ volume: newVolume });
  };

  // Load saved settings
  useEffect(() => {
    const savedApiKey = localStorage.getItem('elevenlabs_api_key');
    const savedAgentId = localStorage.getItem('elevenlabs_agent_id');
    
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedAgentId) setAgentId(savedAgentId);
    if (savedApiKey && savedAgentId) setIsSetup(true);
  }, []);

  if (!isSetup) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Voice AI Assistant Setup
          </CardTitle>
          <CardDescription>
            Configure your ElevenLabs voice assistant to have conversations about your finances
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">ElevenLabs API Key</label>
            <Input
              type="password"
              placeholder="Enter your ElevenLabs API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from{' '}
              <a 
                href="https://elevenlabs.io/app/settings/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                ElevenLabs Settings
              </a>
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Agent ID</label>
            <Input
              placeholder="Enter your ElevenLabs Agent ID"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Create an agent in{' '}
              <a 
                href="https://elevenlabs.io/app/conversational-ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                ElevenLabs Conversational AI
              </a>
            </p>
          </div>

          <Button onClick={handleSetup} className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Setup Voice Assistant
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Voice Assistant
            <Badge variant={currentStatus === 'connected' ? 'default' : 'secondary'}>
              {currentStatus}
            </Badge>
          </CardTitle>
          <CardDescription>
            Have a natural conversation about your financial data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {currentStatus === 'disconnected' ? (
              <Button onClick={startConversation} size="lg">
                <Mic className="h-4 w-4 mr-2" />
                Start Voice Chat
              </Button>
            ) : (
              <Button onClick={endConversation} variant="destructive" size="lg">
                <MicOff className="h-4 w-4 mr-2" />
                End Chat
              </Button>
            )}
            
            <div className="flex items-center gap-2">
              <VolumeX className="h-4 w-4" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20"
              />
              <Volume2 className="h-4 w-4" />
            </div>

            {conversation.isSpeaking && (
              <Badge className="animate-pulse">
                <Sparkles className="h-3 w-3 mr-1" />
                Speaking
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.type === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}