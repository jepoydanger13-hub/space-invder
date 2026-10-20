import React from 'react';
import { AlienType, RadarBlip } from '../types/game';

interface RadarProps {
  blips: RadarBlip[];
}

const ALIEN_BLIP_COLORS: Record<AlienType, string> = {
  crawler: '#00ff66',
  stalker: '#00e5ff',
  flying: '#ffaa00',
  brute: '#ff0044',
  boss: '#ff00ff',
};

export const Radar: React.FC<RadarProps> = ({ blips }) => {
  const maxRange = 16; // meters

  return (
    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-cyan-500/40 bg-gray-950/80 backdrop-blur-xs flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.15)] pointer-events-none select-none">
      {/* Distance concentric rings */}
      <div className="absolute w-3/4 h-3/4 rounded-full border border-cyan-500/20" />
      <div className="absolute w-1/2 h-1/2 rounded-full border border-cyan-500/20" />
      <div className="absolute w-1/4 h-1/4 rounded-full border border-cyan-500/20" />

      {/* Crosshair lines */}
      <div className="absolute w-full h-[1px] bg-cyan-500/20" />
      <div className="absolute h-full w-[1px] bg-cyan-500/20" />

      {/* Forward FOV cone (Green transparent cone indicating forward camera angle) */}
      <div
        className="absolute w-0 h-0 border-l-[28px] border-l-transparent border-r-[28px] border-r-transparent border-t-[50px] border-t-cyan-400/10 -top-1"
        style={{ transformOrigin: 'bottom center' }}
      />

      {/* Player center dot */}
      <div className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />

      {/* Alien threat blips */}
      {blips.map((blip) => {
        // angle: -180 to 180 degrees. 0 is forward (top), 90 is right, -90 is left, 180 is behind
        const angleRad = (blip.angle - 90) * (Math.PI / 180);
        const normDist = Math.min(blip.distance / maxRange, 0.95);
        const radius = (112 / 2) * normDist; // based on 112px inner diameter

        const x = Math.cos(angleRad) * radius;
        const y = Math.sin(angleRad) * radius;
        const color = ALIEN_BLIP_COLORS[blip.type] || '#ff0055';

        const isBoss = blip.type === 'boss';
        const isBrute = blip.type === 'brute';

        return (
          <div
            key={blip.id}
            className={`absolute rounded-full transition-transform duration-75 ${
              isBoss ? 'w-3.5 h-3.5 animate-bounce' : isBrute ? 'w-2.5 h-2.5' : 'w-2 h-2'
            }`}
            style={{
              backgroundColor: color,
              transform: `translate(${x}px, ${y}px)`,
              boxShadow: `0 0 6px ${color}`,
            }}
          />
        );
      })}

      {/* Label */}
      <span className="absolute bottom-1 text-[8px] font-mono tracking-widest text-cyan-400/70 uppercase">
        RADAR 360°
      </span>
    </div>
  );
};
