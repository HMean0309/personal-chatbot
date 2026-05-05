'use client';
import { useState } from 'react';
import { useSettings } from '@/app/store/settings.store';
import type { ConversationMode } from '@/app/lib/types';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const {
    defaultMode, privacyMode, systemPrompt, darkMode,
    setDefaultMode, setPrivacyMode, setSystemPrompt, setDarkMode,
  } = useSettings();
  const [prompt, setPrompt] = useState(systemPrompt);

  const modes: ConversationMode[] = ['general', 'coding', 'docs'];

  const handleSave = () => {
    setSystemPrompt(prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg dark:text-white">Global Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">✕</button>
        </div>

        {/* Agent Mode */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Agent Mode</label>
          <div className="flex gap-2 mt-2">
            {modes.map(m => (
              <button key={m}
                onClick={() => setDefaultMode(m)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium capitalize border transition ${
                  defaultMode === m
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400'
                }`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy Mode */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Privacy Mode</div>
            <div className="text-xs text-gray-400">Chỉ dùng LM Studio, không gửi data lên cloud</div>
          </div>
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className={`shrink-0 inline-flex items-center w-11 h-6 rounded-full transition-colors ${privacyMode ? 'bg-teal-500' : 'bg-gray-300'}`}>
            <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${privacyMode ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Dark Mode */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Dark Mode</div>
            <div className="text-xs text-gray-400">Đổi giao diện sang tối</div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`shrink-0 inline-flex items-center w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-teal-500' : 'bg-gray-300'}`}>
            <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* System Prompt */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">System Prompt</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Enter custom instructions..."
            rows={5}
            className="w-full mt-2 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white outline-none focus:border-gray-400 resize-none bg-white dark:bg-gray-700"
          />
          <p className="text-xs text-gray-400 mt-1">Overrides the default agent personality for new conversations.</p>
        </div>

        <button onClick={handleSave}
          className="w-full bg-gray-900 hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 text-white rounded-xl py-2.5 text-sm font-medium transition">
          Save Preferences
        </button>
      </div>
    </div>
  );
}