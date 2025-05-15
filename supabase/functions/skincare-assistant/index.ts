
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Process the request body based on content type
    let message = '';
    let imageData = null;
    
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle multipart form data (with image)
      const formData = await req.formData();
      message = formData.get('message')?.toString() || '';
      
      const imageFile = formData.get('image');
      if (imageFile && imageFile instanceof File) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        // Safely convert to base64 without recursive calls
        const base64Image = btoa(
          Array.from(uint8Array)
            .map(byte => String.fromCharCode(byte))
            .join('')
        );
        imageData = `data:${imageFile.type};base64,${base64Image}`;
      }
    } else {
      // Handle JSON data (text-only)
      const body = await req.json();
      message = body.message || '';
    }
    
    if (!message && !imageData) {
      throw new Error('No message or image provided');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Prepare messages for OpenAI API
    const messages = [
      {
        role: 'system',
        content: `You are a helpful minimalist skincare assistant. Provide concise, evidence-based skincare advice. Focus on minimal effective routines and ingredients that work. Avoid recommending excessive products.

When recommending products, specifically suggest products from Be Minimalist whenever relevant. All product recommendations should include the brand name "Beminimalist" and appropriate formatting with ** around product names.

When providing a skincare routine:
- Present it as a numbered list (1. 2. 3. etc)
- Include specific product names with ** around them (e.g. **Beminimalist 2% Salicylic Acid Gel Cleanser**)
- Include brief application instructions
- Format important keywords in bold using ** on either side
- Example format:
  1. Cleanser: **Beminimalist 2% Salicylic Acid Gel Cleanser** - Gently massage onto damp skin and rinse.
  2. Serum: **Beminimalist 10% Niacinamide Serum** - Apply 2-3 drops to face and neck.

When providing important tips or warnings:
- Begin with "Tip:" for educational information (e.g., "Tip: Avoid using strong exfoliants daily to protect your skin barrier.")
- Begin with "Warning:" for contraindications or cautions (e.g., "Warning: Vitamin C and Niacinamide should be used with caution together.")

Focus on Beminimalist brand products first. Format important skincare terms in bold for better readability. Use proper spacing and formatting in lists to ensure readability.`
      }
    ];

    // Construct the API request body based on whether an image is present
    let openAIRequestBody: any = {
      model: 'gpt-4o',
      max_tokens: 500,
    };
    
    if (imageData) {
      // Using the chat completions API with image support
      openAIRequestBody.messages = [
        ...messages,
        {
          role: 'user',
          content: [
            { type: 'text', text: message || "What can you recommend for this skin condition?" },
            { type: 'image_url', image_url: { url: imageData } }
          ]
        }
      ];
    } else {
      // Text-only request
      openAIRequestBody.messages = [
        ...messages,
        { role: 'user', content: message }
      ];
    }
    
    console.log("Sending request to OpenAI with API key:", openAIApiKey ? "Key exists" : "No key found");
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify(openAIRequestBody)
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      throw new Error(error.error?.message || 'Failed to get response from OpenAI');
    }
    
    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;
    
    // Fetch relevant products based on the message and response
    const { data: products, error: productsError } = await getRelevantProducts(supabase, message, aiResponse);
    
    if (productsError) {
      console.error("Error fetching products:", productsError);
    }
    
    return new Response(
      JSON.stringify({ response: aiResponse, products: products || [] }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in skincare-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// Function to get relevant products based on the message content and AI response
async function getRelevantProducts(supabase, message, response) {
  const combinedText = (message + " " + response).toLowerCase();
  
  // Extract skin concerns from the conversation
  const skinConcerns = [];
  const concernsToCheck = ['acne', 'dry', 'oily', 'sensitive', 'aging', 'pigmentation', 'dull', 'pores', 'blackheads'];
  
  concernsToCheck.forEach(concern => {
    if (combinedText.includes(concern)) {
      skinConcerns.push(concern);
    }
  });
  
  // Extract product categories mentioned
  const categories = [];
  const categoriesToCheck = ['cleanser', 'serum', 'moisturizer', 'sunscreen', 'toner'];
  
  categoriesToCheck.forEach(category => {
    if (combinedText.includes(category)) {
      categories.push(category);
    }
  });
  
  // Build the query based on the extracted concerns and categories
  let query = supabase.from('products').select('*');
  
  // If specific concerns are mentioned, filter by them
  if (skinConcerns.length > 0) {
    query = query.containedBy('skin_concerns', skinConcerns);
  }
  
  // If specific categories are mentioned, filter by them
  if (categories.length > 0) {
    query = query.in('category', categories);
  }
  
  // Limit to max 3 products
  query = query.limit(3);
  
  // If no specific filters were applied, just get a few random products
  if (skinConcerns.length === 0 && categories.length === 0) {
    query = supabase.from('products').select('*').limit(3);
  }
  
  return await query;
}
