'use client';


import React from 'react';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  isOnline: boolean;
}

import Logo from './Logo';

export default function Header({ onToggleSidebar, isSidebarOpen, isOnline }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 px-4 md:px-6 py-3 flex items-center justify-between border-b-2.5 border-b-[#111111] dark:border-b-[#ffffff] bg-[#ffffff] dark:bg-[#121318] transition-all duration-300">
      {/* Left: Sidebar Toggle + Title */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && !isSidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl border-2 border-[#111111] dark:border-[#ffffff] text-slate-800 dark:text-slate-100 bg-[#ffffff] dark:bg-[#121318] shadow-[2.5px_2.5px_0px_#111111] dark:shadow-[2.5px_2.5px_0px_#ffffff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1.5px_1.5px_0px_#111111] dark:hover:shadow-[1.5px_1.5px_0px_#ffffff] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-[0px_0px_0px_#111111] transition-all duration-150 cursor-pointer"
            aria-label="Toggle sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        )}

        {!isSidebarOpen && (
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-xl border-2 border-[#111111] dark:border-[#ffffff] bg-[#ffffff] dark:bg-[#121318]">
              <Logo size="sm" className="hover:scale-105 transition-transform duration-300" />
            </div>
            <span className="text-base font-black bg-gradient-to-r from-teal-500 via-sky-500 to-indigo-500 bg-clip-text text-transparent tracking-tight uppercase">
              Medibot
            </span>
          </div>
        )}
      </div>

      {/* Right: Status Indicator */}
      <div className="flex items-center gap-3">
        {/* Status Indicator */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black border-2 border-[#111111] dark:border-[#ffffff] bg-[#ffffff] dark:bg-[#121318] shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#ffffff] ${isOnline
              ? 'text-emerald-600 dark:text-emerald-450'
              : 'text-rose-600 dark:text-rose-455 animate-pulse'
            }`}
        >
          <span className="relative flex h-2 w-2">
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </span>
          <span className="hidden sm:inline font-black tracking-wider uppercase text-[9px]">{isOnline ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
    </header>
  );
}