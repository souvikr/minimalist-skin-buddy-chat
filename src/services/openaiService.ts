
interface OpenAIResponseChoice {
  message: {
    content: string;
    role: string;
  };
  finish_reason: string;
}

interface OpenAIResponse {
  id: string;
  choices: OpenAIResponseChoice[];
  created: number;
  model: string;
  object: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string;
  product_url: string;
  category: string;
  skin_concerns: string[];
  key_ingredients: string[];
}

import { supabase } from "@/integrations/supabase/client";

// These functions are no longer needed but kept for backward compatibility
export const setApiKey = (key: string) => {
  // Do nothing - we're using the server-side key now
};

export const getApiKey = () => "API_KEY_STORED_IN_SUPABASE";

export const clearApiKey = () => {
  // Do nothing - we're using the server-side key now
};

export const getChatResponse = async (message: string): Promise<{text: string, products: Product[]}> => {
  try {
    const { data, error } = await supabase.functions.invoke('skincare-assistant', {
      body: { message }
    });
    
    if (error) {
      throw new Error(error.message || 'Failed to get response from skincare assistant');
    }
    
    return {
      text: data.response,
      products: data.products || []
    };
  } catch (error) {
    console.error('Error calling skincare-assistant function:', error);
    throw error;
  }
};
