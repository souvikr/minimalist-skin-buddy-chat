
import React from 'react';
import { cn } from "@/lib/utils";
import ProductCard from './ProductCard';
import ProductCarousel from './ProductCarousel';

interface Product {
  name: string;
  description: string;
  image: string;
  isAlternative?: boolean;
}

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  products?: Product[];
}

const ChatMessage = ({ message, isUser, products }: ChatMessageProps) => {
  // Function to format message text with paragraphs and bullet points
  const formatMessage = (text: string) => {
    // Split by new lines and map to paragraphs
    return text.split('\n').map((paragraph, i) => {
      // Check if this line is a bullet point
      if (paragraph.trim().startsWith('*') || paragraph.trim().startsWith('-')) {
        return (
          <li key={i} className="ml-4">
            {paragraph.trim().substring(1).trim()}
          </li>
        );
      }
      return paragraph.trim() ? <p key={i} className="mb-2">{paragraph}</p> : <br key={i} />;
    });
  };

  return (
    <div className={cn(
      "flex w-full mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] p-3 rounded-lg",
        isUser ? "bg-black text-white rounded-tr-none" : "bg-gray-100 text-black rounded-tl-none"
      )}>
        <div className="text-sm sm:text-base">
          {formatMessage(message)}
        </div>
        
        {/* Render product cards if they exist */}
        {products && products.length > 0 && (
          <div className="mt-3">
            {products.length === 1 ? (
              <ProductCard 
                product={products[0]}
              />
            ) : (
              <ProductCarousel products={products} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
