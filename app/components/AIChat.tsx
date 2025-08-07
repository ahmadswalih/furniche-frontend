'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  onAICommand?: (command: string) => void;
}

export default function AIChat({ onAICommand }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hi! I\'m your AI assistant for interior design. I can help you create rooms, place furniture, suggest layouts, and more. Try saying "Create a living room" or "Add a sofa".',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    if (onAICommand) {
      onAICommand(input);
    }

    setTimeout(() => {
      const aiResponse = generateAIResponse(input);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('create') || input.includes('make')) {
      if (input.includes('room')) {
        return 'I\'ll help you create a room layout. I can start with basic walls and then we can add furniture. What type of room would you like? (living room, bedroom, kitchen, etc.)';
      }
      if (input.includes('furniture') || input.includes('sofa') || input.includes('chair') || input.includes('table')) {
        return 'Great! I can add furniture to your scene. I\'ll place it in a good location based on your current layout. You can then move and adjust it using the transform tools.';
      }
      return 'I can help you create various elements in your design. What specifically would you like to create?';
    }
    
    if (input.includes('suggest') || input.includes('recommend')) {
      return 'Based on your current design, I suggest considering the flow between spaces, natural lighting, and color coordination. Would you like specific suggestions for furniture placement or color schemes?';
    }
    
    if (input.includes('color') || input.includes('material')) {
      return 'For interior design, I recommend starting with a neutral base and adding accent colors. Consider the room\'s purpose and natural light when choosing materials and colors.';
    }
    
    if (input.includes('help') || input.includes('how')) {
      return 'I can help you with:\n• Creating and arranging furniture\n• Suggesting design layouts\n• Color and material recommendations\n• Room planning and space optimization\n• Importing DXF floor plans\n\nWhat would you like to work on?';
    }
    
    return 'That\'s an interesting idea! I can help you implement that in your design. Could you provide more details about what you\'d like to achieve?';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 z-50 group"
        >
          <MessageCircle size={24} />
          <div className="absolute -top-12 -left-16 bg-gray-800 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            AI Assistant
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        </button>
      )}

      {isOpen && (
        <div className={`fixed bottom-6 right-6 bg-white border border-gray-200 shadow-2xl transition-all duration-300 z-50 ${
          isMinimized ? 'w-80 h-14' : 'w-96 h-[500px]'
        } rounded-lg flex flex-col`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center space-x-2">
              <Sparkles className="text-blue-600" size={20} />
              <h3 className="font-semibold text-gray-800">AI Design Assistant</h3>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-gray-100 rounded text-gray-500"
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded text-gray-500"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 p-3 rounded-lg max-w-[80%]">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about interior design..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
                <div className="mt-2">
                  <div className="flex flex-wrap gap-1">
                    {['Create a living room', 'Add a sofa', 'Color suggestions', 'Import floor plan'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setInput(suggestion)}
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}