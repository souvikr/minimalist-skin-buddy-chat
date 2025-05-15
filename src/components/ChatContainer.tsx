
import React, { useEffect, useRef, useState } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { getChatResponse } from '@/services/openaiService';
import { toast } from "@/hooks/use-toast";

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
      text: "Hello! I'm your Minimalist Skincare Assistant. How can I help you with your skin today? You can describe your skin concerns, ask for product advice, or get a personalized skincare routine.",
      isUser: false
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Minimalist skincare products
  const skinCareProducts = {
    serums: [
      {
        name: "Minimalist 10% Niacinamide Face Serum",
        description: "Reduces excess oil, treats hyperpigmentation and improves skin texture. For oily, acne-prone skin.",
        image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
      },
      {
        name: "Minimalist 2% Salicylic Acid Face Serum",
        description: "Treats acne and unclogs pores with gentle exfoliation. For acne-prone skin.",
        image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
      },
      {
        name: "Minimalist 10% Vitamin C Face Serum",
        description: "Brightens skin, reduces dark spots and boosts collagen production. For dull, aging skin.",
        image: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
      }
    ],
    moisturizers: [
      {
        name: "Minimalist Sepicalm 3% + Oat Moisturizer",
        description: "Soothes irritation and strengthens skin barrier. For sensitive skin.",
        image: "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
      },
      {
        name: "CeraVe Moisturizing Cream",
        description: "Hydrates dry skin with ceramides and hyaluronic acid. For very dry skin.",
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        isAlternative: true
      }
    ],
    cleansers: [
      {
        name: "Minimalist 2% Salicylic Acid Cleanser",
        description: "Gently exfoliates and prevents breakouts. For oily, acne-prone skin.",
        image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
      }
    ]
  };

  // Get a selection of products based on the message content
  const getRelevantProducts = (message: string, response: string): Product[] => {
    const relevantProducts: Product[] = [];
    const messageContent = message.toLowerCase();
    const responseContent = response.toLowerCase();
    
    // Match for skincare concerns
    if (messageContent.includes('acne') || responseContent.includes('acne')) {
      relevantProducts.push(...skinCareProducts.serums.filter(p => 
        p.name.toLowerCase().includes('salicylic') || 
        p.description.toLowerCase().includes('acne')));
    }
    
    if (messageContent.includes('dark spot') || 
        messageContent.includes('pigmentation') || 
        responseContent.includes('dark spot') || 
        responseContent.includes('pigmentation')) {
      relevantProducts.push(...skinCareProducts.serums.filter(p => 
        p.name.toLowerCase().includes('vitamin c') || 
        p.name.toLowerCase().includes('niacinamide')));
    }

    if (messageContent.includes('routine') || responseContent.includes('routine')) {
      // Add a selection of products that make a complete routine
      if (relevantProducts.length === 0) {
        relevantProducts.push(skinCareProducts.cleansers[0]);
        relevantProducts.push(skinCareProducts.serums[0]);
        relevantProducts.push(skinCareProducts.moisturizers[0]);
      }
    }

    if (messageContent.includes('dry') || 
        messageContent.includes('moisturizer') || 
        responseContent.includes('dry') || 
        responseContent.includes('moisturizer')) {
      relevantProducts.push(...skinCareProducts.moisturizers);
    }

    // Limit to max 3 products
    return relevantProducts.slice(0, 3);
  };

  const handleSendMessage = async (message: string) => {
    // Add user message
    setMessages(prev => [...prev, { text: message, isUser: true }]);
    
    setIsLoading(true);
    
    try {
      const response = await getChatResponse(message);
      
      // Get relevant products based on message content
      const products = getRelevantProducts(message, response);
      
      const newMessage: Message = { 
        text: response, 
        isUser: false,
        products: products.length > 0 ? products : undefined
      };
      
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
