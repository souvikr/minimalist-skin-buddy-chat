import React, { useState, FormEvent, useRef, ChangeEvent } from 'react';
import { Send, Paperclip, X, Camera } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string, imageFile?: File) => void;
}

const ChatInput = ({ onSendMessage }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 md:p-6">
        {imagePreview && (
          <div className="relative inline-block animate-scale-in">
            <img 
              src={imagePreview} 
              alt="Selected" 
              className="h-24 md:h-32 rounded-xl object-cover border-2 border-gray-200 shadow-md" 
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors shadow-lg"
            >
              <X size={14} />
            </button>
          </div>
        )}
        
        <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-2 border border-gray-200 focus-within:border-black focus-within:bg-white transition-all">
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
            className="p-2.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
            aria-label="Attach image"
          >
            <Camera size={20} />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={selectedImage ? "Describe your skin concern..." : "Ask about your skincare routine or concerns..."}
            className="flex-1 p-2.5 bg-transparent focus:outline-none text-gray-800 placeholder-gray-500"
          />
          <button
            type="submit"
            className={cn(
              "p-2.5 rounded-xl transition-all",
              (message.trim() || selectedImage)
                ? "bg-black text-white hover:bg-gray-800 shadow-md"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
            disabled={!message.trim() && !selectedImage}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
