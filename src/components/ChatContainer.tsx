
import React, { useEffect, useRef, useState } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { getChatResponse } from '@/services/openaiService';
import { toast } from "@/components/ui/use-toast";

export interface Product {
  name: string;
  description: string;
  image: string;
  isAlternative?: boolean;
}

export interface Message {
  text: string;
  isUser: boolean;
  products?: Product[];
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

  // Sample product data
  const sampleProducts = [
    {
      name: "Minimalist 10% Niacinamide Serum",
      description: "Reduces excess oil, treats hyperpigmentation and improves skin texture",
      image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
      name: "Minimalist 2% Salicylic Acid",
      description: "Treats acne and unclogs pores with gentle exfoliation",
      image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
      name: "CeraVe Moisturizing Cream",
      description: "Hydrates dry skin with ceramides and hyaluronic acid",
      image: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      isAlternative: true
    }
  ];

  const handleSendMessage = async (message: string) => {
    // Add user message
    setMessages(prev => [...prev, { text: message, isUser: true }]);
    
    setIsLoading(true);
    
    try {
      const response = await getChatResponse(message);
      
      // This is just for demo purposes - in a real app, you would parse the response
      // to detect product recommendations and add them to the message
      const newMessage: Message = { text: response, isUser: false };
      
      // For demo: If message contains specific keywords, add product recommendations
      if (
        message.toLowerCase().includes('acne') || 
        message.toLowerCase().includes('product') ||
        message.toLowerCase().includes('recommendation')
      ) {
        // Add sample products to the bot's response
        newMessage.products = sampleProducts;
      }
      
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error("Failed to get chat response:", error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again later.",
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
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <ChatMessage 
            key={index} 
            message={msg.text} 
            isUser={msg.isUser}
            products={msg.products}
          />
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
