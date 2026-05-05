'use client';
import { useRef, useState } from 'react';
import { Paperclip, Loader2 } from 'lucide-react';
import { api } from '@/app/lib/api';

const ACCEPTED = '.txt,.md,.ts,.tsx,.js,.jsx,.py,.json,.csv,.html,.css,.sql,.pdf';

interface Props {
  conversationId: string;
  onUploaded?: (fileName: string) => void;
}

export default function AttachmentUploader({ conversationId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      // Use multipart upload for all files (supports PDF + text)
      await api.uploadFile(conversationId, file);
      onUploaded?.(file.name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload thất bại';
      alert(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-white/40 hover:text-white/70 disabled:opacity-30 transition p-1"
        title="Đính kèm file (PDF, text, code...)"
      >
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}