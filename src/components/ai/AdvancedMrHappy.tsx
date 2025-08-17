
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MrHappyOrb } from './MrHappyOrb';
import { useEmotionalState } from '@/hooks/useEmotionalState';
import { useCoreAssistant } from '@/hooks/useCoreAssistant';
import { advancedVoiceService } from '@/lib/voice/advancedVoiceService';
import { useToast } from '@/hooks/use-toast';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  Sparkles,
  Brain,
  Wand2,
  MessageCircle,
  Send
} from 'lucide-react';

interface AdvancedMrHappyProps {
  className?: string;
}

export function AdvancedMrHappy({ className }: AdvancedMrHappyProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [voiceSpeed, setVoiceSpeed] = useState(0.9);
  const [voicePitch, setVoicePitch] = useState(1.1);
  const [selectedModel, setSelectedModel] = useState("nari-labs/Dia-1.6B");
  const [hfToken, setHfToken] = useState('');
  const [isSetup, setIsSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [textInput, setTextInput] = useState('');
  
  const { emotionalState, updateEmotion } = useEmotionalState();
  const { 
    messages, 
    isConnected, 
    isProcessing: assistantProcessing,
    sendMessage,
    connect,
    disconnect,
    currentEmotion
  } = useCoreAssistant();
  
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Load saved settings
    const savedToken = localStorage.getItem('hf_token');
    const savedModel = localStorage.getItem('voice_model');
    
    if (savedToken) {
      setHfToken(savedToken);
      setIsSetup(true);
    }
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);

  useEffect(() => {
    if (currentEmotion !== emotionalState.currentEmotion) {
      updateEmotion(currentEmotion as any, 0.8, 'AI emotion update');
    }
  }, [currentEmotion, updateEmotion]);

  const handleSetup = async () => {
    if (!hfToken.trim()) {
      toast({
        title: "Token Required",
        description: "Please enter your Hugging Face token to enable advanced TTS",
        variant: "destructive",
      });
      return;
    }

    try {
      await advancedVoiceService.initialize(hfToken);
      localStorage.setItem('hf_token', hfToken);
      localStorage.setItem('voice_model', selectedModel);
      setIsSetup(true);
      
      toast({
        title: "Advanced Voice Activated! 🎉",
        description: "Mr Happy now has enhanced voice capabilities",
      });
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: "Please check your Hugging Face token and try again",
        variant: "destructive",
      });
    }
  };

  const handleVoiceToggle = async () => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  };

  const startListening = async () => {
    try {
      updateEmotion('excited', 0.8, 'Starting voice conversation');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      let audioChunks: Blob[] = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        if (audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          await processAudioInput(audioBlob);
          audioChunks = [];
        }
      };

      // Record in 3-second chunks
      mediaRecorderRef.current.start();
      setIsListening(true);
      updateEmotion('happy', 0.9, 'Listening to user');

      // Auto-stop and process every 3 seconds
      const recordingInterval = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          setTimeout(() => {
            if (isListening && mediaRecorderRef.current) {
              mediaRecorderRef.current.start();
            }
          }, 100);
        }
      }, 3000);

      // Store interval for cleanup
      (mediaRecorderRef.current as any).recordingInterval = recordingInterval;

    } catch (error) {
      console.error('Error starting voice input:', error);
      toast({
        title: "Microphone Error",
        description: "Please check microphone permissions",
        variant: "destructive",
      });
    }
  };

  const stopListening = async () => {
    if (mediaRecorderRef.current) {
      const interval = (mediaRecorderRef.current as any).recordingInterval;
      if (interval) clearInterval(interval);
      
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsListening(false);
    updateEmotion('neutral', 0.5, 'Voice session ended');
  };

  const processAudioInput = async (audioBlob: Blob) => {
    // This would typically send to speech-to-text service
    // For now, we'll simulate with a placeholder
    console.log('Processing audio input, size:', audioBlob.size);
    
    // Simulate STT result
    setTimeout(() => {
      handleTextMessage("Hello Mr Happy, how are you today?");
    }, 1000);
  };

  const handleTextMessage = async (message: string) => {
    if (!isConnected) {
      await connect();
    }

    setIsProcessing(true);
    updateEmotion('thinking', 0.9, 'Processing user message');

    try {
      await sendMessage(message);
      
      // Get the latest response and speak it
      if (messages.length > 0 && isSetup) {
        const latestResponse = messages[messages.length - 1];
        if (latestResponse.role === 'assistant') {
          await speakResponse(latestResponse.content);
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      updateEmotion('concerned', 0.7, 'Error processing message');
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = async (text: string) => {
    if (!isSetup) return;
    
    setIsSpeaking(true);
    updateEmotion('happy', 0.8, 'Speaking response');
    
    try {
      await advancedVoiceService.speak(text, {
        model: selectedModel,
        speed: voiceSpeed,
        pitch: voicePitch
      });
    } catch (error) {
      console.error('Error speaking response:', error);
    } finally {
      setIsSpeaking(false);
      updateEmotion('neutral', 0.6, 'Finished speaking');
    }
  };

  const handleSendText = async () => {
    if (!textInput.trim()) return;
    
    const message = textInput.trim();
    setTextInput('');
    await handleTextMessage(message);
  };

  if (!isSetup) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Advanced Mr Happy Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Hugging Face Token</label>
            <Input
              type="password"
              placeholder="Enter your HF token for advanced TTS"
              value={hfToken}
              onChange={(e) => setHfToken(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get your token from{' '}
              <a 
                href="https://huggingface.co/settings/tokens" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Hugging Face Settings
              </a>
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Voice Model</label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nari-labs/Dia-1.6B">Dia 1.6B (Recommended)</SelectItem>
                <SelectItem value="microsoft/speecht5_tts">SpeechT5</SelectItem>
                <SelectItem value="suno/bark">Bark</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSetup} className="w-full">
            <Wand2 className="h-4 w-4 mr-2" />
            Activate Advanced Mr Happy
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Advanced Mr Happy
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-6">
            <MrHappyOrb
              isActive={isConnected}
              emotion={emotionalState.currentEmotion}
              isListening={isListening}
              isProcessing={isProcessing || assistantProcessing || isSpeaking}
              className="w-24 h-24"
            />
          </div>

          <div className="flex items-center gap-4 justify-center">
            <Button
              onClick={handleVoiceToggle}
              className={`w-12 h-12 rounded-full p-0 ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}
              disabled={isProcessing || isSpeaking}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            <div className="flex items-center gap-2">
              <VolumeX className="h-4 w-4" />
              <Slider
                value={[volume]}
                onValueChange={(value) => {
                  setVolume(value[0]);
                  advancedVoiceService.setVolume(value[0]);
                }}
                max={1}
                step={0.1}
                className="w-20"
              />
              <Volume2 className="h-4 w-4" />
            </div>

            {isSpeaking && (
              <Badge className="animate-pulse">
                <Sparkles className="h-3 w-3 mr-1" />
                Speaking
              </Badge>
            )}
          </div>

          {showSettings && (
            <div className="mt-4 p-4 border rounded-lg space-y-4">
              <h4 className="font-medium">Voice Settings</h4>
              
              <div className="space-y-2">
                <label className="text-sm">Speed: {voiceSpeed.toFixed(1)}</label>
                <Slider
                  value={[voiceSpeed]}
                  onValueChange={(value) => setVoiceSpeed(value[0])}
                  min={0.5}
                  max={2}
                  step={0.1}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm">Pitch: {voicePitch.toFixed(1)}</label>
                <Slider
                  value={[voicePitch]}
                  onValueChange={(value) => setVoicePitch(value[0])}
                  min={0.5}
                  max={2}
                  step={0.1}
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type a message to Mr Happy..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
              disabled={isProcessing || isSpeaking}
            />
            <Button
              onClick={handleSendText}
              disabled={!textInput.trim() || isProcessing || isSpeaking}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversation History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary/10 ml-4'
                      : 'bg-muted mr-4'
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {message.role === 'user' ? 'You' : 'Mr Happy'}
                  </div>
                  <div className="text-sm">{message.content}</div>
                  <div className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
