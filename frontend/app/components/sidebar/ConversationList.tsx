'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/app/lib/api';
import { useSettings } from '@/app/store/settings.store';
import type { Conversation } from '@/app/lib/types';

export const refreshConversations = () => {
  window.dispatchEvent(new CustomEvent('refresh-conversations'));
};

export default function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const { userId } = useSettings();
  const router = useRouter();
  const pathname = usePathname();

  const fetchConversations = useCallback(async () => {
    try {
      const data = await api.getAllConversations(userId);
      setConversations(Array.isArray(data) ? data : []);
    } catch {
      setConversations([]);
    }
  }, [userId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, pathname]);

  useEffect(() => {
    window.addEventListener('refresh-conversations', fetchConversations);
    return () => window.removeEventListener('refresh-conversations', fetchConversations);
  }, [fetchConversations]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await api.deleteConversation(id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (pathname.includes(id)) router.push('/chat');
  };

  const handleStartEdit = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title || '');
  };

  const handleRename = async (id: string) => {
    const trimmed = editTitle.trim();
    if (trimmed) {
      await api.updateConversation(id, { title: trimmed });
      setConversations(prev =>
        prev.map(c => (c.id === id ? { ...c, title: trimmed } : c))
      );
    }
    setEditingId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto px-2 py-1">
      <p className="text-xs text-white/30 px-2 py-1 uppercase tracking-wider">Recents</p>
      {conversations.length === 0 && (
        <p className="text-xs text-white/20 px-2 py-1">No conversations yet</p>
      )}
      {conversations.map(conv => {
        const isActive = pathname.includes(conv.id);
        return (
          <div
            key={conv.id}
            onClick={() => editingId !== conv.id && router.push(`/chat/${conv.id}`)}
            className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-sm transition ${
              isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            {editingId === conv.id ? (
              <input
                autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRename(conv.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onBlur={() => handleRename(conv.id)}
                onClick={e => e.stopPropagation()}
                className="bg-transparent border-b border-white/50 text-white text-sm w-full outline-none mr-2"
              />
            ) : (
              <span
                className="truncate flex-1"
                onDoubleClick={e => handleStartEdit(e, conv)}
              >
                {conv.title || 'Untitled Chat'}
              </span>
            )}

            {editingId !== conv.id && (
              <button
                onClick={e => handleDelete(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 text-xs px-1 transition"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}