'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';

interface CenterAIAssistantProps {
  onCommand: (command: string) => void;
}

export default function CenterAIAssistant({ onCommand }: CenterAIAssistantProps) {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentSuggestions, setRecentSuggestions] = useState([
    'Create a living room',
    'Add a sofa',
    'Place a table',
    'Import DXF file',
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onCommand(input.trim());
      setInput('');
      setIsExpanded(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
      <div className={`transition-all duration-300 ease-out ${isExpanded ? 'scale-105' : 'scale-100'}`}>
        <div 
          className={`
            bg-white/95 backdrop-blur-sm border border-gray-200/50
            rounded-full shadow-2xl
            transition-all duration-500 ease-out
            ${isExpanded ? 'rounded-2xl' : 'rounded-full'}
            ${isExpanded ? 'shadow-[0_20px_70px_-10px_rgba(0,0,0,0.3)]' : 'shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)]'}
            hover:shadow-[0_20px_70px_-10px_rgba(59,130,246,0.3)]
            ${isExpanded ? 'w-96 p-4' : 'w-80 p-2'}
          `}
          style={{
            boxShadow: isExpanded 
              ? '0 20px 70px -10px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
              : '0 10px 40px -10px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
          }}
        >
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="relative">
                <Sparkles 
                  className="text-blue-600 animate-pulse" 
                  size={20} 
                />
                <div className="absolute inset-0 text-blue-600 animate-ping opacity-20">
                  <Sparkles size={20} />
                </div>
              </div>
              {!isExpanded && (
                <span className="font-medium text-gray-700 text-sm">AI Assistant</span>
              )}
            </div>
            
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsExpanded(true)}
                onBlur={() => setTimeout(() => setIsExpanded(false), 150)}
                placeholder={isExpanded ? "Ask me to create, modify, or design anything..." : "Ask AI..."}
                className={`
                  w-full bg-transparent border-0 outline-none
                  text-gray-700 placeholder-gray-400
                  ${isExpanded ? 'text-base py-2' : 'text-sm py-1'}
                  transition-all duration-300
                `}
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim()}
              className={`
                flex-shrink-0 p-2 rounded-full
                bg-gradient-to-r from-blue-600 to-purple-600
                hover:from-blue-700 hover:to-purple-700
                disabled:from-gray-300 disabled:to-gray-400
                text-white transition-all duration-300
                transform hover:scale-110 disabled:scale-100
                shadow-lg hover:shadow-xl
                ${isExpanded ? 'opacity-100' : 'opacity-80'}
              `}
            >
              <Send size={16} />
            </button>
          </form>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {recentSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="
                      px-3 py-1 text-xs
                      bg-gradient-to-r from-blue-50 to-purple-50
                      hover:from-blue-100 hover:to-purple-100
                      text-blue-700 rounded-full
                      border border-blue-200/50
                      transition-all duration-200
                      transform hover:scale-105
                      shadow-sm hover:shadow-md
                    "
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Press <kbd className="bg-gray-100 px-1 rounded text-xs">Enter</kbd> to send • <kbd className="bg-gray-100 px-1 rounded text-xs">Cmd+K</kbd> for floating prompt
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}