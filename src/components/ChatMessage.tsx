
import React from 'react';
import { cn } from "@/lib/utils";
import ProductCard from './ProductCard';
import ProductCarousel from './ProductCarousel';
import { Product } from '@/services/openaiService';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  products?: Product[];
  imageUrl?: string;
}

const ChatMessage = ({ message, isUser, products, imageUrl }: ChatMessageProps) => {
  // Function to format message text with paragraphs, bullet points, and numbered lists
  const formatMessage = (text: string) => {
    const lines = text.split('\n');
    const formattedContent: JSX.Element[] = [];
    let inList = false;
    let listItems: JSX.Element[] = [];
    let listType: 'ul' | 'ol' = 'ul';
    let keyCounter = 0;

    // Function to apply bold to product names and important terms
    const formatBoldText = (text: string) => {
      // Bold product names with ** around them
      let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Bold important skincare terms
      const keyTerms = [
        'Morning Routine', 'Evening Routine', 'Cleanser', 'Toner', 'Serum', 'Moisturizer', 'Sunscreen', 
        'Salicylic Acid', 'Niacinamide', 'Vitamin B5', 'Vitamin C', 'Alpha Arbutin', 'Hyaluronic Acid',
        'oily', 'dry', 'sensitive', 'acne-prone', 'pigmentation', 'hydration', 'Step 1', 'Step 2', 'Step 3'
      ];
      
      keyTerms.forEach(term => {
        const regex = new RegExp(`(?<![\\w\\*])(${term})(?![\\w\\*])`, 'gi');
        formattedText = formattedText.replace(regex, '<strong>$1</strong>');
      });
      
      return <span dangerouslySetInnerHTML={{ __html: formattedText }} />;
    };

    // Process each line
    lines.forEach((line, i) => {
      const trimmedLine = line.trim();
      
      // Check if this is a numbered list item
      const numberedMatch = trimmedLine.match(/^(\d+)\.?\s+(.*)/);
      
      // Check if this is a bullet point
      const bulletMatch = trimmedLine.match(/^[\*\-•]\s+(.*)/);

      // Handle numbered list
      if (numberedMatch) {
        if (!inList || listType !== 'ol') {
          // If we were in a different type of list, close it
          if (inList) {
            if (listType === 'ul') {
              formattedContent.push(<ul key={`list-${keyCounter++}`} className="list-disc pl-6 mb-4 space-y-2">{listItems}</ul>);
            }
            listItems = [];
          }
          inList = true;
          listType = 'ol';
        }
        listItems.push(
          <li key={`item-${keyCounter++}`} className="mb-2 leading-relaxed">
            {formatBoldText(numberedMatch[2])}
          </li>
        );
      }
      // Handle bullet list
      else if (bulletMatch) {
        if (!inList || listType !== 'ul') {
          // If we were in a different type of list, close it
          if (inList) {
            if (listType === 'ol') {
              formattedContent.push(<ol key={`list-${keyCounter++}`} className="list-decimal pl-6 mb-4 space-y-2">{listItems}</ol>);
            }
            listItems = [];
          }
          inList = true;
          listType = 'ul';
        }
        listItems.push(
          <li key={`item-${keyCounter++}`} className="mb-2 leading-relaxed">
            {formatBoldText(bulletMatch[1])}
          </li>
        );
      }
      // Not a list item
      else {
        // If we were in a list, close it
        if (inList) {
          if (listType === 'ul') {
            formattedContent.push(<ul key={`list-${keyCounter++}`} className="list-disc pl-6 mb-4 space-y-2">{listItems}</ul>);
          } else {
            formattedContent.push(<ol key={`list-${keyCounter++}`} className="list-decimal pl-6 mb-4 space-y-2">{listItems}</ol>);
          }
          listItems = [];
          inList = false;
        }

        // Add paragraph if not empty
        if (trimmedLine) {
          formattedContent.push(
            <p key={`p-${keyCounter++}`} className="mb-3 leading-relaxed">
              {formatBoldText(trimmedLine)}
            </p>
          );
        } else if (i < lines.length - 1) {
          // Add a break between paragraphs, but not at the very end
          formattedContent.push(<br key={`br-${keyCounter++}`} />);
        }
      }
    });

    // Close any open list at the end
    if (inList) {
      if (listType === 'ul') {
        formattedContent.push(<ul key={`list-${keyCounter++}`} className="list-disc pl-6 mb-4 space-y-2">{listItems}</ul>);
      } else {
        formattedContent.push(<ol key={`list-${keyCounter++}`} className="list-decimal pl-6 mb-4 space-y-2">{listItems}</ol>);
      }
    }

    return formattedContent;
  };

  console.log("Products in ChatMessage:", products);

  return (
    <div className={cn(
      "flex w-full mb-6 animate-fade-in",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[85%] md:max-w-[75%] p-4 md:p-5 rounded-2xl shadow-lg border transition-all hover:shadow-xl",
        isUser 
          ? "bg-gradient-to-br from-black to-gray-800 text-white rounded-tr-sm border-gray-800" 
          : "bg-white text-gray-800 rounded-tl-sm border-gray-100"
      )}>
        {/* Display the image if it exists */}
        {imageUrl && (
          <div className="mb-4">
            <img 
              src={imageUrl} 
              alt="Uploaded" 
              className="rounded-xl max-h-64 w-full object-cover border border-gray-200"
            />
          </div>
        )}

        <div className="text-sm md:text-base">
          {formatMessage(message)}
        </div>
        
        {/* Render product cards if they exist */}
        {products && products.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">✨ Recommended Products</h4>
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
