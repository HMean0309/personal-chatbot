'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/lib/api';
import { useSettings } from '@/app/store/settings.store';
import type { Conversation } from '@/app/lib/types';

export default function SearchInput() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Conversation[]>([]);
  const [open, setOpen] = useState(false);
  const { userId } = useSettings();
  const router = useRouter();

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    const data = await api.searchConversations(userId, q);
    setResults(data);
    setOpen(true);
  };

  return (
    <div className="relative px-3 pb-2">
      <input
        value={query}
        onChange={e => handleSearch(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search chats..."
        className="w-full bg-white/10 text-white/70 placeholder-white/30 text-sm rounded-lg px-3 py-1.5 outline-none focus:bg-white/15 transition"
      />
      {open && results.length > 0 && (
        <div className="absolute left-3 right-3 top-full bg-[#222] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
          {results.map(conv => (
            <div
              key={conv.id}
              onMouseDown={() => { router.push(`/chat/${conv.id}`); setOpen(false); setQuery(''); }}
              className="px-3 py-2 text-sm text-white/70 hover:bg-white/10 cursor-pointer truncate"
            >
              {conv.title || 'Untitled Chat'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}