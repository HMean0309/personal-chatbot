import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConversationMode } from '@/app/lib/types';

interface SettingsState {
  defaultMode: ConversationMode;
  privacyMode: boolean;
  systemPrompt: string;
  userId: string;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  setDefaultMode: (mode: ConversationMode) => void;
  setPrivacyMode: (v: boolean) => void;
  setSystemPrompt: (p: string) => void;
  
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      defaultMode: 'general',
      privacyMode: false,
      systemPrompt: '',
      userId: 'local-user',
      darkMode: false,
      setDarkMode: (darkMode) => set({ darkMode }),
      setDefaultMode: (defaultMode) => set({ defaultMode }),
      setPrivacyMode: (privacyMode) => set({ privacyMode }),
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
    }),
    { name: 'ai-studio-settings' }
  )
);