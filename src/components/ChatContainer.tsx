import React, { useEffect, useRef, useState } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ApiKeyInput from './ApiKeyInput';
import { getChatResponse, getApiKey } from '@/services/openaiService';
import { toast } from "@/components/ui/use-toast";

export interface Message {
  text: string;
  isUser: boolean;
}

const ChatContainer = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm your Minimalist Skincare Assistant. How can I help you with your skin today? You can describe your skin concerns or ask for product advice.",
      isUser: false
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (message: string) => {
    // Add user message
    setMessages(prev => [...prev, { text: message, isUser: true }]);
    
    setIsLoading(true);
    
    // Check if API key is set
    if (!getApiKey()) {
      setMessages(prev => [
        ...prev, 
        { 
          text: "Please set your OpenAI API key first by clicking the key icon in the top right corner.", 
          isUser: false 
        }
      ]);
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await getChatResponse(message);
      setMessages(prev => [...prev, { text: response, isUser: false }]);
    } catch (error) {
      console.error("Failed to get chat response:", error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full relative">
      <ApiKeyInput />
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg.text} isUser={msg.isUser} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 py-2 px-4 rounded-lg max-w-[80%]">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatContainer;
