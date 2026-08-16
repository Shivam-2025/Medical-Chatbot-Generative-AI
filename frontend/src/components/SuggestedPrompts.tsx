'use client';

import React from 'react';

const HeartIcon = () => (
  <div className="p-2.5 rounded-xl border-2 border-[#111111] dark:border-[#ffffff] bg-[#ffffff] dark:bg-[#121318] text-rose-500 dark:text-rose-400 group-hover:scale-105 transition-all duration-150">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  </div>
);

const EcgIcon = () => (
  <div className="p-2.5 rounded-xl border-2 border-[#111111] dark:border-[#ffffff] bg-[#ffffff] dark:bg-[#121318] text-teal-500 dark:text-teal-400 group-hover:scale-105 transition-all duration-150">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  </div>
);

const MoonIcon = () => (
  <div className="p-2.5 rounded-xl border-2 border-[#111111] dark:border-[#ffffff] bg-[#ffffff] dark:bg-[#121318] text-indigo-500 dark:text-indigo-400 group-hover:scale-105 transition-all duration-150">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className="w-5 h-5">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  </div>
);

interface Prompt {
  title: string;
  question: string;
  icon: React.ReactNode;
  shadowClass: string;
  hoverTextClass: string;
}

interface SuggestedPromptsProps {
  onSuggestionClick: (suggestion: string) => void;
}

const prompts: Prompt[] = [
  {
    title: 'Heart Attack Symptoms',
    question: 'What are the common symptoms of a heart attack?',
    icon: <HeartIcon />,
    shadowClass: 'shadow-[4px_4px_0px_#e11d48] dark:shadow-[4px_4px_0px_#f43f5e] hover:shadow-[2px_2px_0px_#e11d48] dark:hover:shadow-[2px_2px_0px_#f43f5e] active:shadow-[0px_0px_0px_#e11d48]',
    hoverTextClass: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
  },
  {
    title: 'Type 1 vs Type 2 Diabetes',
    question: 'Explain the difference between Type 1 and Type 2 diabetes.',
    icon: <EcgIcon />,
    shadowClass: 'shadow-[4px_4px_0px_#0d9488] dark:shadow-[4px_4px_0px_#14b8a6] hover:shadow-[2px_2px_0px_#0d9488] dark:hover:shadow-[2px_2px_0px_#14b8a6] active:shadow-[0px_0px_0px_#0d9488]',
    hoverTextClass: 'group-hover:text-teal-600 dark:group-hover:text-teal-400',
  },
  {
    title: 'Improving Sleep Quality',
    question: 'What are some effective ways to improve sleep quality?',
    icon: <MoonIcon />,
    shadowClass: 'shadow-[4px_4px_0px_#4f46e5] dark:shadow-[4px_4px_0px_#6366f1] hover:shadow-[2px_2px_0px_#4f46e5] dark:hover:shadow-[2px_2px_0px_#6366f1] active:shadow-[0px_0px_0px_#4f46e5]',
    hoverTextClass: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
  },
];

export default function SuggestedPrompts({ onSuggestionClick }: SuggestedPromptsProps) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-white dark:bg-[#121318] p-5 rounded-2xl border-[2.5px] border-[#111111] dark:border-[#ffffff] shadow-[4px_4px_0px_#111111] dark:shadow-[4px_4px_0px_#ffffff]">
        {prompts.map((p) => (
          <button
            key={p.title}
            onClick={() => onSuggestionClick(p.question)}
            className={`group text-left p-5 transition-all duration-150 rounded-xl border-2 border-[#111111] dark:border-[#ffffff] bg-[#ffffff] dark:bg-[#16171e] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] cursor-pointer ${p.shadowClass}`}
          >
            <div className="mb-4 flex items-center">{p.icon}</div>
            <p className={`font-black text-slate-800 dark:text-slate-100 text-sm mb-1.5 transition-colors uppercase tracking-tight ${p.hoverTextClass}`}>
              {p.title}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {p.question}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
