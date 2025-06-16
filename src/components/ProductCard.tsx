
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Product } from '@/services/openaiService';
import { ExternalLink, Sparkles } from 'lucide-react';

interface ProductProps {
  product: Product | { 
    name: string;
    description: string;
    image_url?: string;
    product_url?: string;
    isAlternative?: boolean;
  };
}

const ProductCard = ({ product }: ProductProps) => {
  const handleViewDetails = () => {
    // Use product URL if available, otherwise fallback to Beminimalist home
    if (product.product_url) {
      window.open(product.product_url, '_blank');
    } else {
      window.open('https://beminimalist.co/', '_blank');
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden w-full flex flex-col transition-all hover:shadow-lg hover:scale-[1.02] h-[380px] md:h-[400px] border-0 shadow-md bg-gradient-to-br from-white to-gray-50",
      'isAlternative' in product && product.isAlternative ? "border-t-4 border-t-amber-400" : ""
    )}>
      {product.image_url && (
        <div className="w-full h-40 md:h-44 overflow-hidden flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="h-full object-contain max-w-full hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <CardHeader className="p-4 pb-2 flex-none">
        <div className="flex items-start gap-2">
          {('isAlternative' in product && product.isAlternative) && (
            <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          )}
          <h3 className="font-bold text-sm md:text-base line-clamp-2 leading-tight">{product.name}</h3>
        </div>
        {'isAlternative' in product && product.isAlternative && (
          <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded-full w-fit">
            Alternative Pick
          </span>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow overflow-hidden">
        <p className="text-xs md:text-sm text-gray-600 line-clamp-4 leading-relaxed">{product.description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex-none mt-auto">
        <Button 
          variant="outline" 
          className="w-full text-xs md:text-sm h-9 hover:bg-black hover:text-white transition-all border-black/20 hover:border-black group"
          onClick={handleViewDetails}
        >
          <span>View Details</span>
          <ExternalLink className="w-3 h-3 ml-2 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
