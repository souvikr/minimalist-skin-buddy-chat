
import React from 'react';
import { Key } from "lucide-react";

const ApiKeyInput = () => {
  // We're now using a server-side API key, so this component is just informational
  return (
    <button 
      className="absolute top-2 right-2 p-2 bg-black text-white hover:bg-gray-800 rounded-full transition-colors"
      title="API key is set on the server"
    >
      <Key size={16} />
    </button>
  );
};

export default ApiKeyInput;
