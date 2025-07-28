import { createClient, LiveTranscriptionEvents, LiveConnectionState } from '@deepgram/sdk';

export interface FinancialAction {
  type: 'transfer' | 'pay_bill' | 'check_balance' | 'create_card' | 'analyze_spending';
  parameters: Record<string, any>;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: FinancialAction;
}

export class MrHappyVoiceAgent {
  private deepgram: any;
  private connection: any;
  private isConnected = false;
  private onMessageCallback?: (message: ConversationMessage) => void;
  private onActionCallback?: (action: FinancialAction) => Promise<string>;

  constructor() {
    // Initialize on client side only
    if (typeof window !== 'undefined') {
      this.deepgram = createClient(process.env.DEEPGRAM_API_KEY || '');
    }
  }

  async initialize(
    onMessage: (message: ConversationMessage) => void,
    onAction: (action: FinancialAction) => Promise<string>
  ) {
    this.onMessageCallback = onMessage;
    this.onActionCallback = onAction;
  }

  async startConversation() {
    if (!this.deepgram) {
      throw new Error('Deepgram not initialized');
    }

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create live transcription connection
      this.connection = this.deepgram.listen.live({
        model: 'nova-2',
        language: 'en-US',
        smart_format: true,
        filler_words: false,
        punctuate: true,
        interim_results: false,
        endpointing: 300,
        utterance_end_ms: 1000,
        vad_events: true
      });

      // Set up event listeners
      this.connection.on(LiveTranscriptionEvents.Open, () => {
        console.log('Mr Happy voice connection opened');
        this.isConnected = true;
        this.speak("Hello! I'm Mr Happy, your friendly financial assistant. How can I help you today?");
      });

      this.connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        if (transcript && transcript.trim()) {
          this.handleUserInput(transcript);
        }
      });

      this.connection.on(LiveTranscriptionEvents.Error, (error: any) => {
        console.error('Mr Happy voice error:', error);
      });

      this.connection.on(LiveTranscriptionEvents.Close, () => {
        console.log('Mr Happy voice connection closed');
        this.isConnected = false;
      });

      // Send audio data to Deepgram
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.connection?.readyState === 1) {
          this.connection.send(event.data);
        }
      };

      mediaRecorder.start(100); // Send data every 100ms

      return { stream, mediaRecorder };
    } catch (error) {
      console.error('Error starting Mr Happy conversation:', error);
      throw error;
    }
  }

  private async handleUserInput(transcript: string) {
    console.log('User said:', transcript);

    // Create user message
    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: transcript,
      timestamp: new Date()
    };

    this.onMessageCallback?.(userMessage);

    // Analyze intent and extract financial actions
    const action = this.extractFinancialAction(transcript);
    
    let response = '';
    
    if (action) {
      // Execute financial action
      try {
        response = await this.onActionCallback?.(action) || 'Action completed successfully!';
      } catch (error) {
        response = "I'm sorry, I couldn't complete that action. Please try again or contact support.";
      }
    } else {
      // Generate conversational response
      response = this.generateResponse(transcript);
    }

    // Create assistant message
    const assistantMessage: ConversationMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      action
    };

    this.onMessageCallback?.(assistantMessage);

    // Speak the response
    await this.speak(response);
  }

  private extractFinancialAction(transcript: string): FinancialAction | null {
    const text = transcript.toLowerCase();

    // Transfer money patterns
    if (text.includes('transfer') || text.includes('send money')) {
      const amountMatch = text.match(/(\d+(?:\.\d{2})?)/);
      const recipientMatch = text.match(/to (\w+)/);
      
      return {
        type: 'transfer',
        parameters: {
          amount: amountMatch?.[1] ? parseFloat(amountMatch[1]) : null,
          recipient: recipientMatch?.[1] || null
        }
      };
    }

    // Pay bill patterns
    if (text.includes('pay') && (text.includes('bill') || text.includes('electricity') || text.includes('water'))) {
      return {
        type: 'pay_bill',
        parameters: {
          billType: text.includes('electricity') ? 'electricity' : 
                   text.includes('water') ? 'water' : 'general'
        }
      };
    }

    // Check balance patterns
    if (text.includes('balance') || text.includes('how much')) {
      return {
        type: 'check_balance',
        parameters: {}
      };
    }

    // Create card patterns
    if (text.includes('create') && text.includes('card')) {
      return {
        type: 'create_card',
        parameters: {}
      };
    }

    // Spending analysis patterns
    if (text.includes('spending') || text.includes('expenses')) {
      return {
        type: 'analyze_spending',
        parameters: {}
      };
    }

    return null;
  }

  private generateResponse(transcript: string): string {
    const text = transcript.toLowerCase();

    // Greeting responses
    if (text.includes('hello') || text.includes('hi')) {
      return "Hello there! I'm Mr Happy, and I'm delighted to help you with your finances today. What can I do for you?";
    }

    // Help responses
    if (text.includes('help')) {
      return "I'm here to make your financial life easier! I can help you transfer money, pay bills, check balances, create virtual cards, and analyze your spending. Just tell me what you'd like to do!";
    }

    // Gratitude responses
    if (text.includes('thank')) {
      return "You're very welcome! I'm always happy to help. Is there anything else you'd like me to assist you with?";
    }

    // Default response
    return "I understand you said: " + transcript + ". I'm here to help with your financial needs. Could you tell me more about what you'd like to do?";
  }

  private async speak(text: string) {
    try {
      // Use Deepgram's Aura TTS
      const response = await fetch('/api/deepgram-tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: 'aura-asteria-en' // Friendly, warm voice
        })
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      await audio.play();
      
      // Clean up
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };

    } catch (error) {
      console.error('Error speaking:', error);
      // Fallback to speech synthesis
      this.fallbackSpeak(text);
    }
  }

  private fallbackSpeak(text: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  }

  async endConversation() {
    if (this.connection) {
      this.connection.finish();
      this.connection = null;
    }
    this.isConnected = false;
  }

  getConnectionState(): boolean {
    return this.isConnected;
  }
}

export const mrHappyAgent = new MrHappyVoiceAgent();