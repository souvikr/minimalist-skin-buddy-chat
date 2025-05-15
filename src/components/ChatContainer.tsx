
import React, { useEffect, useRef, useState } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (message: string) => {
    // Add user message
    setMessages(prev => [...prev, { text: message, isUser: true }]);
    
    // Simulate bot response after a short delay
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: "Thank you for your message. As a demo chatbot, I'm showing a placeholder response. In a full implementation, I would provide personalized skincare advice based on your needs.", 
        isUser: false 
      }]);
    }, 1000);
  };

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg.text} isUser={msg.isUser} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatContainer;
