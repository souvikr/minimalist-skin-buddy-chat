
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
}

const ProductCarousel = ({ products }: ProductCarouselProps) => {
  return (
    <div className="w-full max-w-lg mx-auto">
      <Carousel className="w-full" opts={{ align: "start", loop: true }}>
        <CarouselContent className="-ml-2 md:-ml-4">
          {products.map((product, index) => (
            <CarouselItem key={product.id || index} className="pl-2 md:pl-4 basis-4/5 md:basis-3/4">
              <div className="h-full">
                <ProductCard product={product} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-center gap-4 mt-4">
          <CarouselPrevious className="relative transform-none translate-x-0 translate-y-0 bg-white border-gray-200 hover:bg-gray-50" />
          <CarouselNext className="relative transform-none translate-x-0 translate-y-0 bg-white border-gray-200 hover:bg-gray-50" />
        </div>
      </Carousel>
    </div>
  );
};

export default ProductCarousel;
