'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send } from 'lucide-react';

interface FloatingAIPromptProps {
  onCommand: (command: string) => void;
}

export default function FloatingAIPrompt({ onCommand }: FloatingAIPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsVisible(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      } else if (e.key === 'Escape') {
        setIsVisible(false);
        setInput('');
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isVisible) {
        setPosition({ x: e.clientX, y: e.clientY });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isVisible]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onCommand(input.trim());
      setInput('');
      setIsVisible(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: position.x + 20,
        top: position.y - 40,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-2xl rounded-lg p-3 pointer-events-auto min-w-[300px]">
        <div className="flex items-center space-x-2 mb-2">
          <Sparkles className="text-purple-600" size={16} />
          <span className="text-xs font-medium text-gray-600">AI Assistant</span>
          <kbd className="text-xs bg-gray-100 px-1 rounded">Esc to close</kbd>
        </div>
        
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me what you want to create..."
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded transition-colors"
          >
            <Send size={14} />
          </button>
        </form>
        
        <div className="mt-2 flex flex-wrap gap-1">
          {[
            'Create a room',
            'Add furniture',
            'Change colors',
            'Import DXF',
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInput(suggestion)}
              className="text-xs px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
      
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95"></div>
    </div>
  );
}