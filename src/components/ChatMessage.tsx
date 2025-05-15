
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
  isMobile?: boolean;
}

const ChatMessage = ({ message, isUser, products, imageUrl, isMobile = false }: ChatMessageProps) => {
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
        'Cleanser', 'Toner', 'Serum', 'Moisturizer', 'Sunscreen', 
        'Salicylic Acid', 'Niacinamide', 'Vitamin B5', 'Vitamin C', 'Alpha Arbutin',
        'oily', 'dry', 'sensitive', 'acne-prone', 'pigmentation', 'hydration'
      ];
      
      keyTerms.forEach(term => {
        const regex = new RegExp(`(?<![\\w\\*])(${term})(?![\\w\\*])`, 'g');
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
      const bulletMatch = trimmedLine.match(/^[\*\-]\s+(.*)/);

      // Handle numbered list
      if (numberedMatch) {
        if (!inList || listType !== 'ol') {
          // If we were in a different type of list, close it
          if (inList) {
            if (listType === 'ul') {
              formattedContent.push(<ul key={`list-${keyCounter++}`} className="list-disc pl-5 mb-2">{listItems}</ul>);
            }
            listItems = [];
          }
          inList = true;
          listType = 'ol';
        }
        // Only use the number from the original text, not duplicated
        listItems.push(
          <li key={`item-${keyCounter++}`} className="mb-1">
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
              formattedContent.push(<ol key={`list-${keyCounter++}`} className="list-decimal pl-5 mb-2">{listItems}</ol>);
            }
            listItems = [];
          }
          inList = true;
          listType = 'ul';
        }
        listItems.push(
          <li key={`item-${keyCounter++}`} className="mb-1">
            {formatBoldText(bulletMatch[1])}
          </li>
        );
      }
      // Not a list item
      else {
        // If we were in a list, close it
        if (inList) {
          if (listType === 'ul') {
            formattedContent.push(<ul key={`list-${keyCounter++}`} className="list-disc pl-5 mb-2">{listItems}</ul>);
          } else {
            formattedContent.push(<ol key={`list-${keyCounter++}`} className="list-decimal pl-5 mb-3 gap-y-2">{listItems}</ol>);
          }
          listItems = [];
          inList = false;
        }

        // Add paragraph if not empty
        if (trimmedLine) {
          formattedContent.push(
            <p key={`p-${keyCounter++}`} className="mb-2">
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
        formattedContent.push(<ul key={`list-${keyCounter++}`} className="list-disc pl-5 mb-2">{listItems}</ul>);
      } else {
        formattedContent.push(<ol key={`list-${keyCounter++}`} className="list-decimal pl-5 mb-2">{listItems}</ol>);
      }
    }

    return formattedContent;
  };

  return (
    <div className={cn(
      "flex w-full mb-3 sm:mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[90%] sm:max-w-[80%] p-2 sm:p-3 rounded-lg",
        isUser ? "bg-black text-white rounded-tr-none" : "bg-gray-100 text-black rounded-tl-none"
      )}>
        {/* Display the image if it exists */}
        {imageUrl && (
          <div className="mb-2 sm:mb-3">
            <img 
              src={imageUrl} 
              alt="Uploaded" 
              className="rounded-lg max-h-40 sm:max-h-60 object-contain"
            />
          </div>
        )}

        <div className="text-xs sm:text-sm md:text-base">
          {formatMessage(message)}
        </div>
        
        {/* Debug output to check if products exist */}
        {products && products.length > 0 ? (
          <div className="mt-2 sm:mt-3">
            {products.length === 1 ? (
              <ProductCard 
                product={products[0]}
                isMobile={isMobile}
              />
            ) : (
              <ProductCarousel products={products} isMobile={isMobile} />
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-500 mt-2">No product recommendations available</div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
