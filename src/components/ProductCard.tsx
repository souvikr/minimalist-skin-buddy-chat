
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Product } from '@/services/openaiService';

interface ProductProps {
  product: Product | { 
    name: string;
    description: string;
    image_url: string;
    product_url?: string;
    isAlternative?: boolean;
  };
}

const ProductCard = ({ product }: ProductProps) => {
  const handleViewDetails = () => {
    // Open the product URL if it exists
    if ('product_url' in product && product.product_url) {
      window.open(product.product_url, '_blank');
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden w-full max-w-[250px] transition-all hover:shadow-md",
      'isAlternative' in product && product.isAlternative ? "border-t-2 border-t-amber-500" : ""
    )}>
      <div className="relative aspect-square w-full overflow-hidden">
        <img 
          src={'image_url' in product ? product.image_url : ''}
          alt={product.name} 
          className="object-cover h-full w-full"
        />
      </div>
      <CardHeader className="p-3">
        <h3 className="font-bold text-sm">{product.name}</h3>
        {'isAlternative' in product && product.isAlternative && (
          <span className="text-xs text-amber-600 font-semibold">
            Alternative Recommendation
          </span>
        )}
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-xs text-gray-600 line-clamp-2">{product.description}</p>
      </CardContent>
      <CardFooter className="p-3 pt-0">
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
