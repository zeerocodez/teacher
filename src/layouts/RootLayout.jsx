import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ navbar, footer, authModal, chatPanel }) {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-charcoal font-sans overflow-x-hidden relative scroll-smooth antialiased">
      {navbar}
      <main className="flex-1 w-full relative">
        <Suspense fallback={<div className="min-h-[75vh] flex items-center justify-center font-heading font-bold text-brand-moss text-lg animate-pulse">Loading...</div>}>
          <Outlet />
        </Suspense>
      </main>
      {footer}
      {authModal}
      {chatPanel}
      <Toaster position="bottom-right" />
    </div>
  );
}
