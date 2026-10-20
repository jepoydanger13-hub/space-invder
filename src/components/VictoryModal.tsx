import React from 'react';
import { Award, RotateCcw, Home, Zap } from 'lucide-react';
import { GameStats } from '../types/game';

interface VictoryModalProps {
  stats: GameStats;
  rewardCredits: number;
  rewardXP: number;
  onContinue: () => void;
  onReturnToTitle: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  rewardCredits,
  rewardXP,
  onContinue,
  onReturnToTitle,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-gray-950 border border-emerald-500/40 rounded-2xl w-full max-w-md p-6 text-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
        {/* Trophy / Award icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <Award className="w-9 h-9" />
        </div>

        <h2 className="font-orbitron font-black text-2xl sm:text-3xl text-emerald-400 tracking-wider mb-1">
          AREA SECURED!
        </h2>
        <p className="text-xs text-gray-400 font-mono mb-6">
          ALL ALIEN THREATS ELIMINATED
        </p>

        {/* Reward Banner */}
        <div className="flex items-center justify-center gap-4 p-3 mb-5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 font-orbitron">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold text-sm">
            <Zap className="w-4 h-4 fill-amber-400" />
            <span>+{rewardCredits} CREDITS</span>
          </div>
          <div className="w-[1px] h-4 bg-emerald-500/30" />
          <div className="text-cyan-300 font-bold text-sm">
            +{rewardXP} COMBAT XP
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 bg-gray-900/60 p-4 rounded-xl border border-gray-800 text-left text-xs">
          <div>
            <div className="text-gray-400 mb-0.5">MISSION SCORE</div>
            <div className="font-orbitron font-black text-lg text-white tabular-nums">
              {stats.score.toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-gray-400 mb-0.5">ALIENS DEFEATED</div>
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
            <div className="text-gray-400 mb-0.5">FIRING ACCURACY</div>
            <div className="font-orbitron font-bold text-base text-emerald-400 tabular-nums">
              {stats.shotsFired > 0
                ? Math.round((stats.shotsHit / stats.shotsFired) * 100)
                : 0}
              %
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onContinue}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-orbitron font-bold text-sm tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
            <span>NEXT MISSION / CONTINUE</span>
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
