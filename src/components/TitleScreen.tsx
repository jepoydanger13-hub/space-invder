import React from 'react';
import { Play, Shield, Target, Skull, Award, BookOpen, Settings, Zap } from 'lucide-react';
import { GameMode } from '../types/game';

interface TitleScreenProps {
  onStartGame: (mode: GameMode) => void;
  onOpenArmory: () => void;
  onOpenBestiary: () => void;
  onOpenSettings: () => void;
  credits: number;
  highScore: number;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenArmory,
  onOpenBestiary,
  onOpenSettings,
  credits,
  highScore,
  selectedMode,
  onSelectMode,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-4 sm:p-8 bg-gray-950/85 backdrop-blur-md select-none overflow-y-auto">
      {/* Top Bar: High Score, Credits, Settings */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-gray-900/90 border border-cyan-500/30 flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono text-gray-400">RECORD:</span>
            <span className="font-orbitron font-bold text-cyan-300 text-sm tabular-nums">
              {highScore.toLocaleString()}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-gray-900/90 border border-amber-500/30 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono text-gray-400">CREDITS:</span>
            <span className="font-orbitron font-bold text-amber-300 text-sm tabular-nums">
              {credits}
            </span>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 hover:text-cyan-400 hover:border-cyan-500 transition-all shadow-md active:scale-95"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Hero Centerpiece & Title Lockup */}
      <div className="flex flex-col items-center justify-center my-auto py-6 text-center max-w-xl mx-auto">
        {/* Bespoke Sci-Fi Inline SVG Title Lockup */}
        <div className="relative mb-4">
          <svg
            viewBox="0 0 600 120"
            className="w-72 sm:w-96 md:w-[480px] h-auto drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]"
          >
            <defs>
              <linearGradient id="alienGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00f0ff" />
                <stop offset="50%" stopColor="#39ff14" />
                <stop offset="100%" stopColor="#00f0ff" />
              </linearGradient>
              <linearGradient id="invFade" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
            </defs>
            <text
              x="50%"
              y="55"
              textAnchor="middle"
              fill="url(#alienGlow)"
              fontSize="48"
              fontWeight="900"
              fontFamily="Orbitron, monospace"
              letterSpacing="6"
            >
              ALIEN HUNTER
            </text>
            <text
              x="50%"
              y="98"
              textAnchor="middle"
              fill="url(#invFade)"
              fontSize="22"
              fontWeight="700"
              fontFamily="Rajdhani, sans-serif"
              letterSpacing="12"
            >
              REALITY INVASION · AR 3D
            </text>
          </svg>
        </div>

        <p className="text-gray-300 text-sm sm:text-base max-w-md mb-6 leading-relaxed">
          Extraterrestrial bio-swarms have breached our physical reality. Aim with your phone camera, eliminate alien hostiles, and defend Earth.
        </p>

        {/* Game Mode Selector Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full mb-6">
          <button
            onClick={() => onSelectMode('survival')}
            className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
              selectedMode === 'survival'
                ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                : 'bg-gray-900/70 border-gray-800 text-gray-400 hover:border-gray-700'
            }`}
          >
            <Shield className="w-5 h-5 mb-1 text-cyan-400" />
            <span className="font-orbitron font-bold text-xs">SURVIVAL</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Endless Waves</span>
          </button>

          <button
            onClick={() => onSelectMode('mission')}
            className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
              selectedMode === 'mission'
                ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-gray-900/70 border-gray-800 text-gray-400 hover:border-gray-700'
            }`}
          >
            <Target className="w-5 h-5 mb-1 text-amber-400" />
            <span className="font-orbitron font-bold text-xs">MISSIONS</span>
            <span className="text-[10px] text-gray-400 mt-0.5">6 Operations</span>
          </button>

          <button
            onClick={() => onSelectMode('boss')}
            className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
              selectedMode === 'boss'
                ? 'bg-rose-500/20 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'bg-gray-900/70 border-gray-800 text-gray-400 hover:border-gray-700'
            }`}
          >
            <Skull className="w-5 h-5 mb-1 text-rose-400" />
            <span className="font-orbitron font-bold text-xs">BOSS RAID</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Overlord Titan</span>
          </button>

          <button
            onClick={() => onSelectMode('training')}
            className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
              selectedMode === 'training'
                ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-gray-900/70 border-gray-800 text-gray-400 hover:border-gray-700'
            }`}
          >
            <Zap className="w-5 h-5 mb-1 text-emerald-400" />
            <span className="font-orbitron font-bold text-xs">TRAINING</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Target Drones</span>
          </button>
        </div>

        {/* Primary Start CTA Button */}
        <button
          onClick={() => onStartGame(selectedMode)}
          className="group relative px-8 py-4 w-full sm:w-80 rounded-2xl bg-linear-to-r from-cyan-500 via-emerald-500 to-cyan-500 bg-size-200 text-black font-orbitron font-black text-lg tracking-widest shadow-[0_0_30px_rgba(0,240,255,0.5)] hover:shadow-[0_0_40px_rgba(0,240,255,0.8)] active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>START INVASION</span>
        </button>

        {/* Flat control-hint line */}
        <p className="text-xs font-mono text-gray-400 mt-4 tracking-wider">
          Rotate / Drag to Aim · Tap FIRE to Shoot · R to Reload · Space / Enter to Start
        </p>
      </div>

      {/* Bottom Bar: Armory & Bestiary */}
      <div className="flex items-center justify-center gap-4 w-full max-w-md mx-auto pt-2">
        <button
          onClick={onOpenArmory}
          className="flex-1 py-3 px-4 rounded-xl bg-gray-900/90 border border-gray-800 hover:border-cyan-500/50 text-gray-200 font-orbitron text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
        >
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>ARMORY & UPGRADES</span>
        </button>

        <button
          onClick={onOpenBestiary}
          className="flex-1 py-3 px-4 rounded-xl bg-gray-900/90 border border-gray-800 hover:border-cyan-500/50 text-gray-200 font-orbitron text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
        >
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>ALIEN CODEX</span>
        </button>
      </div>
    </div>
  );
};
