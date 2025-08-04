import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: Array<{
    type: string;
    data: any;
  }>;
  emotion?: string;
  confidence?: number;
}

interface UseCoreAssistantReturn {
  messages: AssistantMessage[];
  isConnected: boolean;
  isProcessing: boolean;
  sendMessage: (message: string, context?: any) => Promise<void>;
  connect: () => void;
  disconnect: () => void;
  clearMessages: () => void;
  currentEmotion: string;
}

export function useCoreAssistant(): UseCoreAssistantReturn {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  const connect = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to use the assistant",
          variant: "destructive"
        });
        return;
      }

      // Close existing connection
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Connect to core assistant WebSocket
      const wsUrl = `ws://localhost:8006/v1/assistant/ws/${user.id}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setIsConnected(true);
        console.log('Connected to Core Assistant');
        
        // Send welcome message
        setMessages([{
          role: 'assistant',
          content: "Hi! I'm Mr. Happy, your personal financial assistant. How can I help you today?",
          timestamp: new Date(),
          emotion: 'happy',
          confidence: 1.0
        }]);
      };

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: response.response,
            timestamp: new Date(),
            actions: response.actions || [],
            emotion: response.emotion || 'neutral',
            confidence: response.confidence || 0.7
          }]);
          
          setCurrentEmotion(response.emotion || 'neutral');
          setIsProcessing(false);
        } catch (error) {
          console.error('Failed to parse assistant response:', error);
          setIsProcessing(false);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('Disconnected from Core Assistant');
      };

      ws.onerror = (error) => {
        console.error('Core Assistant connection error:', error);
        setIsConnected(false);
        setIsProcessing(false);
        
        toast({
          title: "Connection Error",
          description: "Failed to connect to the assistant. Please try again.",
          variant: "destructive"
        });
      };

      wsRef.current = ws;
      
    } catch (error) {
      console.error('Failed to connect to Core Assistant:', error);
      toast({
        title: "Connection Failed",
        description: "Unable to start assistant session",
        variant: "destructive"
      });
    }
  }, [toast]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsProcessing(false);
  }, []);

  const sendMessage = useCallback(async (message: string, context: any = {}) => {
    if (!wsRef.current || !isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect to the assistant first",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // Add user message to chat
    const userMessage: AssistantMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      // Send message via WebSocket
      wsRef.current.send(JSON.stringify({
        message,
        context
      }));
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsProcessing(false);
      
      toast({
        title: "Message Failed",
        description: "Unable to send message. Please try again.",
        variant: "destructive"
      });
    }
  }, [isConnected, toast]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    messages,
    isConnected,
    isProcessing,
    sendMessage,
    connect,
    disconnect,
    clearMessages,
    currentEmotion
  };
}