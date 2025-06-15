
import React from 'react';
import Header from './Header';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen w-full bg-calm-gradient flex flex-col">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
};

export default Layout;
