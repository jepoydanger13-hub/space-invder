import React from 'react';
import { Play, RotateCcw, Home, Settings } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onReturnToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  onReturnToTitle,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-gray-950 border border-cyan-500/30 rounded-2xl w-full max-w-sm p-6 text-center shadow-[0_0_35px_rgba(0,240,255,0.25)]">
        <h2 className="font-orbitron font-black text-2xl text-white tracking-widest mb-1">
          TACTICAL PAUSE
        </h2>
        <p className="text-xs text-gray-400 font-mono mb-6">COMBAT SUSPENDED</p>

        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 text-black font-orbitron font-bold text-sm tracking-wider flex items-center justify-center gap-2 hover:bg-cyan-400 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>RESUME COMBAT</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-xl bg-gray-900 border border-gray-700 text-gray-200 font-orbitron text-xs font-bold tracking-wider flex items-center justify-center gap-2 hover:border-gray-500 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART ENCOUNTER</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full py-3 px-4 rounded-xl bg-gray-900 border border-gray-700 text-gray-200 font-orbitron text-xs font-bold tracking-wider flex items-center justify-center gap-2 hover:border-gray-500 active:scale-95 transition-all"
          >
            <Settings className="w-4 h-4" />
            <span>AR / AUDIO SETTINGS</span>
          </button>

          <button
            onClick={onReturnToTitle}
            className="w-full py-3 px-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 font-orbitron text-xs font-bold tracking-wider flex items-center justify-center gap-2 hover:bg-rose-900/40 active:scale-95 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>ABANDON & RETURN TO MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
