import { useState, useCallback, useRef } from 'react';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/chat';

export function useStreamingChat() {
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    onDone: (finalContent: string, provider: string) => void
  ) => {
    abortRef.current = new AbortController();
    setIsStreaming(true);
    setStreamingContent('');

    let fullContent = '';
    let provider = 'unknown';
    let currentEvent = '';
    let isDone = false;

    const res = await fetch(`${BASE}/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, content }),
      signal: abortRef.current.signal,
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    outer: while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          try {
            const parsed = JSON.parse(data);
            if (currentEvent === 'token' && parsed.content !== undefined) {
              fullContent += parsed.content;
              setStreamingContent(fullContent);
            }
            if (currentEvent === 'done') {
              if (parsed.provider) provider = parsed.provider;
              isDone = true;
              setIsStreaming(false);
              onDone(fullContent, provider);
              break outer;
            }
            if (currentEvent === 'error') {
              isDone = true;
              setIsStreaming(false);
              break outer;
            }
          } catch {}
        }
      }
    }

    // Fallback nếu stream kết thúc không có event done
    if (!isDone) {
        setIsStreaming(false);
        onDone(fullContent, provider);
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { sendMessage, streamingContent, isStreaming, abort };
}