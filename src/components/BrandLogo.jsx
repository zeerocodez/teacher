import React from 'react';

export default function BrandLogo({ light = false, className = '', iconOnly = false }) {
  return (
    <div className={`flex items-center gap-2.5 md:gap-3 bg-transparent select-none whitespace-nowrap ${className}`}>
      {/* Emblem Circle with Transparent SVG Wrapper */}
      <svg 
        viewBox="0 0 200 200" 
        className="h-full w-auto aspect-square flex-shrink-0 hover:rotate-12 transition-transform duration-300"
        aria-hidden="true"
      >
        <circle 
          cx="100" 
          cy="100" 
          r="90" 
          fill="#000000" 
          stroke={light ? "rgba(0, 168, 232, 0.4)" : "rgba(0, 168, 232, 0.2)"} 
          strokeWidth="4" 
        />
        <path 
          d="M 45 100 C 45 60, 100 60, 100 100 C 100 140, 155 140, 155 100" 
          stroke="#00A8E8" 
          strokeWidth="14" 
          strokeLinecap="round" 
          fill="none" 
        />
        <circle cx="72.5" cy="46" r="14" fill="#00A8E8" />
        <circle cx="127.5" cy="104" r="14" fill="#00A8E8" />
      </svg>

      {!iconOnly && (
        <>
          {/* Vertical serif divider line */}
          <svg 
            viewBox="0 0 12 60" 
            className={`h-full w-auto aspect-[12/60] flex-shrink-0 ${light ? 'text-white/70' : 'text-brand-charcoal/60'}`} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M 2 6 L 10 6" />
            <path d="M 6 6 L 6 54" />
            <path d="M 2 54 L 10 54" />
          </svg>

          {/* Text branding */}
          <div className="flex flex-col select-none leading-none justify-center pr-2 md:pr-4">
            <span className={`font-heading font-black text-base sm:text-lg lg:text-xl xl:text-2xl tracking-tight uppercase ${light ? 'text-white' : 'text-brand-charcoal'}`}>
              EDUVISTAR
            </span>
            <span className={`font-heading font-bold text-[9px] sm:text-[10px] lg:text-[11px] tracking-[0.28em] uppercase mt-1 ${light ? 'text-brand-cream/80' : 'text-brand-charcoal/70'}`}>
              AFRICA
            </span>
          </div>
        </>
      )}
    </div>
  );
}
