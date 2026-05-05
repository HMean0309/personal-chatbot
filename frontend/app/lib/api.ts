const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/chat';

export const api = {
  createConversation: (data: { userId: string; mode?: string; isPublic?: boolean }) =>
    fetch(`${BASE}/conversations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data }),
    }).then(r => r.json()),

  getConversation: (id: string) =>
    fetch(`${BASE}/conversations/${id}`).then(r => r.json()),

  updateConversation: (id: string, data: object) =>
    fetch(`${BASE}/conversations/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  deleteConversation: (id: string) =>
    fetch(`${BASE}/conversations/${id}`, { method: 'DELETE' }),

  searchConversations: (userId: string, q: string) =>
    fetch(`${BASE}/conversations/search?userId=${userId}&q=${encodeURIComponent(q)}`).then(r => r.json()),
  
  getAllConversations: (userId: string) =>
    fetch(`${BASE}/conversations?userId=${userId}`).then(r => r.json()),

  uploadDocument: (data: {
    conversationId: string;
    fileName: string;
    fileType: string;
    content: string;
  }) =>
    fetch(`${BASE}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  /** Multipart file upload — supports PDF + text files */
  uploadFile: (conversationId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('conversationId', conversationId);
    return fetch(`${BASE}/documents/upload`, {
      method: 'POST',
      body: form,
    }).then((r) => {
      if (!r.ok) return r.json().then((e: { message?: string }) => { throw new Error(e.message || 'Upload failed'); });
      return r.json();
    });
  },
};