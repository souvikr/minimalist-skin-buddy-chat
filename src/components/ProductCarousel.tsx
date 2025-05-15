
import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ProductCard from './ProductCard';
import { Product } from '@/services/openaiService';

interface ProductCarouselProps {
  products: Product[];
  isMobile?: boolean;
}

const ProductCarousel = ({ products, isMobile = false }: ProductCarouselProps) => {
  const cardHeight = isMobile ? "h-[280px]" : "h-[320px]";
  
  return (
    <div className="w-full max-w-md">
      <Carousel className="w-full">
        <CarouselContent>
          {products.map((product, index) => (
            <CarouselItem key={product.id || index} className={`basis-full md:basis-full ${cardHeight} px-1`}>
              <div className="h-full">
                <ProductCard product={product} isMobile={isMobile} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-center gap-2 mt-2">
          <CarouselPrevious className="static translate-y-0 h-6 w-6 sm:h-8 sm:w-8" />
          <CarouselNext className="static translate-y-0 h-6 w-6 sm:h-8 sm:w-8" />
        </div>
      </Carousel>
    </div>
  );
};

export default ProductCarousel;
