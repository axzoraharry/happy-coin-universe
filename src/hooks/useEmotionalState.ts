
import { useState, useCallback } from 'react';

export type EmotionType = 'happy' | 'sad' | 'neutral' | 'excited' | 'concerned' | 'thinking';

interface EmotionalState {
  currentEmotion: EmotionType;
  intensity: number; // 0-1 scale
  confidence: number; // 0-1 scale of detection confidence
  context?: string;
  timestamp: Date;
}

interface UseEmotionalStateReturn {
  emotionalState: EmotionalState;
  updateEmotion: (emotion: EmotionType, intensity?: number, context?: string) => void;
  resetEmotion: () => void;
  getEmotionHistory: () => EmotionalState[];
}

export function useEmotionalState(): UseEmotionalStateReturn {
  const [emotionalState, setEmotionalState] = useState<EmotionalState>({
    currentEmotion: 'neutral',
    intensity: 0.5,
    confidence: 0.0,
    timestamp: new Date()
  });

  const [emotionHistory, setEmotionHistory] = useState<EmotionalState[]>([]);

  const updateEmotion = useCallback((
    emotion: EmotionType, 
    intensity: number = 0.5, 
    context?: string
  ) => {
    const newState: EmotionalState = {
      currentEmotion: emotion,
      intensity: Math.max(0, Math.min(1, intensity)), // Clamp between 0-1
      confidence: 0.8, // Mock confidence for now
      context,
      timestamp: new Date()
    };

    setEmotionalState(newState);
    setEmotionHistory(prev => [...prev.slice(-9), newState]); // Keep last 10 states
  }, []);

  const resetEmotion = useCallback(() => {
    updateEmotion('neutral', 0.5);
  }, [updateEmotion]);

  const getEmotionHistory = useCallback(() => {
    return emotionHistory;
  }, [emotionHistory]);

  return {
    emotionalState,
    updateEmotion,
    resetEmotion,
    getEmotionHistory
  };
}
