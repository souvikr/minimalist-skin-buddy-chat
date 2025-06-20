
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

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

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Enhanced prompt for better skincare routine responses
    const messages = [
      {
        role: 'system',
        content: `You're a professional skincare consultant specializing in minimalist routines. 

RESPONSE STRUCTURE:
1. First, provide a complete skincare routine (morning and evening steps)
2. Then recommend 3 specific products

FORMATTING RULES:
- Use ** around product names (e.g. **Niacinamide 10%**)
- Structure routines with clear Morning/Evening sections
- Number each step (1., 2., 3.)
- Use bullet points for tips
- Be specific about when to use each product

ROUTINE GUIDELINES:
- Keep routines simple (3-4 steps max)
- Always include cleanser and moisturizer
- Add sunscreen for morning
- Suggest active ingredients based on concerns
- Provide timing instructions

PRODUCT RECOMMENDATIONS:
- Recommend exactly 3 products that match the routine
- Focus on key ingredients for their concerns
- Include gentle options for sensitive skin
- Explain why each product helps

CONCERNS TO ADDRESS:
- Acne: Salicylic Acid, Niacinamide
- Pigmentation: Vitamin C, Alpha Arbutin
- Aging: Retinol, Peptides
- Hydration: Hyaluronic Acid, Ceramides
- Sensitivity: Gentle formulas, no fragrance

Be encouraging and realistic about results (4-8 weeks for improvement).`
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
            { type: 'text', text: message || "Please analyze this skin concern and provide a complete skincare routine with product recommendations." },
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
    let userKeywords = [];
    
    // Extract keywords from user message to use as fallback
    if (message) {
      // Split message into words and filter out common words
      const commonWords = ['and', 'or', 'the', 'a', 'an', 'for', 'with', 'without', 'is', 'are', 'in', 'on', 'at', 'to', 'of', 'my', 'i', 'have', 'has', 'had', 'need', 'want'];
      userKeywords = message.toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.includes(word));
    }
    
    console.log("Checking products table access...");
    
    if (productMatches && productMatches.length > 0) {
      // Extract product names without the asterisks
      const extractedProductNames = productMatches.map(match => 
        match.replace(/\*\*/g, '')
      );
      
      console.log("Extracted product names:", extractedProductNames);
      
      // First try exact matches
      for (const name of extractedProductNames) {
        if (recommendedProducts.length >= 3) break;
        
        // Try to find exact match first
        const { data: exactMatches, error: exactError } = await supabase
          .from('products')
          .select('*')
          .ilike('name', `%${name}%`)
          .limit(1);
          
        if (!exactError && exactMatches && exactMatches.length > 0) {
          recommendedProducts.push(exactMatches[0]);
        }
      }
      
      // If we don't have 3 products yet, look for partial matches
      if (recommendedProducts.length < 3) {
        for (const name of extractedProductNames) {
          if (recommendedProducts.length >= 3) break;
          
          // Try matching keywords from the product name
          const keywords = name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
          
          for (const keyword of keywords) {
            if (recommendedProducts.length >= 3) break;
            
            const { data: keywordMatches, error: keywordError } = await supabase
              .from('products')
              .select('*')
              .or(`name.ilike.%${keyword}%, description.ilike.%${keyword}%`)
              .limit(3 - recommendedProducts.length);
              
            if (!keywordError && keywordMatches && keywordMatches.length > 0) {
              for (const product of keywordMatches) {
                // Check if product is not already in recommendedProducts
                if (!recommendedProducts.some(p => p.id === product.id)) {
                  recommendedProducts.push(product);
                  if (recommendedProducts.length >= 3) break;
                }
              }
            }
          }
        }
      }
    }
    
    // If we still don't have 3 products, use user keywords
    if (recommendedProducts.length < 3 && userKeywords.length > 0) {
      console.log("Using user keywords:", userKeywords);
      
      for (const keyword of userKeywords) {
        if (recommendedProducts.length >= 3) break;
        
        const { data: keywordMatches, error: keywordError } = await supabase
          .from('products')
          .select('*')
          .or(`name.ilike.%${keyword}%, description.ilike.%${keyword}%`)
          .limit(3 - recommendedProducts.length);
          
        if (!keywordError && keywordMatches && keywordMatches.length > 0) {
          for (const product of keywordMatches) {
            // Check if product is not already in recommendedProducts
            if (!recommendedProducts.some(p => p.id === product.id)) {
              recommendedProducts.push(product);
              if (recommendedProducts.length >= 3) break;
            }
          }
        }
      }
    }
    
    // If we still don't have enough products, get popular ones as fallback
    if (recommendedProducts.length < 3) {
      const { data: defaultProducts, error: defaultError } = await supabase
        .from('products')
        .select('*')
        .limit(3 - recommendedProducts.length)
        .order('name', { ascending: true });
      
      if (!defaultError && defaultProducts && defaultProducts.length > 0) {
        for (const product of defaultProducts) {
          // Check if product is not already in recommendedProducts
          if (!recommendedProducts.some(p => p.id === product.id)) {
            recommendedProducts.push(product);
          }
        }
      }
    }
    
    console.log(`Found ${recommendedProducts.length} products to recommend`);
    
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
