
import React from 'react';
import Header from '@/components/Header';
import ChatContainer from '@/components/ChatContainer';

const Index = () => {
  return (
    <div className="flex flex-col h-screen font-poppins bg-white text-black">
      <Header />
      <main className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full max-w-3xl px-4">
          <ChatContainer />
        </div>
      </main>
    </div>
  );
};

export default Index;
