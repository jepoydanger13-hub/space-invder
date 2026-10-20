import React from 'react';

interface ReticleProps {
  hitMarker: 'none' | 'hit' | 'headshot';
  isFiring: boolean;
  weaponColor: string;
}

export const Reticle: React.FC<ReticleProps> = ({ hitMarker, isFiring, weaponColor }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-20">
      {/* Central Crosshair Box & Chevrons */}
      <div
        className={`relative transition-all duration-75 ${
          isFiring ? 'scale-125' : 'scale-100'
        }`}
      >
        {/* Center dot */}
        <div
          className="w-1.5 h-1.5 rounded-full mx-auto"
          style={{ backgroundColor: weaponColor, boxShadow: `0 0 6px ${weaponColor}` }}
        />

        {/* Reticle brackets */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-cyan-400/80" />
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-cyan-400/80" />
        <div className="absolute top-1/2 -left-4 -translate-y-1/2 h-0.5 w-2 bg-cyan-400/80" />
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 h-0.5 w-2 bg-cyan-400/80" />

        {/* Corner notches */}
        <div className="absolute -top-3 -left-3 w-2 h-2 border-t border-l border-cyan-400/50" />
        <div className="absolute -top-3 -right-3 w-2 h-2 border-t border-r border-cyan-400/50" />
        <div className="absolute -bottom-3 -left-3 w-2 h-2 border-b border-l border-cyan-400/50" />
        <div className="absolute -bottom-3 -right-3 w-2 h-2 border-b border-r border-cyan-400/50" />

        {/* Hit Marker X Flash */}
        {hitMarker === 'hit' && (
          <div className="absolute inset-0 -m-3 flex items-center justify-center animate-hit-ping">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_8px_#facc15]" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="4" y1="4" x2="20" y2="20" />
              <line x1="20" y1="4" x2="4" y2="20" />
            </svg>
          </div>
        )}

        {/* Critical Headshot Marker Flash */}
        {hitMarker === 'headshot' && (
          <div className="absolute inset-0 -m-5 flex flex-col items-center justify-center animate-hit-ping">
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-rose-500 drop-shadow-[0_0_12px_#ff0055]" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="3" y1="3" x2="21" y2="21" />
              <line x1="21" y1="3" x2="3" y2="21" />
            </svg>
            <span className="text-[10px] font-orbitron font-black text-rose-400 tracking-wider drop-shadow-[0_0_8px_#ff0055] whitespace-nowrap mt-1">
              CRITICAL!
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
