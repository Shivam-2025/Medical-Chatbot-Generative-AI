'use client';

import React, { useState, useRef, useEffect } from 'react';
import ChatInput from '../components/ChatInput';
import SuggestedPrompts from '../components/SuggestedPrompts';
import { 
  sendChatStream, 
  checkBackendStatus,
  uploadPdf,
  BASE_URL
} from '../services/api';
import { Message } from '../components/MessageList';
import Header from '../components/Header';
import MessageList from '../components/MessageList';
import Logo from '../components/Logo';
import LoadingScreen from '../components/LoadingScreen';

/** Local-only conversation model */
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

const initialWelcomeMessage: Message = {
  id: '0',
  sender: 'bot',
  text:
    "Hello! I'm Medibot, your clinical knowledge assistant. I can answer medical and healthcare-related questions by retrieving context from clinical documentation. Please remember, I am an AI assistant and not a medical professional. Always consult with a qualified healthcare provider for any health concerns.",
  timestamp: new Date().toISOString(),
};

const BotIcon = () => (
  <div className="w-8 h-8 flex-shrink-0 select-none animate-fadeIn">
    <Logo size={32} />
  </div>
);

const LoadingIndicator = () => (
  <div className="flex items-start gap-3 md:gap-4 max-w-4xl mx-auto px-4 py-4 w-full">
    <BotIcon />
    <div className="p-3 flex items-center space-x-1.5 bg-slate-50 text-slate-600 dark:bg-slate-900/60 dark:text-slate-300 rounded-2xl border border-slate-100 dark:border-slate-800/40 shadow-sm">
      <span className="w-2.5 h-2.5 bg-sky-500/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2.5 h-2.5 bg-sky-500/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2.5 h-2.5 bg-sky-500/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

/** Sidebar (with delete + document list + upload) */
function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteChat,
  isOpen,
  setIsOpen,
}: {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 md:hidden z-30 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside
        className={`fixed md:relative top-0 left-0 h-full bg-[#ffffff] dark:bg-[#0a0b0d] flex flex-col z-40 transition-all duration-300 overflow-hidden ${
          isOpen
            ? 'w-72 translate-x-0 border-r-2.5 border-r-[#111111] dark:border-r-[#ffffff]'
            : 'w-72 -translate-x-full md:w-0 md:border-r-0'
        }`}
      >
        <div className="flex flex-col h-full w-72">
          {/* Logo / Sidebar Header */}
          <div className="p-4 border-b border-slate-200/20 dark:border-slate-800/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-xl border-2 border-[#111111] dark:border-[#ffffff] bg-[#ffffff] dark:bg-[#121318]">
                <Logo size="sm" className="hover:scale-105 transition-transform duration-300" />
              </div>
              <span className="text-base font-black bg-gradient-to-r from-teal-500 via-sky-500 to-indigo-500 bg-clip-text text-transparent tracking-tight uppercase">
                Medibot
              </span>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-250 hover:text-slate-600 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-3">
            <button
              onClick={onNewChat}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border-2 border-[#111111] dark:border-[#ffffff] bg-[#ffffff] dark:bg-[#121318] text-[#111111] dark:text-[#ffffff] font-extrabold shadow-[3px_3px_0px_#111111] dark:shadow-[3px_3px_0px_#ffffff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#111111] dark:hover:shadow-[2px_2px_0px_#ffffff] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0px_0px_0px_#111111] transition-all duration-150 text-sm cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5H4.5" />
              </svg>
              New Chat
            </button>
          </div>

          {/* CHAT HISTORY SECTION */}
          <div className="flex-1 flex flex-col min-h-0 px-3 py-2">
            <h2 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2 flex-shrink-0">
              Chat History
            </h2>
            {conversations.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-xs italic px-2">No chats yet</p>
            ) : (
              <div className="space-y-1 flex-1 overflow-y-auto pr-1">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 group/chat cursor-pointer border-2 ${
                      activeConversationId === c.id
                        ? 'bg-[#ffffff] dark:bg-[#121318] text-[#111111] dark:text-[#ffffff] border-[#111111] dark:border-[#ffffff] shadow-[2.5px_2.5px_0px_#111111] dark:shadow-[2.5px_2.5px_0px_#ffffff]'
                        : 'text-slate-650 dark:text-slate-400 border-transparent hover:border-[#111111] dark:hover:border-[#ffffff] hover:bg-[#ffffff] dark:hover:bg-[#121318] hover:text-[#111111] dark:hover:text-[#ffffff] hover:shadow-[2px_2px_0px_#111111] dark:hover:shadow-[2px_2px_0px_#ffffff] hover:translate-x-[0.5px] hover:translate-y-[0.5px]'
                    }`}
                  >
                    <div
                      onClick={() => onSelectConversation(c.id)}
                      className="flex-1 truncate flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 opacity-70">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                      <span className="truncate">{c.title}</span>
                    </div>
                    <button
                      onClick={() => onDeleteChat(c.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 md:opacity-0 group-hover/chat:opacity-100 transition-all duration-200"
                      title="Delete chat"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const theme = 'light';
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAppLoading, setIsAppLoading] = useState(true);

  // Screen size detection for responsive sidebar
  useEffect(() => {
    let prevIsMobile = window.innerWidth < 768;
    setIsSidebarOpen(!prevIsMobile);

    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile !== prevIsMobile) {
        setIsSidebarOpen(!isMobile);
        prevIsMobile = isMobile;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Connection state
  const [isBackendOnline, setIsBackendOnline] = useState(true);

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (conversations.length === 0) {
      handleNewChat();
    }
  }, []); // eslint-disable-line

  // Poll backend status — require multiple consecutive failures before showing offline
  // This prevents the UI from flashing "DISCONNECTED" when the backend is just busy with an LLM call
  useEffect(() => {
    let failCount = 0;
    const FAIL_THRESHOLD = 3; // Must fail 3 times in a row to go offline

    const checkStatus = async () => {
      const online = await checkBackendStatus();
      if (online) {
        failCount = 0;
        setIsBackendOnline(true);
      } else {
        failCount++;
        if (failCount >= FAIL_THRESHOLD) {
          setIsBackendOnline(false);
        }
      }
    };
    checkStatus();

    const interval = setInterval(checkStatus, 10000); // Check every 10s instead of 5s

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, isLoading]);

  // ensures <html> remains in light theme and removes any dark class
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Chat message submission
  const handleSendMessage = async (file?: File | null, promptOverride?: string) => {
    const prompt = promptOverride ?? input;
    if (!prompt.trim() && !file) return;
    if (!activeConversationId) return;

    setIsLoading(true);

    // 1. Check if we need to upload an attached file first
    if (file) {
      try {
        const indexingMsgId = (Date.now() + 5).toString();
        const indexingMsg: Message = {
          id: indexingMsgId,
          sender: 'bot',
          text: `⏳ *Indexing attachment "${file.name}"...* Please wait while I load and vector-embed the text.`,
          timestamp: new Date().toISOString(),
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? { ...c, messages: [...c.messages, indexingMsg] }
              : c
          )
        );

        await uploadPdf(file);

        // Update notice to success
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === indexingMsgId
                      ? { ...m, text: `✅ *"${file.name}" successfully indexed!* You can now ask questions referencing this file.` }
                      : m
                  ),
                }
              : c
          )
        );
      } catch (uploadErr: any) {
        console.error(uploadErr);
        const errorMsg: Message = {
          id: (Date.now() + 6).toString(),
          sender: 'bot',
          text: `❌ *Failed to index attachment "${file.name}":* ${uploadErr.message || "Unknown error"}`,
          timestamp: new Date().toISOString(),
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? { ...c, messages: [...c.messages, errorMsg] }
              : c
          )
        );
        setIsLoading(false);
        return;
      }
    }

    if (!prompt.trim()) {
      setIsLoading(false);
      return;
    }

    const fileUrl = file instanceof File ? URL.createObjectURL(file) : undefined;
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: prompt,
      fileUrl,
      fileName: file?.name,
      fileType: file?.type,
      timestamp: new Date().toISOString(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? { ...c, messages: [...c.messages, userMsg] }
          : c
      )
    );

    setInput('');

    const botMsgId = (Date.now() + 1).toString();
    const botMsg: Message = {
      id: botMsgId,
      sender: 'bot',
      text: '',
      timestamp: new Date().toISOString(),
      sources: [],
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? { ...c, messages: [...c.messages, botMsg] }
          : c
      )
    );

    try {
      let accumulatedText = '';
      
      await sendChatStream(
        activeConversationId,
        userMsg.text,
        (chunk: string) => {
          if (!chunk || chunk.trim() === "") return;

          accumulatedText += chunk;
          setIsLoading(false);
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== activeConversationId) return c;
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === botMsgId
                    ? { ...m, text: accumulatedText }
                    : m
                ),
              };
            })
          );
        },
        (sources) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== activeConversationId) return c;
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === botMsgId
                    ? { ...m, sources }
                    : m
                )
              };
            })
          );
        },
        (errorMsg) => {
          // Surface streaming errors in the bot message
          setIsLoading(false);
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== activeConversationId) return c;
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === botMsgId
                    ? { ...m, text: `⚠️ ${errorMsg}` }
                    : m
                ),
              };
            })
          );
        }
      );

      // Post-stream safety: strip any residual <think> tags that slipped through
      if (accumulatedText) {
        const cleaned = accumulatedText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        if (cleaned !== accumulatedText) {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== activeConversationId) return c;
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === botMsgId
                    ? { ...m, text: cleaned }
                    : m
                ),
              };
            })
          );
        }
      }

    } catch (err: any) {
      console.error(err);

      let errorText = '⚠️ Something went wrong. Please try again.';

      if (err.message) {
        try {
          const match = err.message.match(/({.*})/);
          if (match) {
            const parsed = JSON.parse(match[1]);
            if (parsed.detail) {
              errorText = parsed.detail;
            }
          }
        } catch (e) {
          // ignore
        }
      }

      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        sender: 'bot',
        text: errorText,
        timestamp: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, messages: [...c.messages, errorMsg] }
            : c
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newChat: Conversation = {
      id: newId,
      title: 'New Conversation',
      messages: [initialWelcomeMessage],
    };
    setConversations((prev) => [newChat, ...prev]);
    setActiveConversationId(newId);
  };

  const handleDeleteChat = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveConversationId(remaining.length ? remaining[0].id : null);
    }
  };

  const handleSelectConversation = (id: string) => setActiveConversationId(id);

  const showWelcome = activeConversation?.messages.length === 1 && !isLoading;

  return (
    <>
      {isAppLoading && (
        <LoadingScreen theme={theme} onFadeComplete={() => setIsAppLoading(false)} />
      )}
      <div className="flex h-screen w-full font-sans antialiased bg-[#f4f6fa] dark:bg-[#0a0b0d] text-slate-800 dark:text-slate-100 transition-colors duration-200 relative overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main column */}
      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          isOnline={isBackendOnline}
        />

        {/* Connection Offline Warning Banner */}
        {!isBackendOnline && (
          <div className="mx-4 mt-3 p-3.5 bg-[#ffffff] dark:bg-[#121318] border-2 border-[#111111] dark:border-rose-500 text-rose-600 dark:text-rose-455 text-xs text-center font-black animate-fadeIn flex items-center justify-center gap-1.5 rounded-xl shadow-[3px_3px_0px_#e11d48] dark:shadow-[3px_3px_0px_#f43f5e]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4 animate-bounce">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Cannot connect to Medibot Backend. Make sure it is running on {BASE_URL}
          </div>
        )}

        <main className="flex-1 overflow-y-auto flex flex-col bg-[#f4f6fa] dark:bg-[#0a0b0d] transition-colors duration-300 relative pb-32 md:pb-36">
          {showWelcome ? (
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center max-w-3xl mx-auto w-full animate-fadeIn">
              <div className="relative mb-8 hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150 cursor-pointer group">
                <div className="relative w-24 h-24 rounded-2xl bg-[#ffffff] dark:bg-[#121318] border-[2.5px] border-[#111111] dark:border-[#ffffff] flex items-center justify-center shadow-[5px_5px_0px_#0d9488] dark:shadow-[5px_5px_0px_#14b8a6] group-hover:shadow-[3px_3px_0px_#0d9488] dark:group-hover:shadow-[3px_3px_0px_#14b8a6]">
                  <Logo size={60} />
                </div>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-black mb-3.5 tracking-tight bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-900 dark:from-white dark:via-slate-100 dark:to-slate-350 bg-clip-text text-transparent uppercase">
                Clinical Knowledge Bot
              </h2>
              
              <p className="mb-8 text-[13.5px] leading-relaxed text-slate-600 dark:text-slate-400 max-w-lg font-medium">
                Welcome to <span className="font-extrabold text-teal-600 dark:text-teal-400">Medibot</span>. Upload health reference manuals, research papers, or clinical datasets, and ask health-related queries using context-aware vector retrieval.
              </p>
              
              <div className="w-full">
                <SuggestedPrompts
                  onSuggestionClick={(q) => handleSendMessage(undefined, q)}
                />
              </div>
            </div>
          ) : (
            <>
              <MessageList messages={activeConversation?.messages || []} />
              {isLoading && <LoadingIndicator />}
            </>
          )}
          <div ref={endRef} />
        </main>

        <ChatInput
          input={input}
          setInput={setInput}
          sendMessage={(file) => handleSendMessage(file)}
          isLoading={isLoading}
          disabled={!isBackendOnline}
        />
      </div>
    </div>
    </>
  );
}
