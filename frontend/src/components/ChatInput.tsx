'use client';

import React, { useRef, useState } from 'react';

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  sendMessage: (file?: File | null) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function ChatInput({
  input,
  setInput,
  sendMessage,
  isLoading,
  disabled = false,
}: ChatInputProps) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const handleSend = () => {
    if (isLoading || disabled) return;
    if (!input.trim() && !attachedFile) return;
    sendMessage(attachedFile);
    setAttachedFile(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustHeight = () => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  };

  React.useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const isDisabled = isLoading || disabled;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#f4f6fa] via-[#f4f6fa]/95 to-transparent dark:from-[#0a0b0d] dark:via-[#0a0b0d]/95 dark:to-transparent w-full p-4 md:p-6 md:pb-8 pb-6 transition-all duration-300 pointer-events-none">
      <div className="max-w-4xl mx-auto w-full pointer-events-auto">
        <div className={`relative flex flex-col rounded-xl border-[2.5px] border-[#111111] dark:border-[#ffffff] bg-[#ffffff] dark:bg-[#121318] shadow-[4px_4px_0px_#111111] dark:shadow-[4px_4px_0px_#ffffff] focus-within:translate-x-[1px] focus-within:translate-y-[1px] focus-within:shadow-[3px_3px_0px_#111111] dark:focus-within:shadow-[3px_3px_0px_#ffffff] transition-all duration-150 p-2.5 ${isDisabled ? 'opacity-70 cursor-not-allowed' : ''}`}>
          
          {/* Attached File Preview inside input container */}
          {attachedFile && (
            <div className="flex items-center gap-2.5 p-2 mb-2 bg-[#ffffff] dark:bg-[#16171e] border-2 border-[#111111] dark:border-[#ffffff] rounded-xl max-w-sm animate-fadeIn shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#ffffff]">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-transparent">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate uppercase tracking-tight">{attachedFile.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{formatSize(attachedFile.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:text-rose-500 transition-all duration-150 cursor-pointer"
                title="Remove file"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex items-end gap-2.5">
            {/* Attach File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isDisabled}
              className="p-2.5 rounded-xl border-2 border-[#111111] dark:border-[#ffffff] bg-[#ffffff] dark:bg-[#121318] text-[#111111] dark:text-slate-100 shadow-[2.5px_2.5px_0px_#111111] dark:shadow-[2.5px_2.5px_0px_#ffffff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1.5px_1.5px_0px_#111111] dark:hover:shadow-[1.5px_1.5px_0px_#ffffff] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-[0px_0px_0px_#111111] transition-all duration-150 disabled:opacity-50 cursor-pointer"
              title="Attach PDF book or medical file"
            >
              <svg xmlns="http://www.w3.org/2050/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32a1.5 1.5 0 01-2.121-2.121L16.222 8.4" />
              </svg>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Input Text Area */}
            <textarea
              ref={textAreaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={isDisabled}
              placeholder={disabled ? "Medibot is offline. Waiting for backend connection..." : "Ask Medibot a question (or attach a medical PDF)..."}
              className="flex-1 w-full bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none resize-none max-h-48 py-2 text-sm leading-relaxed"
            />

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={isDisabled || (!input.trim() && !attachedFile)}
              className="p-2.5 border-2 border-[#111111] dark:border-[#ffffff] bg-teal-500 hover:bg-teal-600 text-[#111111] rounded-xl shadow-[3px_3px_0px_#111111] dark:shadow-[3px_3px_0px_#ffffff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#111111] dark:hover:shadow-[2px_2px_0px_#ffffff] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0px_0px_0px_#111111] transition-all duration-150 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              title="Send message"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
