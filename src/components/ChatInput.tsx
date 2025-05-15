
import React, { useState, FormEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

const ChatInput = ({ onSendMessage }: ChatInputProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-gray-200 p-4">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
      />
      <button
        type="submit"
        className="p-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        disabled={!message.trim()}
      >
        <Send size={18} />
      </button>
    </form>
  );
};

export default ChatInput;
