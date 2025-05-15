
import { toast } from "@/components/ui/toast";

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

let apiKey: string | null = localStorage.getItem('openai_api_key');

export const setApiKey = (key: string) => {
  apiKey = key;
  localStorage.setItem('openai_api_key', key);
};

export const getApiKey = () => apiKey;

export const clearApiKey = () => {
  apiKey = null;
  localStorage.removeItem('openai_api_key');
};

export const getChatResponse = async (message: string): Promise<string> => {
  if (!apiKey) {
    throw new Error('API key is not set');
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful minimalist skincare assistant. Provide concise, evidence-based skincare advice. Focus on minimal effective routines and ingredients that work. Avoid recommending excessive products.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get response from OpenAI');
    }
    
    const data: OpenAIResponse = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to get response",
      variant: "destructive",
    });
    throw error;
  }
};
