import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  theme: 'light' | 'dark';
  onFadeComplete: () => void;
}

export default function LoadingScreen({ theme, onFadeComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const statusMessages = [
    "Establishing connection to Medibot AI...",
    "Syncing vectorized medical indexes...",
    "Loading clinical knowledge graph...",
    "Activating medical inference engine...",
    "Medibot is ready!"
  ];

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2400; // 2.4 seconds total duration
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const calculatedProgress = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(calculatedProgress);
      
      // Determine status text index based on progress
      if (calculatedProgress < 25) {
        setStatusIndex(0);
      } else if (calculatedProgress < 50) {
        setStatusIndex(1);
      } else if (calculatedProgress < 75) {
        setStatusIndex(2);
      } else if (calculatedProgress < 95) {
        setStatusIndex(3);
      } else {
        setStatusIndex(4);
      }
      
      if (elapsed >= duration) {
        clearInterval(interval);
      }
    }, 30);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => {
        setIsVisible(false); // start fade out animation
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [progress]);

  const handleTransitionEnd = () => {
    if (!isVisible) {
      onFadeComplete();
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out select-none overflow-hidden ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      } ${
        isDark 
          ? 'bg-[#07080e] text-white' 
          : 'bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#edf2f7] text-slate-800'
      }`}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* Background Dots Overlay */}
      <div className="absolute inset-0 bg-dots pointer-events-none opacity-40 dark:opacity-20" />

      {/* Theme background glowing orbs - now with slow float animations */}
      {isDark ? (
        <>
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-[#0d9488]/15 to-[#06b6d4]/5 rounded-full blur-[110px] pointer-events-none animate-float-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-[#4f46e5]/15 to-[#6366f1]/5 rounded-full blur-[110px] pointer-events-none animate-float-delay" />
        </>
      ) : (
        <>
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-[#0d9488]/8 to-[#06b6d4]/3 rounded-full blur-[110px] pointer-events-none animate-float-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-[#4f46e5]/8 to-[#6366f1]/3 rounded-full blur-[110px] pointer-events-none animate-float-delay" />
        </>
      )}

      {/* Card Wrapper (Premium Glassmorphism) */}
      <div 
        className={`relative p-8 md:p-10 rounded-3xl w-[90%] max-w-md flex flex-col items-center gap-6 transition-all duration-500 z-10 ${
          isDark 
            ? 'border border-white/10 shadow-[0_25px_60px_-15px_rgba(20,184,166,0.25)] bg-[#0c0d12]/80 backdrop-blur-xl' 
            : 'border border-slate-200/50 shadow-[0_30px_70px_-15px_rgba(13,148,136,0.12)] bg-white/75 backdrop-blur-xl'
        }`}
      >
        
        {/* System Status Tag - Sleek capsule badge */}
        <div 
          className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider select-none ${
            isDark 
              ? 'border-teal-500/30 text-teal-400 bg-teal-950/40 backdrop-blur-md' 
              : 'border-teal-200/60 text-teal-700 bg-teal-50/70 backdrop-blur-md'
          }`}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500"></span>
          </span>
          <span>SYSTEM RUNNING</span>
        </div>

        {/* Ambient background glow inside the card */}
        <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-2xl animate-pulse pointer-events-none ${
          isDark ? 'bg-gradient-to-tr from-teal-500/15 to-indigo-500/15' : 'bg-gradient-to-tr from-teal-500/8 to-indigo-500/8'
        }`} />

        {/* Large Animated SVG Logo */}
        <div className="w-28 h-28 relative z-10 flex items-center justify-center">
          <svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full filter drop-shadow-[0_8px_16px_rgba(13,148,136,0.08)]"
          >
            <defs>
              <linearGradient id="shieldGradLoading" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" /> {/* sky-500 */}
                <stop offset="50%" stopColor="#06b6d4" /> {/* cyan-500 */}
                <stop offset="100%" stopColor="#14b8a6" /> {/* teal-500 */}
              </linearGradient>
              
              <linearGradient id="dnaGradLoading" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" /> {/* indigo-500 */}
                <stop offset="50%" stopColor="#8b5cf6" /> {/* violet-500 */}
                <stop offset="100%" stopColor="#3b82f6" /> {/* blue-500 */}
              </linearGradient>

              <linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              
              {/* Light mode cross: vibrant teal to indigo */}
              <linearGradient id="crossGradLight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>

              {/* Dark mode cross: bright white to soft teal */}
              <linearGradient id="crossGradDark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#ccfbf1" />
              </linearGradient>

              <filter id="glowFilterLoading" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Concentric Ring 1 (Outer - Clockwise) */}
            <circle 
              cx="60" 
              cy="60" 
              r="52" 
              stroke="url(#dnaGradLoading)" 
              strokeWidth="1.5" 
              strokeDasharray="8 6" 
              className="opacity-30" 
              style={{ 
                transformOrigin: 'center', 
                animation: 'spin 16s linear infinite'
              }}
            />

            {/* Concentric Ring 2 (Inner - Counter Clockwise) */}
            <circle 
              cx="60" 
              cy="60" 
              r="46" 
              stroke="url(#shieldGradLoading)" 
              strokeWidth="1.5" 
              strokeDasharray="4 4" 
              className="opacity-45" 
              style={{ 
                transformOrigin: 'center', 
                animation: 'spin 10s linear infinite reverse'
              }}
            />
            
            {/* DNA Helix strand 1 - swirling path (highly subtle background watermark) */}
            <path 
              d="M28 60 C 28 35, 92 35, 92 60 C 92 85, 28 85, 28 60 Z" 
              stroke="url(#dnaGradLoading)" 
              strokeWidth="1.2" 
              className="opacity-20"
            />

            {/* DNA Helix strand 2 - offset swirling path */}
            <path 
              d="M28 60 C 28 85, 92 85, 92 60 C 92 35, 28 35, 28 60 Z" 
              stroke="url(#shieldGradLoading)" 
              strokeWidth="1" 
              strokeDasharray="2 2"
              className="opacity-20"
            />

            {/* DNA base-pair links (connecting dots) */}
            <circle cx="44" cy="46" r="1.5" fill="#6366f1" className="opacity-30" />
            <circle cx="76" cy="74" r="1.5" fill="#6366f1" className="opacity-30" />
            <circle cx="44" cy="74" r="1.5" fill="#06b6d4" className="opacity-30" />
            <circle cx="76" cy="46" r="1.5" fill="#06b6d4" className="opacity-30" />
            
            {/* Shield Outer Ring */}
            <path 
              d="M60 18 C78 18, 92 24, 92 34 C92 72, 60 98, 60 98 C60 98, 28 72, 28 34 C28 24, 42 18, 60 18 Z" 
              fill="url(#shieldGradLoading)" 
              fillOpacity={isDark ? "0.08" : "0.04"} 
              stroke="url(#shieldGradLoading)" 
              strokeWidth="2" 
              className="filter drop-shadow-sm opacity-80"
            />

            {/* Medical Cross - pulses with glow */}
            <g filter="url(#glowFilterLoading)" className="animate-pulse" style={{ animationDuration: '2.5s' }}>
              {/* Glowing teal background cross */}
              <path 
                d="M52 38h16v12h12v16H68v12H52V66H40V50h12V38z" 
                fill="url(#shieldGradLoading)" 
                fillOpacity={isDark ? "0.6" : "0.15"} 
              />
              {/* Crisp front cross */}
              <path 
                d="M54 40h12v12h12v12H66v12H54V64H42V52h12V40z" 
                fill={isDark ? "url(#crossGradDark)" : "url(#crossGradLight)"} 
              />
            </g>

            {/* ECG Heartbeat pulse line - draws dynamically */}
            <path 
              d="M20 60 H40 L45 42 L52 76 L59 48 L64 64 L68 60 H100" 
              stroke="url(#ecgGrad)" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="animate-pulse-dash"
            />
            
            {/* Pulsing point at start and ping at end */}
            <circle cx="20" cy="60" r="2" fill="#3b82f6" className="opacity-80" />
            <circle 
              cx="100" 
              cy="60" 
              r="2.5" 
              fill="#6366f1" 
              className="animate-ping" 
              style={{ transformOrigin: '100px 60px' }} 
            />
          </svg>
        </div>

        {/* Brand Title */}
        <div className="text-center z-10">
          <h2 className={`text-xl font-extrabold tracking-widest uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Medibot Portal
          </h2>
          <p className={`text-[9px] font-bold tracking-widest uppercase mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-450'}`}>
            Clinical AI Knowledge Network
          </p>
        </div>

        {/* Progress Bar Container - Clean and modern */}
        <div className="w-full mt-1.5 z-10">
          <div 
            className={`w-full h-2.5 rounded-full overflow-hidden relative border ${
              isDark 
                ? 'bg-slate-900/80 border-white/5 shadow-inner' 
                : 'bg-slate-100 border-slate-200/40 shadow-inner'
            }`}
          >
            <div 
              className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-sky-500 rounded-full transition-all duration-150 ease-out relative"
              style={{ 
                width: `${progress}%`
              }}
            >
              {/* Glow cap at the leading tip of progress bar */}
              {progress > 0 && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#22d3ee,0_0_15px_#22d3ee]" />
              )}
            </div>
          </div>
          
          <div className={`flex justify-between items-center mt-2 px-0.5 text-[9.5px] font-bold uppercase tracking-wider ${
            isDark ? 'text-slate-400' : 'text-slate-450'
          }`}>
            <span>Booting system</span>
            <span className="font-mono text-xs">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Process console status badge */}
        <div 
          className={`w-full px-4 py-2 rounded-xl text-center h-10 flex items-center justify-center z-10 shadow-sm border ${
            isDark 
              ? 'bg-[#0f111a]/40 border-white/5' 
              : 'bg-slate-50/50 border-slate-100'
          }`}
        >
          <span className="text-[10px] font-mono font-bold tracking-tight text-teal-600 dark:text-teal-400 uppercase flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500"></span>
            </span>
            {statusMessages[statusIndex]}
          </span>
        </div>
      </div>
    </div>
  );
}
