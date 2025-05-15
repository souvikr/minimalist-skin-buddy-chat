
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
      let matchedProducts = [];
      
      // Try to find exact matches first
      for (const productName of extractedProductNames) {
        const { data: exactMatches, error: exactMatchError } = await supabase
          .from('products')
          .select('*')
          .ilike('name', productName)
          .limit(1);
          
        if (!exactMatchError && exactMatches && exactMatches.length > 0) {
          matchedProducts.push(...exactMatches);
        }
      }
      
      // If we couldn't find exact matches, try fuzzy matching
      if (matchedProducts.length === 0) {
        const searchTerms = extractedProductNames.map(name => {
          // Split product name into meaningful terms
          return name.split(' ')
            .filter(term => term.length > 2) // Only use terms with more than 2 chars
            .map(term => term.trim());
        }).flat();
        
        // Create a query to find products containing any of the search terms
        if (searchTerms.length > 0) {
          let query = supabase.from('products').select('*');
          
          // Build OR conditions for each search term
          searchTerms.forEach((term, index) => {
            if (index === 0) {
              query = query.ilike('name', `%${term}%`);
            } else {
              query = query.or(`name.ilike.%${term}%`);
            }
          });
          
          const { data: fuzzyMatches, error: fuzzyMatchError } = await query.limit(3);
          
          if (!fuzzyMatchError && fuzzyMatches && fuzzyMatches.length > 0) {
            matchedProducts = fuzzyMatches;
          }
        }
      }
      
      // If we still don't have products, use the keywords from user message to find relevant products
      if (matchedProducts.length === 0) {
        // Extract keywords from user message
        const keywords = message.toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 3) // Only use meaningful words
          .map(word => word.replace(/[^\w]/g, '')); // Remove non-alphanumeric chars
          
        if (keywords.length > 0) {
          const { data: relevantProducts, error: relevantError } = await supabase
            .from('products')
            .select('*, skin_concerns, key_ingredients, description')
            .limit(10);
            
          if (!relevantError && relevantProducts && relevantProducts.length > 0) {
            // Score products by matching concerns, ingredients, and description
            const scoredProducts = relevantProducts.map(product => {
              let score = 0;
              
              // Score based on skin concerns
              if (product.skin_concerns) {
                keywords.forEach(keyword => {
                  if (product.skin_concerns.some((concern: string) => 
                    concern.toLowerCase().includes(keyword))) {
                    score += 5;
                  }
                });
              }
              
              // Score based on key ingredients
              if (product.key_ingredients) {
                keywords.forEach(keyword => {
                  if (product.key_ingredients.some((ingredient: string) => 
                    ingredient.toLowerCase().includes(keyword))) {
                    score += 3;
                  }
                });
              }
              
              // Score based on description
              if (product.description) {
                keywords.forEach(keyword => {
                  if (product.description.toLowerCase().includes(keyword)) {
                    score += 2;
                  }
                });
              }
              
              return { ...product, score };
            });
            
            // Sort by score and take top 3
            matchedProducts = scoredProducts
              .sort((a, b) => b.score - a.score)
              .slice(0, 3);
          }
        }
      }
      
      if (matchedProducts && matchedProducts.length > 0) {
        recommendedProducts = matchedProducts;
      }
    }
    
    // If we still don't have 3 products, get random products to fill the gap
    if (recommendedProducts.length < 3) {
      const numMissing = 3 - recommendedProducts.length;
      const { data: defaultProducts, error: defaultError } = await supabase
        .from('products')
        .select('*')
        .limit(numMissing)
        .order('id', { ascending: false });
        
      if (!defaultError && defaultProducts && defaultProducts.length > 0) {
        // Ensure we don't duplicate products already in recommendedProducts
        const existingIds = recommendedProducts.map(p => p.id);
        const filteredDefaults = defaultProducts.filter(p => !existingIds.includes(p.id));
        recommendedProducts = [...recommendedProducts, ...filteredDefaults].slice(0, 3);
      }
    }
    
    // Ensure we have product data to return
    if (recommendedProducts.length === 0) {
      const { data: finalFallback, error: fallbackError } = await supabase
        .from('products')
        .select('*')
        .limit(3);
        
      if (!fallbackError && finalFallback && finalFallback.length > 0) {
        recommendedProducts = finalFallback;
      }
    }
    
    console.log("Returning products:", recommendedProducts.length);
    
    return new Response(
      JSON.stringify({ 
        response: aiResponse, 
        products: recommendedProducts 
      }),
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
