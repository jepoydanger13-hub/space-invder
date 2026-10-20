import React from 'react';
import { RotateCcw, Home, Skull, Zap, Target } from 'lucide-react';
import { GameStats } from '../types/game';

interface GameOverModalProps {
  stats: GameStats;
  onRestart: () => void;
  onReturnToTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRestart,
  onReturnToTitle,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-gray-950 border border-rose-600/40 rounded-2xl w-full max-w-md p-6 text-center shadow-[0_0_40px_rgba(244,63,94,0.3)]">
        {/* Skull Icon */}
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-3 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
          <Skull className="w-9 h-9" />
        </div>

        <h2 className="font-orbitron font-black text-2xl sm:text-3xl text-rose-500 tracking-wider mb-1">
          HUNTER COMPROMISED
        </h2>
        <p className="text-xs text-gray-400 font-mono mb-6">
          CRITICAL BIO-DAMAGE SUSTAINED
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 bg-gray-900/60 p-4 rounded-xl border border-gray-800 text-left text-xs">
          <div>
            <div className="text-gray-400 mb-0.5">FINAL SCORE</div>
            <div className="font-orbitron font-black text-lg text-white tabular-nums">
              {stats.score.toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-gray-400 mb-0.5">BIO-CREDITS EARNED</div>
            <div className="font-orbitron font-bold text-lg text-amber-300 flex items-center gap-1 tabular-nums">
              <Zap className="w-4 h-4 fill-amber-400" />
              <span>+{stats.creditsEarned}</span>
            </div>
          </div>

          <div>
            <div className="text-gray-400 mb-0.5">ALIENS EXTERMINATED</div>
            <div className="font-orbitron font-bold text-base text-cyan-300 tabular-nums">
              {stats.kills}
            </div>
          </div>

          <div>
            <div className="text-gray-400 mb-0.5">CRITICAL HEADSHOTS</div>
            <div className="font-orbitron font-bold text-base text-rose-400 tabular-nums">
              {stats.headshots}
            </div>
          </div>

          <div>
            <div className="text-gray-400 mb-0.5">ACCURACY RATING</div>
            <div className="font-orbitron font-bold text-base text-emerald-400 tabular-nums">
              {stats.shotsFired > 0
                ? Math.round((stats.shotsHit / stats.shotsFired) * 100)
                : 0}
              %
            </div>
          </div>

          <div>
            <div className="text-gray-400 mb-0.5">WAVE REACHED</div>
            <div className="font-orbitron font-bold text-base text-purple-400 tabular-nums">
              WAVE {stats.waveReached}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRestart}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-orbitron font-bold text-sm tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)]"
          >
            <RotateCcw className="w-5 h-5" />
            <span>TRY AGAIN</span>
          </button>

          <button
            onClick={onReturnToTitle}
            className="w-full py-3 px-4 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 font-orbitron text-xs font-bold tracking-wider flex items-center justify-center gap-2 hover:border-gray-500 active:scale-95 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>RETURN TO BASE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
