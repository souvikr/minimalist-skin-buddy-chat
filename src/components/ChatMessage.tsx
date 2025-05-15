import React from 'react';
import { cn } from "@/lib/utils";
import ProductCard from './ProductCard';
import ProductCarousel from './ProductCarousel';
import { AlertTriangle, Lightbulb } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
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

    // Check for tip or warning content
    const isTip = text.includes('Tip:');
    const isWarning = text.includes('Warning:');

    // If it's a tip or warning, display it with special styling
    if (isTip || isWarning) {
      const tipContent = text.replace(/^(Tip|Warning):/, '').trim();
      return [
        <Alert 
          key={`alert-${keyCounter}`} 
          className={cn(
            "mb-2 mt-2",
            isTip ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-amber-500"
          )}
        >
          {isTip ? 
            <Lightbulb className="h-4 w-4 text-blue-500" /> : 
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          }
          <AlertDescription>
            <span className="font-medium">{isTip ? 'Tip: ' : 'Warning: '}</span>
            {tipContent}
          </AlertDescription>
        </Alert>
      ];
    }

    // Process each line
    lines.forEach((line, i) => {
      const trimmedLine = line.trim();
      
      // Check if this is a numbered list item
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
      
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
        listItems.push(<li key={`item-${keyCounter++}`}><strong>{numberedMatch[1]}. </strong>{numberedMatch[2]}</li>);
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
        listItems.push(<li key={`item-${keyCounter++}`}>{bulletMatch[1]}</li>);
      }
      // Not a list item
      else {
        // If we were in a list, close it
        if (inList) {
          if (listType === 'ul') {
            formattedContent.push(<ul key={`list-${keyCounter++}`} className="list-disc pl-5 mb-2">{listItems}</ul>);
          } else {
            formattedContent.push(<ol key={`list-${keyCounter++}`} className="list-decimal pl-5 mb-2">{listItems}</ol>);
          }
          listItems = [];
          inList = false;
        }

        // Add paragraph if not empty
        if (trimmedLine) {
          formattedContent.push(<p key={`p-${keyCounter++}`} className="mb-2">{trimmedLine}</p>);
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
      "flex w-full mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] p-3 rounded-lg",
        isUser ? "bg-black text-white rounded-tr-none" : "bg-gray-100 text-black rounded-tl-none"
      )}>
        {/* Display the image if it exists */}
        {imageUrl && (
          <div className="mb-3">
            <img 
              src={imageUrl} 
              alt="Uploaded" 
              className="rounded-lg max-h-60 object-contain"
            />
          </div>
        )}

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
