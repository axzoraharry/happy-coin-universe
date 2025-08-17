
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AdvancedMrHappy } from '@/components/ai/AdvancedMrHappy';
import { 
  Sparkles, 
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';

export function EnhancedMrHappyInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full shadow-lg bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 animate-pulse"
        >
          <Sparkles className="h-6 w-6 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      isMinimized 
        ? 'w-80 h-20' 
        : 'w-96 h-[600px]'
    }`}>
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl h-full flex flex-col">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Advanced Mr Happy
          </h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {!isMinimized && (
          <div className="flex-1 p-4 overflow-auto">
            <AdvancedMrHappy />
          </div>
        )}
      </div>
    </div>
  );
}
