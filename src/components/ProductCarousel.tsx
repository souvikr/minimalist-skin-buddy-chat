
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
    <div className="w-full max-w-md">
      <Carousel className="w-full">
        <CarouselContent>
          {products.map((product, index) => (
            <CarouselItem key={product.id || index} className="basis-full md:basis-full h-[360px] px-1">
              <div className="h-full">
                <ProductCard product={product} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};

export default ProductCarousel;
