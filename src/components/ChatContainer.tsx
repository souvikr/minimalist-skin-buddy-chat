
import React, { useEffect, useRef, useState } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { getChatResponse, Product } from '@/services/openaiService';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface Message {
  text: string;
  isUser: boolean;
  products?: Product[];
  imageUrl?: string;
}

const ChatContainer = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm your Minimalist Skincare Assistant. 💫\n\nI'll help you create a personalized skincare routine and recommend the perfect products for your skin type and concerns.\n\nYou can:\n• Describe your skin concerns\n• Upload a photo of your skin\n• Ask for a complete routine\n• Get specific product recommendations\n\nWhat's your main skin concern today?",
      isUser: false
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (message: string, imageFile?: File) => {
    let imageUrl: string | undefined;
    
    // Add user message to the chat
    if (imageFile) {
      // Create temporary object URL for immediate display
      imageUrl = URL.createObjectURL(imageFile);
      setMessages(prev => [...prev, { 
        text: message || "Here's a photo of my skin concern.", 
        isUser: true,
        imageUrl
      }]);
    } else {
      // Text-only message
      setMessages(prev => [...prev, { text: message, isUser: true }]);
    }
    
    setIsLoading(true);
    
    try {
      let response;
      
      if (imageFile) {
        // Handle message with image
        response = await sendMessageWithImage(message, imageFile);
      } else {
        // Handle text-only message
        response = await getChatResponse(message);
      }
      
      console.log("Received response:", response);
      
      const newMessage: Message = { 
        text: response.text, 
        isUser: false,
        products: response.products
      };
      
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error("Failed to get chat response:", error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
      
      // Add an error message to the chat
      setMessages(prev => [...prev, { 
        text: "Sorry, I couldn't process your request. Please try again.", 
        isUser: false 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessageWithImage = async (message: string, imageFile: File): Promise<{text: string, products: Product[]}> => {
    try {
      // Create FormData object for sending both text and image
      const formData = new FormData();
      formData.append('message', message || "What can you tell me about this skin concern?");
      formData.append('image', imageFile);
      
      // Call Supabase Edge Function with formData
      const { data, error } = await supabase.functions.invoke('skincare-assistant', {
        body: formData,
      });
      
      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || 'Failed to get response from skincare assistant');
      }
      
      if (!data || !data.response) {
        console.error("Invalid response from skincare assistant:", data);
        throw new Error('Invalid response from skincare assistant');
      }
      
      return {
        text: data.response,
        products: data.products || []
      };
    } catch (error) {
      console.error('Error calling skincare-assistant function with image:', error);
      throw error;
    }
  };

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full relative bg-gradient-to-br from-gray-50 to-white">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, index) => (
          <ChatMessage 
            key={index} 
            message={msg.text} 
            isUser={msg.isUser}
            products={msg.products}
            imageUrl={msg.imageUrl}
          />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-white shadow-lg border border-gray-100 py-4 px-6 rounded-2xl max-w-[80%]">
              <div className="flex space-x-2 items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <span className="text-xs text-gray-500 ml-2">Creating your skincare routine...</span>
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
