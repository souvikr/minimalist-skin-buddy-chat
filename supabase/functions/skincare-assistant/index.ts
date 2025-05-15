
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
      
      // Query database for these products - match more intelligently using LIKE
      let matchQuery = extractedProductNames.map(name => {
        const terms = name.split(' ').filter(term => term.length > 2);
        return terms.map(term => `name.ilike.%${term}%`).join(' or ');
      }).join(' or ');
      
      // Fallback if no terms were extracted
      if (!matchQuery) {
        matchQuery = "id.gt.0"; // Match all products
      }

      const { data: matchedProducts, error: productsError } = await supabase
        .from('products')
        .select('*')
        .or(matchQuery);
      
      if (productsError) {
        console.error("Error fetching specific products:", productsError);
      } else if (matchedProducts && matchedProducts.length > 0) {
        // Get products based on relevance to user's query
        const { data: relevantProducts } = await supabase
          .from('products')
          .select('*, skin_concerns, key_ingredients, description')
          .order('id', { ascending: false }) 
          .limit(10);
          
        if (relevantProducts && relevantProducts.length > 0) {
          // Score products by matching skin concerns and ingredients mentioned in the query
          const scoredProducts = relevantProducts.map(product => {
            let score = 0;
            
            // Extract keywords from user message
            const keywords = message.toLowerCase().split(/\s+/);
            
            // Score based on skin concerns match
            if (product.skin_concerns) {
              product.skin_concerns.forEach((concern: string) => {
                if (keywords.some(keyword => concern.toLowerCase().includes(keyword))) {
                  score += 3;
                }
              });
            }
            
            // Score based on key ingredients match
            if (product.key_ingredients) {
              product.key_ingredients.forEach((ingredient: string) => {
                if (keywords.some(keyword => ingredient.toLowerCase().includes(keyword))) {
                  score += 2;
                }
              });
            }
            
            // Score based on description match
            if (product.description) {
              keywords.forEach(keyword => {
                if (product.description.toLowerCase().includes(keyword)) {
                  score += 1;
                }
              });
            }
            
            return { ...product, score };
          });
          
          // Sort by score (highest first) and take top 3
          recommendedProducts = scoredProducts
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
        }
        
        // If still no products, use matched products as fallback
        if (recommendedProducts.length === 0) {
          recommendedProducts = matchedProducts.slice(0, 3);
        }
      }
    }
    
    // If we couldn't find the specific products or none were mentioned, get default products
    if (recommendedProducts.length === 0) {
      const { data: defaultProducts, error: defaultError } = await supabase
        .from('products')
        .select('*')
        .limit(3)
        .order('id', { ascending: false });  
      
      if (defaultError) {
        console.error("Error fetching default products:", defaultError);
      } else {
        recommendedProducts = defaultProducts || [];
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
