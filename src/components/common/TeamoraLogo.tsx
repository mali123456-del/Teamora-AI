import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'symbol' | 'compact';
  theme?: 'auto' | 'dark' | 'light';
}

export const TeamoraLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  theme = 'auto',
}) => {
  const sizeMap = {
    sm: { symbol: 24, font: 'text-base', gap: 'gap-2' },
    md: { symbol: 32, font: 'text-xl', gap: 'gap-2.5' },
    lg: { symbol: 42, font: 'text-2xl', gap: 'gap-3' },
    xl: { symbol: 54, font: 'text-3xl', gap: 'gap-3.5' },
  };

  const current = sizeMap[size];

  // Dynamic colors depending on theme
  const isDarkExplicit = theme === 'dark';
  const isLightExplicit = theme === 'light';

  const textFill = isDarkExplicit
    ? 'text-[#F5F1E9]'
    : isLightExplicit
    ? 'text-[#211B2C]'
    : 'text-[#211B2C] dark:text-[#F5F1E9]';

  const badgeBg = isDarkExplicit
    ? 'bg-[#C7F36B] text-[#162700]'
    : isLightExplicit
    ? 'bg-[#211B2C] text-[#C7F36B]'
    : 'bg-[#C7F36B] text-[#162700] dark:bg-[#C7F36B] dark:text-[#162700]';

  return (
    <div className={`inline-flex items-center ${current.gap} select-none ${className}`}>
      {/* Original Geometric T-Node Symbol */}
      <svg
        width={current.symbol}
        height={current.symbol}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="teamoraGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
          <linearGradient id="teamoraLimeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D9F99D" />
            <stop offset="100%" stopColor="#C7F36B" />
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer subtle shield rounded square */}
        <rect
          x="6"
          y="6"
          width="88"
          height="88"
          rx="24"
          fill="#211B2C"
          stroke="url(#teamoraGrad1)"
          strokeWidth="3.5"
        />

        {/* Interconnection network links (team collaboration mesh) */}
        <line x1="26" y1="28" x2="50" y2="28" stroke="#A78BFA" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 1" opacity="0.6" />
        <line x1="50" y1="28" x2="74" y2="28" stroke="#A78BFA" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 1" opacity="0.6" />
        <line x1="50" y1="28" x2="50" y2="76" stroke="#A78BFA" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
        <line x1="26" y1="28" x2="50" y2="52" stroke="#C7F36B" strokeWidth="2.5" opacity="0.4" />
        <line x1="74" y1="28" x2="50" y2="52" stroke="#FF806E" strokeWidth="2.5" opacity="0.4" />

        {/* Structural 'T' Architecture */}
        {/* Horizontal Crossbar of T */}
        <path
          d="M 22 28 C 22 24, 26 22, 32 22 L 68 22 C 74 22, 78 24, 78 28 C 78 32, 74 34, 68 34 L 57 34 L 57 74 C 57 80, 53 82, 50 82 C 47 82, 43 80, 43 74 L 43 34 L 32 34 C 26 34, 22 32, 22 28 Z"
          fill="url(#teamoraGrad1)"
        />

        {/* Connected Team Agent Nodes (representing unified workforce) */}
        {/* Top-left agent node */}
        <circle cx="26" cy="28" r="6" fill="#C7F36B" stroke="#211B2C" strokeWidth="2" />
        {/* Top-center orchestrator hub */}
        <circle cx="50" cy="28" r="8" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="3" />
        {/* Top-right agent node */}
        <circle cx="74" cy="28" r="6" fill="#FF806E" stroke="#211B2C" strokeWidth="2" />
        {/* Central convergence node */}
        <circle cx="50" cy="52" r="5" fill="#C7F36B" />
        {/* Foundation execution node */}
        <circle cx="50" cy="74" r="6" fill="#A78BFA" stroke="#211B2C" strokeWidth="2" />
      </svg>

      {/* Wordmark */}
      {variant !== 'symbol' && (
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-heading font-extrabold tracking-tight ${current.font} ${textFill}`}>
            TEAMORA
          </span>
          <span
            className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase ${badgeBg}`}
          >
            AI
          </span>
        </div>
      )}
    </div>
  );
};
