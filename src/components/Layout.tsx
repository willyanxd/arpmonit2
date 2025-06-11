import React from 'react';
import { Navigation } from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}