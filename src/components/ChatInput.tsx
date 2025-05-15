
import React, { useState, FormEvent, useRef, ChangeEvent } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatInputProps {
  onSendMessage: (message: string, imageFile?: File) => void;
}

const ChatInput = ({ onSendMessage }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() || selectedImage) {
      onSendMessage(message, selectedImage || undefined);
      setMessage('');
      setSelectedImage(null);
      setImagePreview(null);
    }
  };

  const handleAttachImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (limit to 4MB)
      if (file.size > 4 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 4MB.",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-gray-200 p-2 sm:p-4">
      {imagePreview && (
        <div className="relative inline-block">
          <img 
            src={imagePreview} 
            alt="Selected" 
            className="h-16 sm:h-24 rounded-lg object-cover" 
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />
        <button
          type="button"
          onClick={handleAttachImage}
          className="p-2 sm:p-3 text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Attach image"
        >
          <Paperclip size={isMobile ? 16 : 18} />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={selectedImage ? "Add a description..." : "Type your skin concern here..."}
          className="flex-1 p-2 sm:p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black text-sm sm:text-base"
        />
        <button
          type="submit"
          className="p-2 sm:p-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          disabled={!message.trim() && !selectedImage}
        >
          <Send size={isMobile ? 16 : 18} />
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
