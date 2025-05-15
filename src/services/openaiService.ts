
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

// Hardcoded API key - note that this is visible to users in the browser
// For production, consider using Supabase Edge Functions with secrets
const OPENAI_API_KEY = "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";

// These functions are no longer needed but kept for backward compatibility
export const setApiKey = (key: string) => {
  // Do nothing - we're using the hardcoded key now
};

export const getApiKey = () => OPENAI_API_KEY;

export const clearApiKey = () => {
  // Do nothing - we're using the hardcoded key now
};

export const getChatResponse = async (message: string): Promise<string> => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
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
    throw error;
  }
};
