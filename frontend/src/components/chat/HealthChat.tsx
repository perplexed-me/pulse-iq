import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Bot, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG } from '@/config/api';

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
            <div key={index} className="font-bold text-blue-700 my-3 text-lg bg-blue-50/50 rounded-lg px-3 py-2 border-l-4 border-blue-500">
              {trimmedLine}
            </div>
          );
        }
        return (
          <div key={index} className="my-1 text-gray-700">{trimmedLine}</div>
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
      const response = await fetch(API_CONFIG.AI.CHAT, {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              PulseIQ Health Assistant
            </h1>
            <p className="text-sm text-gray-500">Your intelligent health companion</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={goBack} 
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50/80 border-blue-200 bg-blue-50/50 backdrop-blur-sm transition-all duration-200 hover:scale-105 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-6 py-6" ref={scrollAreaRef}>
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message, idx) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start gap-4 max-w-[75%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                    message.sender === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                      : 'bg-gradient-to-r from-green-400 to-blue-500'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className={`rounded-2xl px-5 py-4 shadow-lg transition-all duration-200 hover:shadow-xl ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                      : 'bg-white/90 backdrop-blur-sm border border-gray-200/50 text-gray-900'
                  }`}>
                    <div className="text-sm leading-relaxed">
                      {message.sender === 'ai' ? (
                        <div className="whitespace-pre-line">
                          {formatAIResponse(message.content)}
                        </div>
                      ) : (
                        <span className="whitespace-pre-line font-medium">{message.content}</span>
                      )}
                    </div>
                    <div className={`text-xs mt-2 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-4 max-w-[75%]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center shadow-lg">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="rounded-2xl px-5 py-4 bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-lg">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>      {/* Input Area */}
      <div className="bg-white/80 backdrop-blur-md border-t border-gray-200/50 p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl px-6 py-3 shadow-inner border border-gray-200/50">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your health concerns..."
              disabled={isLoading}
              className="flex-1 bg-transparent border-none focus:ring-0 text-base placeholder:text-gray-500 font-medium"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              size="sm"
              className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:scale-100"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center mt-4">
            <p className="text-xs text-gray-500 text-center bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200/50">
              💡 This AI assistant provides general health information and should not replace professional medical advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthChat;
