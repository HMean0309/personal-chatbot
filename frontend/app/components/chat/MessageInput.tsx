'use client';
import { useState } from 'react';
import { Send, FileText } from 'lucide-react';
import AttachmentUploader from './AttachmentUploader';

export default function MessageInput({ onSend, disabled, conversationId }: {
  onSend: (content: string, attachedFiles: string[]) => void;
  disabled: boolean;
  conversationId: string;
}) {
  const [value, setValue] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim(), uploadedFiles);
    setValue('');
    setUploadedFiles([]);
  };

  return (
    <div className="border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#25253a] px-4 py-3">
      {/* Badge file phía trên */}
      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {uploadedFiles.map((name) => (
            <span key={name}
              className="flex items-center gap-1 bg-teal-500/20 text-teal-400 text-xs px-2 py-0.5 rounded-full">
              <FileText size={10} />
              {name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2">
        <AttachmentUploader
          conversationId={conversationId}
          onUploaded={(name) => setUploadedFiles((prev) => [...prev, name])}
        />
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
          placeholder="Message AI Studio..."
          rows={1}
          className="flex-1 bg-transparent resize-none text-sm outline-none max-h-32 text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30"
        />
        <button onClick={handleSend} disabled={disabled || !value.trim()}
          className="bg-gray-900 hover:bg-gray-700 dark:bg-white/10 dark:hover:bg-white/20 disabled:opacity-40 text-white rounded-lg p-2 transition">
          <Send size={16} />
        </button>
      </div>
      <p className="text-xs text-gray-400 dark:text-white/20 text-center mt-1">AI Studio may produce inaccurate information.</p>
    </div>
  );
}