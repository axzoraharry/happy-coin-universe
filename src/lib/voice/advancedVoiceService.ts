
import { InferenceClient } from "@huggingface/inference";

export interface VoiceConfig {
  model?: string;
  voice?: string;
  speed?: number;
  pitch?: number;
}

export class AdvancedVoiceService {
  private hfClient: InferenceClient | null = null;
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private isInitialized = false;

  constructor(private hfToken?: string) {
    if (hfToken) {
      this.hfClient = new InferenceClient(hfToken);
    }
  }

  async initialize(hfToken?: string): Promise<void> {
    if (hfToken) {
      this.hfClient = new InferenceClient(hfToken);
    }
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isInitialized = true;
      console.log('Advanced Voice Service initialized');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw error;
    }
  }

  async speak(text: string, config: VoiceConfig = {}): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Stop any currently playing audio
    this.stop();

    try {
      let audioBlob: Blob;

      // Try Hugging Face TTS first if available
      if (this.hfClient) {
        audioBlob = await this.generateHuggingFaceTTS(text, config);
      } else {
        // Fallback to browser Speech Synthesis
        return this.fallbackToSpeechSynthesis(text, config);
      }

      // Play the generated audio
      await this.playAudioBlob(audioBlob);
    } catch (error) {
      console.error('TTS generation failed, falling back to speech synthesis:', error);
      this.fallbackToSpeechSynthesis(text, config);
    }
  }

  private async generateHuggingFaceTTS(text: string, config: VoiceConfig): Promise<Blob> {
    if (!this.hfClient) {
      throw new Error('Hugging Face client not initialized');
    }

    const model = config.model || "nari-labs/Dia-1.6B";
    
    console.log(`Generating speech with model: ${model}`);
    
    const audioBlob = await this.hfClient.textToSpeech({
      model,
      inputs: text,
      parameters: {
        // Add any additional parameters based on model capabilities
      }
    });

    return audioBlob;
  }

  private async playAudioBlob(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const audioUrl = URL.createObjectURL(audioBlob);
      this.currentAudio = new Audio(audioUrl);
      
      this.currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      
      this.currentAudio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        reject(error);
      };
      
      this.currentAudio.play().catch(reject);
    });
  }

  private fallbackToSpeechSynthesis(text: string, config: VoiceConfig): void {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = config.speed || 0.9;
    utterance.pitch = config.pitch || 1.1;
    utterance.volume = 0.8;

    // Try to find a good voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.lang.startsWith('en')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    speechSynthesis.speak(utterance);
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }

  setVolume(volume: number): void {
    if (this.currentAudio) {
      this.currentAudio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  isPlaying(): boolean {
    return !!(this.currentAudio && !this.currentAudio.paused);
  }
}

export const advancedVoiceService = new AdvancedVoiceService();
