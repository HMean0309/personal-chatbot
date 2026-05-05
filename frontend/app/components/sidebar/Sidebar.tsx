'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/lib/api';
import { useSettings } from '@/app/store/settings.store';
import ConversationList from './ConversationList';
import SearchInput from './SearchInput';
import SettingsModal from '@/app/components/modals/SettingsModal';
import { Settings, User, Plus } from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const { userId, defaultMode, privacyMode } = useSettings();
  const [showSettings, setShowSettings] = useState(false); // ← trong component

  const handleNewChat = async () => {
    const conv = await api.createConversation({
      userId, mode: defaultMode, isPublic: !privacyMode,
    });
    router.push(`/chat/${conv.id}`);
  };

  return (
    <aside className="w-64 bg-[#111] text-white flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <div className="text-teal-400 font-bold text-lg">AI Studio</div>
        <div className="text-xs text-white/40">Pro Workspace</div>
      </div>

      {/* New Conversation */}
      <div className="p-3">
        <button onClick={handleNewChat}
          className="w-full flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-black font-medium rounded-lg px-3 py-2 text-sm transition">
          <Plus size={16} /> New Conversation
        </button>
      </div>

      <SearchInput />
      <ConversationList />

      {/* Bottom nav */}
      <div className="mt-auto border-t border-white/10 p-3 space-y-1">
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 text-white/60 hover:text-white px-2 py-1.5 rounded text-sm w-full">
          <Settings size={15} /> Settings
        </button>
        <div className="flex items-center gap-2 text-white/60 px-2 py-1.5 text-sm">
          <User size={15} /> Account
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </aside>
  );
}