import type { Metadata } from 'next';
import './globals.css';
import DarkModeProvider from '@/app/components/DarkModeProvider';

export const metadata: Metadata = {
  title: 'AI Studio',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DarkModeProvider>
          {children}
        </DarkModeProvider>
      </body>
    </html>
  );
}