
import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ProductCard from './ProductCard';

interface ProductCarouselProps {
  products: {
    name: string;
    description: string;
    image: string;
    isAlternative?: boolean;
  }[];
}

const ProductCarousel = ({ products }: ProductCarouselProps) => {
  return (
    <div className="w-full max-w-xs sm:max-w-md">
      <Carousel className="w-full">
        <CarouselContent>
          {products.map((product, index) => (
            <CarouselItem key={index} className="md:basis-1/2">
              <ProductCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0" />
        <CarouselNext className="right-0" />
      </Carousel>
    </div>
  );
};

export default ProductCarousel;
