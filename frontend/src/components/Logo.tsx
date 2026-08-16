import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const getPixelSize = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'sm': return 32;
      case 'md': return 48;
      case 'lg': return 64;
      case 'xl': return 96;
      default: return 48;
    }
  };

  const pixelSize = getPixelSize();

  return (
    <div 
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    >
      {/* Ambient background glow */}
      <div 
        className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 to-indigo-500/10 rounded-full blur-md animate-pulse-glow"
        style={{ width: '90%', height: '90%' }}
      />
      
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 filter drop-shadow-[0_2px_8px_rgba(20,184,166,0.15)] dark:drop-shadow-[0_4px_12px_rgba(20,184,166,0.3)] transition-transform duration-500 hover:rotate-[360deg] cursor-pointer"
      >
        <defs>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" /> {/* sky-500 */}
            <stop offset="50%" stopColor="#06b6d4" /> {/* cyan-500 */}
            <stop offset="100%" stopColor="#14b8a6" /> {/* teal-500 */}
          </linearGradient>
          
          <linearGradient id="dnaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" /> {/* indigo-500 */}
            <stop offset="50%" stopColor="#8b5cf6" /> {/* violet-500 */}
            <stop offset="100%" stopColor="#3b82f6" /> {/* blue-500 */}
          </linearGradient>
          
          <linearGradient id="crossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ccfbf1" /> {/* teal-100 */}
          </linearGradient>

          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Circular Tech Ring (AI Data Network) */}
        <circle 
          cx="60" 
          cy="60" 
          r="48" 
          stroke="url(#dnaGrad)" 
          strokeWidth="1.5" 
          strokeDasharray="6 3" 
          className="opacity-40 animate-spin" 
          style={{ transformOrigin: 'center', animationDuration: '30s' }}
        />
        
        {/* DNA Helix strand 1 - swirling path */}
        <path 
          d="M28 60 C 28 35, 92 35, 92 60 C 92 85, 28 85, 28 60 Z" 
          stroke="url(#dnaGrad)" 
          strokeWidth="2.5" 
          className="opacity-70"
        />

        {/* DNA Helix strand 2 - offset swirling path */}
        <path 
          d="M28 60 C 28 85, 92 85, 92 60 C 92 35, 28 35, 28 60 Z" 
          stroke="url(#shieldGrad)" 
          strokeWidth="1.5" 
          strokeDasharray="2 2"
          className="opacity-60"
        />

        {/* DNA base-pair links (connecting dots) */}
        <circle cx="44" cy="46" r="2.5" fill="#6366f1" />
        <circle cx="76" cy="74" r="2.5" fill="#6366f1" />
        <circle cx="44" cy="74" r="2.5" fill="#06b6d4" />
        <circle cx="76" cy="46" r="2.5" fill="#06b6d4" />
        
        {/* Shield Outer Ring */}
        <path 
          d="M60 18 C78 18, 92 24, 92 34 C92 72, 60 98, 60 98 C60 98, 28 72, 28 34 C28 24, 42 18, 60 18 Z" 
          fill="url(#shieldGrad)" 
          fillOpacity="0.12" 
          stroke="url(#shieldGrad)" 
          strokeWidth="2" 
          className="filter drop-shadow-sm"
        />

        {/* Medical Cross (Centered inside Shield) */}
        <g filter="url(#glowFilter)">
          {/* Glowing teal background cross */}
          <path 
            d="M52 38h16v12h12v16H68v12H52V66H40V50h12V38z" 
            fill="url(#shieldGrad)" 
            fillOpacity="0.8" 
          />
          {/* Crisp front white/teal cross */}
          <path 
            d="M54 40h12v12h12v12H66v12H54V64H42V52h12V40z" 
            fill="url(#crossGrad)" 
          />
        </g>

        {/* ECG Heartbeat pulse line cutting across the cross */}
        <path 
          d="M20 60 H40 L45 42 L52 76 L59 48 L64 64 L68 60 H100" 
          stroke="#ffffff" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="filter drop-shadow-[0_0_4px_rgba(255,255,255,0.7)]"
        />
        <circle cx="20" cy="60" r="3" fill="#ffffff" />
        <circle cx="100" cy="60" r="3" fill="#14b8a6" className="animate-ping" style={{ transformOrigin: '100px 60px' }} />
      </svg>
    </div>
  );
}
