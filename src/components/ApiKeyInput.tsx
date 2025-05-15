
import React, { useState, useEffect } from 'react';
import { getApiKey, setApiKey } from "@/services/openaiService";
import { toast } from "@/components/ui/use-toast";
import { X, Key } from "lucide-react";

const ApiKeyInput = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [key, setKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedKey = getApiKey();
    if (savedKey) {
      setKey(savedKey);
      setIsSaved(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    try {
      setApiKey(key.trim());
      setIsSaved(true);
      toast({
        title: "Success",
        description: "OpenAI API key saved successfully",
      });
      setIsVisible(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    setKey('');
    setIsSaved(false);
  };

  if (!isVisible && !isSaved) {
    return (
      <button 
        onClick={() => setIsVisible(true)} 
        className="absolute top-2 right-2 p-2 text-black hover:bg-gray-100 rounded-full transition-colors"
        title="Set OpenAI API Key"
      >
        <Key size={16} />
      </button>
    );
  }

  if (!isVisible && isSaved) {
    return (
      <button 
        onClick={() => setIsVisible(true)} 
        className="absolute top-2 right-2 p-2 bg-black text-white hover:bg-gray-800 rounded-full transition-colors"
        title="OpenAI API Key is set"
      >
        <Key size={16} />
      </button>
    );
  }

  return (
    <div className="absolute top-0 right-0 p-4 bg-white shadow-md rounded-bl-lg z-10">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">OpenAI API Key</h3>
        <button 
          onClick={() => setIsVisible(false)} 
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
          placeholder="Enter your OpenAI API key"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-3 py-1 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Save
          </button>
          {isSaved && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ApiKeyInput;
