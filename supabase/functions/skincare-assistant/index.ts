
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
    
    // Short and focused prompt for faster response
    const messages = [
      {
        role: 'system',
        content: `You're a skincare expert. Format product names with ** (e.g. **Niacinamide 10%**). Don't include the word "Beminimalist" in product names. Recommend 3 products for the user's concern.`
      }
    ];

    // Construct the API request body based on whether an image is present
    let openAIRequestBody: any = {
      model: 'gpt-4o-mini',
      max_tokens: 400,
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
    
    // Extract product names from the AI response
    const productNameRegex = /\*\*(.*?)\*\*/g;
    const productMatches = aiResponse.match(productNameRegex);
    
    let recommendedProducts = [];
    
    if (productMatches && productMatches.length > 0) {
      // Extract product names without the asterisks
      const extractedProductNames = productMatches.map(match => 
        match.replace(/\*\*/g, '')
      );
      
      console.log("Extracted product names:", extractedProductNames);
      
      // First try to find exact matches for the recommended products
      let exactMatches = [];
      for (const name of extractedProductNames) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .ilike('name', `%${name}%`)
          .limit(1);
          
        if (!error && data && data.length > 0) {
          exactMatches.push(data[0]);
        }
      }
      
      // If we found exact matches, use them
      if (exactMatches.length > 0) {
        recommendedProducts = exactMatches;
      }
      
      // If we don't have enough exact matches, add products based on keywords
      if (recommendedProducts.length < 3) {
        // Extract keywords from user query and AI response
        const userKeywords = message.toLowerCase().split(/\s+/);
        const aiKeywords = aiResponse.toLowerCase().split(/\s+/);
        const combinedKeywords = [...new Set([...userKeywords, ...aiKeywords])];
        
        // Get relevant keywords by filtering out common words
        const commonWords = ['the', 'and', 'or', 'for', 'with', 'this', 'that', 'what', 'can', 'you', 'recommend', 'help', 'need', 'looking', 'products', 'product', 'skin', 'i', 'my', 'me', 'to', 'of', 'in', 'is', 'are'];
        const relevantKeywords = combinedKeywords.filter(word => 
          word.length > 3 && !commonWords.includes(word)
        );
        
        // Query based on skin concerns and key ingredients matching the keywords
        const { data: keywordMatches, error: keywordError } = await supabase
          .from('products')
          .select('*')
          .or(
            relevantKeywords.map(keyword => 
              `skin_concerns.cs.{${keyword}},key_ingredients.cs.{${keyword}},description.ilike.%${keyword}%`
            ).join(',')
          )
          .not('id', 'in', `(${recommendedProducts.map(p => p.id).join(',')})`)
          .limit(3 - recommendedProducts.length);
          
        if (!keywordError && keywordMatches && keywordMatches.length > 0) {
          recommendedProducts = [...recommendedProducts, ...keywordMatches];
        }
      }
    }
    
    // If we still don't have enough products, get random ones as fallback
    if (recommendedProducts.length < 3) {
      const neededProducts = 3 - recommendedProducts.length;
      const existingIds = recommendedProducts.map(p => p.id);
      
      const { data: defaultProducts, error: defaultError } = await supabase
        .from('products')
        .select('*')
        .not('id', 'in', `(${existingIds.join(',')})`)
        .limit(neededProducts)
        .order('id', { ascending: false });  
      
      if (!defaultError && defaultProducts && defaultProducts.length > 0) {
        recommendedProducts = [...recommendedProducts, ...defaultProducts];
      }
    }
    
    return new Response(
      JSON.stringify({ response: aiResponse, products: recommendedProducts }),
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
