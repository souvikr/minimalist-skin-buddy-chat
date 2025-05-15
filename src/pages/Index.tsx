
import React from 'react';
import Header from '@/components/Header';
import ChatContainer from '@/components/ChatContainer';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col h-screen font-poppins bg-white text-black">
      <Header />
      <main className="flex-1 overflow-hidden">
        <div className={`container mx-auto h-full ${isMobile ? 'px-2 max-w-full' : 'px-4 max-w-3xl'}`}>
          <ChatContainer />
        </div>
      </main>
    </div>
  );
};

export default Index;
