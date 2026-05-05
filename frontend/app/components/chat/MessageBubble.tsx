'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FileText, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '@/app/store/settings.store';
import type { Message } from '@/app/lib/types';

export default function MessageBubble({ message, isStreaming }: {
  message: Message; isStreaming?: boolean;
}) {
  const isUser = message.role === 'user';
  const darkMode = useSettings(s => s.darkMode);
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedBlock(id);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
        isUser
          ? 'bg-gray-800 text-white rounded-br-sm dark:bg-gray-700'
          : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm'
      }`}>
        {isUser && message.attachedFiles && message.attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1">
            {message.attachedFiles.map((name) => (
              <span key={name}
                className="flex items-center gap-1 bg-teal-500/20 text-teal-400 text-xs px-2 py-0.5 rounded-full">
                <FileText size={10} />
                {name}
              </span>
            ))}
          </div>
        )}
        <ReactMarkdown remarkPlugins={[remarkGfm]}
          components={{
            code: ({ children, className, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              const codeString = String(children).replace(/\n$/, '');
              const blockId = `${match?.[1] || 'code'}-${codeString.slice(0, 20)}`;

              if (match) {
                return (
                  <div className="relative group my-2 -mx-1">
                    {/* Header bar */}
                    <div className="flex items-center justify-between bg-gray-950 dark:bg-gray-950 text-gray-400 text-xs px-4 py-1.5 rounded-t-lg font-mono">
                      <span>{match[1]}</span>
                      <button
                        onClick={() => handleCopy(codeString, blockId)}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        {copiedBlock === blockId
                          ? <><Check size={12} /> Copied!</>
                          : <><Copy size={12} /> Copy</>
                        }
                      </button>
                    </div>
                    <SyntaxHighlighter
                      style={darkMode ? oneDark : oneLight}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                        borderBottomLeftRadius: '0.5rem',
                        borderBottomRightRadius: '0.5rem',
                        fontSize: '0.75rem',
                      }}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  </div>
                );
              }

              // Inline code
              return (
                <code className={`${className || ''} bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 text-xs font-mono`} {...props}>
                  {children}
                </code>
              );
            },
            pre: ({ children }) => <>{children}</>,
          }}>
          {message.content}
        </ReactMarkdown>
        {isStreaming && <span className="animate-pulse ml-1">▍</span>}
        {!isUser && message.provider && (
          <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">via {message.provider}</div>
        )}
      </div>
    </div>
  );
}