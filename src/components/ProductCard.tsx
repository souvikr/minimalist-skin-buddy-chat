
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Product } from '@/services/openaiService';

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
      "overflow-hidden w-full flex flex-col transition-all hover:shadow-md h-[360px]",
      'isAlternative' in product && product.isAlternative ? "border-t-2 border-t-amber-500" : ""
    )}>
      {product.image_url && (
        <div className="w-full h-36 overflow-hidden flex items-center justify-center bg-gray-50">
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="h-full object-contain max-w-full"
          />
        </div>
      )}
      <CardHeader className="p-3 pb-0 flex-none">
        <h3 className="font-bold text-sm line-clamp-2 h-10">{product.name}</h3>
        {'isAlternative' in product && product.isAlternative && (
          <span className="text-xs text-amber-600 font-semibold">
            Alternative Recommendation
          </span>
        )}
      </CardHeader>
      <CardContent className="p-3 pt-0 flex-grow overflow-hidden">
        <p className="text-xs text-gray-600 line-clamp-4 h-16">{product.description}</p>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex-none mt-auto">
        <Button 
          variant="outline" 
          className="w-full text-xs h-8"
          onClick={handleViewDetails}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
