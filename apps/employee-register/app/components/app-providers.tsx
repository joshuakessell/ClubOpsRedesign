'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from '@clubops/ui';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Toaster richColors closeButton position="top-right" />
    </ThemeProvider>
  );
}
