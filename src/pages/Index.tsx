
import React from 'react';
import Header from '@/components/Header';
import ChatContainer from '@/components/ChatContainer';

const Index = () => {
  return (
    <div className="flex flex-col h-screen font-poppins bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      <main className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full max-w-4xl px-4 md:px-6">
          <ChatContainer />
        </div>
      </main>
    </div>
  );
};

export default Index;
