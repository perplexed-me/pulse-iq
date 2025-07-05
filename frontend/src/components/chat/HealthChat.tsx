import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Bot, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const AI_BASE_URL = "/ai-api";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const formatAIResponse = (content: string) => {
  // Process content to replace heading patterns with emojis, ensuring no duplicates
  let formattedContent = content;

  // Replace condition heading (check for markdown first, then plain text)
  if (formattedContent.includes('**What is this condition?**')) {
    formattedContent = formattedContent.replace(/\*\*What is this condition\?\*\*/gi, '🏥 What is this condition?');
  } else if (formattedContent.includes('What is this condition?')) {
    formattedContent = formattedContent.replace(/What is this condition\?/gi, '🏥 What is this condition?');
  }

  // Replace signs heading
  if (formattedContent.includes('**Signs, Home Care & Treatment**')) {
    formattedContent = formattedContent.replace(/\*\*Signs, Home Care & Treatment\*\*/gi, '💡 Signs, Home Care & When to See Doctor');
  } else if (formattedContent.includes('**Signs, Home Care & When to See Doctor**')) {
    formattedContent = formattedContent.replace(/\*\*Signs, Home Care & When to See Doctor\*\*/gi, '💡 Signs, Home Care & When to See Doctor');
  } else if (formattedContent.includes('Signs, Home Care & Treatment')) {
    formattedContent = formattedContent.replace(/Signs, Home Care & Treatment/gi, '💡 Signs, Home Care & When to See Doctor');
  } else if (formattedContent.includes('Signs, Home Care & When to See Doctor')) {
    formattedContent = formattedContent.replace(/Signs, Home Care & When to See Doctor/gi, '💡 Signs, Home Care & When to See Doctor');
  }

  // Replace doctor heading
  if (formattedContent.includes('**Which Doctor to See**')) {
    formattedContent = formattedContent.replace(/\*\*Which Doctor to See\*\*/gi, '👨‍⚕️ Which Doctor to See');
  } else if (formattedContent.includes('Which Doctor to See')) {
    formattedContent = formattedContent.replace(/Which Doctor to See/gi, '👨‍⚕️ Which Doctor to See');
  }

  // Remove any duplicate consecutive headings that might have been created
  formattedContent = formattedContent.replace(/(🏥 What is this condition\?\s*){2,}/g, '🏥 What is this condition?\n');
  formattedContent = formattedContent.replace(/(💡 Signs, Home Care & When to See Doctor\s*){2,}/g, '💡 Signs, Home Care & When to See Doctor\n');
  formattedContent = formattedContent.replace(/(👨‍⚕️ Which Doctor to See\s*){2,}/g, '👨‍⚕️ Which Doctor to See\n');

  const lines = formattedContent.split(/\n+/);
  return (
    <div className="text-base leading-relaxed font-medium">
      {lines.map((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return null;
        if (trimmedLine.startsWith('🏥') || trimmedLine.startsWith('💡') || trimmedLine.startsWith('👨‍⚕️')) {
          return (
            <div key={index} className="font-bold text-blue-700 my-2 text-lg">
              {trimmedLine}
            </div>
          );
        }
        return (
          <div key={index}>{trimmedLine}</div>
        );
      })}
    </div>
  );
};

const HealthChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      content: `Hello ${user?.name || 'there'}! I'm your AI Health Assistant. I can help you with health-related questions, symptoms analysis, and general medical guidance. How can I assist you today?`,
      sender: 'ai',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [user?.name]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    try {
      const response = await fetch(`${AI_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputMessage })
      });
      if (response.ok) {
        const data = await response.json();
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response || 'I apologize, but I couldn\'t process your request at the moment. Please try again.',
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I\'m currently unavailable. Please try again later or consult with a healthcare professional for urgent matters.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMessage]);
      toast({
        title: "Connection Error",
        description: "Unable to connect to AI service. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-pink-100 font-sans">
      {/* Glassmorphic Card */}
      <div className="relative w-full max-w-2xl h-[700px] flex flex-col rounded-3xl shadow-2xl bg-gradient-to-br from-blue-100 via-white to-pink-100/80 backdrop-blur-lg border border-white/30 overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b border-white/30 bg-white/40 backdrop-blur-md">
          <Button variant="ghost" size="sm" onClick={goBack} className="mr-3">
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-pink-400 flex items-center justify-center shadow-lg animate-bounce-slow">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">PulseIQ Health Assistant</h1>
              <p className="text-xs text-gray-500">Modern Health Chat</p>
            </div>
          </div>
        </div>
        {/* Chat Area */}
        <ScrollArea className="flex-1 px-6 py-4 overflow-y-auto" ref={scrollAreaRef}>
          <div className="flex flex-col gap-6 pb-32">
            {messages.map((message, idx) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} w-full animate-fade-in`}>
                <div className={`flex items-end gap-2 max-w-[80%]` + (message.sender === 'user' ? ' flex-row-reverse' : '')}>
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full shadow-lg ${message.sender === 'user' ? 'bg-gradient-to-br from-pink-400 to-blue-500' : 'bg-gradient-to-br from-blue-400 to-pink-300'} flex items-center justify-center ring-2 ring-white/60`}>
                    {message.sender === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                  </div>
                  {/* Bubble */}
                  <div className={`rounded-2xl px-5 py-3 shadow-xl transition-all duration-300 ${message.sender === 'user' ? 'bg-gradient-to-br from-pink-400 to-blue-500 text-white' : 'bg-white/80 text-gray-900 border border-white/40'} relative`}>
                    <div className="text-base">
                      {message.sender === 'ai' ? formatAIResponse(message.content) : <span className="whitespace-pre-line">{message.content}</span>}
                    </div>
                    <span className={`absolute -bottom-5 text-xs ${message.sender === 'user' ? 'right-2 text-pink-100' : 'left-2 text-blue-400'}`}>{message.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start w-full animate-fade-in">
                <div className="flex items-end gap-2 max-w-[80%]">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-pink-300 flex items-center justify-center ring-2 ring-white/60 shadow-lg animate-bounce-slow">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="rounded-2xl px-5 py-3 bg-white/80 text-gray-900 border border-white/40 shadow-xl flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        {/* Floating Input Bar */}
        <div className="absolute bottom-0 left-0 w-full px-6 pb-6 pointer-events-none">
          <div className="relative w-full max-w-xl mx-auto flex items-center bg-white/80 backdrop-blur-md rounded-full shadow-2xl border border-white/40 py-2 px-4 pointer-events-auto">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your health question..."
              disabled={isLoading}
              className="flex-1 bg-transparent border-none focus:ring-0 text-base placeholder:text-gray-400"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="ml-2 rounded-full bg-gradient-to-br from-blue-500 to-pink-400 hover:from-pink-400 hover:to-blue-500 shadow-lg transition-all duration-200 focus:ring-2 focus:ring-pink-300"
              size="icon"
            >
              <Send className="w-5 h-5 text-white drop-shadow" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center select-none pointer-events-none">
            💡 This AI assistant provides general health information and should not replace professional medical advice.
          </p>
        </div>
      </div>
      {/* Animations */}
      <style>{`
        .animate-fade-in { animation: fadeIn 0.7s cubic-bezier(.4,0,.2,1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        .animate-bounce-slow { animation: bounceSlow 2.5s infinite alternate; }
        @keyframes bounceSlow { 0% { transform: translateY(0); } 100% { transform: translateY(-8px); } }
      `}</style>
    </div>
  );
};

export default HealthChat;
