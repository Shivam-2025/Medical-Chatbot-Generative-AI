'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Logo from './Logo';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  timestamp?: string | number;
  sources?: Array<{
    title?: string;
    page?: number;
    paragraph?: string;
    snippet?: string;
  }>;
}

interface MessageListProps {
  messages: Message[];
}

const BotAvatar = () => (
  <div className="w-9 h-9 rounded-xl border-2 border-[#111111] dark:border-[#ffffff] bg-[#ffffff] dark:bg-[#121318] shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#ffffff] flex items-center justify-center flex-shrink-0 select-none animate-fadeIn p-0.5">
    <Logo size={28} />
  </div>
);

const UserAvatar = () => (
  <div className="w-9 h-9 rounded-xl border-2 border-[#111111] dark:border-[#ffffff] bg-[#ffffff] dark:bg-[#121318] text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#ffffff] flex-shrink-0 select-none animate-fadeIn">
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  </div>
);

const FileChip = ({ name, url }: { name: string; url?: string }) => (
  <a
    href={url}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-[#111111] dark:border-[#ffffff] bg-[#ffffff] dark:bg-[#121318] text-slate-800 dark:text-slate-200 text-xs font-black shadow-[2.5px_2.5px_0px_#111111] dark:shadow-[2.5px_2.5px_0px_#ffffff] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_#111111] dark:hover:shadow-[1.5px_1.5px_0px_#ffffff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_#111111] transition-all duration-150"
    title={name}
  >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-teal-500">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
    <span className="truncate max-w-[12rem] uppercase tracking-tight text-[10px]">{name}</span>
  </a>
);

// Auto-fixes AI formatting mistakes before display
function enforceStructure(raw: string): string {
  if (!raw) return raw;

  let txt = raw;

  // Strip any <think>...</think> reasoning blocks from the model
  txt = txt.replace(/<think>[\s\S]*?<\/think>/g, '');

  // Remove empty standalone bullets
  txt = txt.replace(/^\s*[•\-*]\s*$/gm, "");

  // Normalize double-star headings
  txt = txt.replace(/\*\*\s*(.*?)\s*\*\*/g, "**$1**");

  // Ensure headings (lines consisting only of bold text) start on new lines
  txt = txt.replace(/([^\n])\n([ \t]*\*\*[^*\n]+\*\*[ \t]*:?[ \t]*)(?=\n|$)/g, "$1\n\n$2");

  // Ensure headings are followed by a newline
  txt = txt.replace(/^([ \t]*\*\*[^*\n]+\*\*[ \t]*:?[ \t]*)\n([^\n])/gm, "$1\n\n$2");

  // Convert "Heading- Label:" into proper bullet lists
  txt = txt.replace(
    /([A-Za-z0-9\(\)\s]+)-\s*(Cause|Symptoms?|Management|Treatment|Summary)\s*:/gi,
    "**$1**\n- **$2:**"
  );

  // Convert glued bullets into real markdown bullets
  txt = txt.replace(/([a-z0-9])\.\s*-\s+/gi, "$1.\n- ");

  // Fix bullets smashed together
  txt = txt.replace(/-\s*(?=[A-Za-z])/g, "- ");

  // Add missing newline before bullets: "Text- Something"
  txt = txt.replace(/([a-z])-\s+\*\*/gi, "$1\n- **");

  // Fix medically broken words
  txt = txt.replace(/\bur\s*ination\b/gi, "urination");
  txt = txt.replace(/\bauto\s*immune\b/gi, "autoimmune");
  txt = txt.replace(/\bun\s*int\s*ended\b/gi, "unintended");
  txt = txt.replace(/\bbl\s*urred\b/gi, "blurred");

  return txt.trim();
}

function safeDateFrom(ts?: string | number): Date | null {
  if (!ts) return null;
  if (typeof ts === 'number') {
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const trimmed = ts.trim();
  if (/^-?\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    const d = new Date(num);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageList({ messages }: MessageListProps) {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 px-4 py-6">
      {messages.map((m) => {
        const isUser = m.sender === 'user';
        const isImage = m.fileUrl && (m.fileType?.startsWith('image/') ?? false);
        const d = safeDateFrom(m.timestamp);

        // Hide empty bot bubbles — only show when there's actual text content
        if (m.sender === "bot" && (m.text || "").trim() === "") {
          return null;
        }

        return (
          <div
            key={m.id}
            className={`flex items-start gap-3 md:gap-4 ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
          >
            {!isUser && <BotAvatar />}

            <div className="flex flex-col max-w-xl md:max-w-2xl">
              <div
                className={`relative group py-4 text-sm leading-relaxed break-words rounded-xl transition-all duration-150 ${
                  isUser
                    ? 'px-5 bg-sky-50 dark:bg-[#161d2a] text-slate-800 dark:text-slate-100 rounded-tr-none self-end border-[2.5px] border-[#111111] dark:border-[#ffffff] shadow-[4px_4px_0px_#4f46e5] dark:shadow-[4px_4px_0px_#6366f1]'
                    : 'pl-6 pr-5 bg-[#ffffff] dark:bg-[#121318] text-slate-800 dark:text-slate-100 rounded-tl-none self-start border-[2.5px] border-[#111111] dark:border-[#ffffff] border-l-[6px] border-l-teal-500 dark:border-l-teal-450 shadow-[4px_4px_0px_#111111] dark:shadow-[4px_4px_0px_#ffffff]'
                }`}
              >
                {m.fileUrl && (
                  <div className="mb-3">
                    {isImage ? (
                      <img
                        src={m.fileUrl}
                        alt={m.fileName || 'attachment'}
                        className="rounded-xl max-w-xs max-h-60 object-contain border-2 border-[#111111] dark:border-[#ffffff] shadow-[2.5px_2.5px_0px_#111111] dark:shadow-[2.5px_2.5px_0px_#ffffff]"
                      />
                    ) : (
                      <FileChip name={m.fileName || 'attachment'} url={m.fileUrl} />
                    )}
                  </div>
                )}

                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-base font-extrabold mt-3 mb-1.5 text-slate-900 dark:text-white leading-snug">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-sm font-extrabold mt-2.5 mb-1 text-slate-900 dark:text-white leading-snug">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold mt-2.5 mb-1 text-slate-800 dark:text-slate-200 leading-snug">{children}</h3>,
                    p: ({ children }) => <p className="my-1.5 leading-relaxed text-[13.5px]">{children}</p>,
                    ul: ({ children }) => (
                      <ul className="ml-4 my-1.5 list-disc space-y-1 text-[13.5px]">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="ml-4 my-1.5 list-decimal space-y-1 text-[13.5px]">{children}</ol>
                    ),
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => <strong className="font-bold text-slate-950 dark:text-white">{children}</strong>,
                    code: ({ children }) => <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 text-xs font-mono">{children}</code>,
                  }}
                  className="prose dark:prose-invert max-w-none [&>*]:my-1.5"
                >
                  {enforceStructure(m.text || '')}
                </ReactMarkdown>

              </div>

              {d && (
                <span
                  className={`mt-1 text-[10px] font-medium text-slate-400 dark:text-slate-500 ${
                    isUser ? 'text-right pr-1' : 'text-left pl-1'
                  }`}
                  title={d.toLocaleString()}
                >
                  {fmtTime(d)}
                </span>
              )}
            </div>

            {isUser && <UserAvatar />}
          </div>
        );
      })}
    </div>
  );
}
