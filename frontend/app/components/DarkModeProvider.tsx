'use client';
import { useEffect } from 'react';
import { useSettings } from '@/app/store/settings.store';

export default function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useSettings(s => s.darkMode);

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [darkMode]);

  return <>{children}</>;
}