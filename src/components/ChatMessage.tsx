
import React from 'react';
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
}

const ChatMessage = ({ message, isUser }: ChatMessageProps) => {
  return (
    <div className={cn(
      "flex w-full mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] p-3 rounded-lg",
        isUser ? "bg-black text-white rounded-tr-none" : "bg-gray-100 text-black rounded-tl-none"
      )}>
        <p className="text-sm sm:text-base">{message}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
