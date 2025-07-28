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
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private isConnected = false;
  private onMessageCallback?: (message: ConversationMessage) => void;
  private onActionCallback?: (action: FinancialAction) => Promise<string>;

  constructor() {
    // No client-side initialization needed - we'll use server proxies
  }

  async initialize(
    onMessage: (message: ConversationMessage) => void,
    onAction: (action: FinancialAction) => Promise<string>
  ) {
    this.onMessageCallback = onMessage;
    this.onActionCallback = onAction;
  }

  async startConversation() {
    try {
      console.log('Starting Mr Happy conversation...');
      
      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('Microphone access granted');

      // Start recording with MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      let audioChunks: Blob[] = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing audio...');
        if (audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          await this.processAudioChunk(audioBlob);
          audioChunks = [];
        }
      };

      // Start recording in chunks
      this.mediaRecorder.start();
      this.isConnected = true;

      console.log('Mr Happy voice recording started');

      // Send initial greeting
      await this.speak("Hello! I'm Mr Happy, your friendly financial assistant. How can I help you today?");

      // Set up chunk recording intervals
      const recordingInterval = setInterval(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
          setTimeout(() => {
            if (this.mediaRecorder && this.isConnected) {
              this.mediaRecorder.start();
            }
          }, 100);
        }
      }, 3000); // Process audio every 3 seconds

      return { stream: this.stream, mediaRecorder: this.mediaRecorder, recordingInterval };
    } catch (error) {
      console.error('Error starting Mr Happy conversation:', error);
      throw error;
    }
  }

  private async processAudioChunk(audioBlob: Blob) {
    try {
      console.log('Processing audio chunk, size:', audioBlob.size);
      
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64Audio = btoa(String.fromCharCode(...uint8Array));

      // Send to our speech-to-text edge function
      const response = await fetch('/api/deepgram-stt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: base64Audio,
          mimeType: 'audio/webm'
        })
      });

      if (!response.ok) {
        throw new Error(`STT request failed: ${response.statusText}`);
      }

      const result = await response.json();
      const transcript = result.text?.trim();
      
      if (transcript && transcript.length > 3) { // Filter out very short utterances
        console.log('Transcript received:', transcript);
        await this.handleUserInput(transcript);
      }
    } catch (error) {
      console.error('Error processing audio chunk:', error);
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
      console.log('Mr Happy speaking:', text);
      
      // Use our TTS edge function
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
    console.log('Ending Mr Happy conversation...');
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    this.isConnected = false;
  }

  getConnectionState(): boolean {
    return this.isConnected;
  }
}

export const mrHappyAgent = new MrHappyVoiceAgent();