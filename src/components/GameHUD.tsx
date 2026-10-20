import React from 'react';
import { Pause, RotateCcw, Crosshair, Shield, Heart, Zap, AlertTriangle } from 'lucide-react';
import { GameMode, OffscreenIndicator, RadarBlip, Weapon } from '../types/game';
import { Radar } from './Radar';
import { Reticle } from './Reticle';

interface GameHUDProps {
  score: number;
  kills: number;
  headshots: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  wave: number;
  mode: GameMode;
  objectiveProgress?: { current: number; total: number; label: string };
  combo: number;
  comboTimer: number;
  currentWeapon: Weapon;
  weapons: Weapon[];
  isReloading: boolean;
  reloadProgress: number; // 0 to 1
  hitMarker: 'none' | 'hit' | 'headshot';
  isFiring: boolean;
  touchToAim: boolean;
  radarBlips: RadarBlip[];
  offscreenIndicators: OffscreenIndicator[];
  onFire: () => void;
  onReload: () => void;
  onSelectWeapon: (weaponId: string) => void;
  onToggleTouchToAim: () => void;
  onPause: () => void;
  onCalibrateGyro?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  kills,
  health,
  maxHealth,
  shield,
  maxShield,
  wave,
  mode,
  objectiveProgress,
  combo,
  currentWeapon,
  weapons,
  isReloading,
  reloadProgress,
  hitMarker,
  isFiring,
  touchToAim,
  radarBlips,
  offscreenIndicators,
  onFire,
  onReload,
  onSelectWeapon,
  onToggleTouchToAim,
  onPause,
}) => {
  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const shieldPercent = Math.max(0, Math.min(100, (shield / maxShield) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-3 sm:p-5">
      {/* Reticle in Center */}
      <Reticle
        hitMarker={hitMarker}
        isFiring={isFiring}
        weaponColor={currentWeapon.color}
      />

      {/* Off-screen Danger Indicators (Chevrons pointing to threats) */}
      {offscreenIndicators.map((ind) => {
        // screenAngle in radians: 0 is right, Math.PI/2 is bottom, etc.
        const deg = (ind.screenAngle * 180) / Math.PI;
        return (
          <div
            key={ind.id}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div
              className="absolute transition-transform duration-75"
              style={{
                transform: `rotate(${deg}deg) translate(min(42vw, 360px)) rotate(-${deg}deg)`,
              }}
            >
              <div
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                  ind.isAttacking
                    ? 'bg-rose-600 text-white animate-pulse shadow-[0_0_10px_#ff0055]'
                    : 'bg-amber-500/80 text-black'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>{Math.round(ind.distance)}m</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* TOP BAR: Health / Shield, Score / Wave, Radar */}
      <div className="flex items-start justify-between w-full">
        {/* Left cluster: Pause, Player Health/Shield & Stats */}
        <div className="flex flex-col gap-2 max-w-[220px] sm:max-w-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={onPause}
              className="pointer-events-auto p-2 rounded-lg bg-gray-900/80 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/40 active:scale-95 transition-all shadow-md"
              aria-label="Pause game"
            >
              <Pause className="w-5 h-5" />
            </button>

            {/* Mode & Wave / Objective Badge */}
            <div className="px-2.5 py-1 rounded-md bg-gray-900/80 border border-cyan-500/30 text-cyan-300 font-orbitron text-xs tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>
                {mode === 'survival'
                  ? `WAVE ${wave}`
                  : mode === 'boss'
                  ? 'BOSS TITAN'
                  : mode === 'training'
                  ? 'SIMULATION'
                  : `MISSION ${wave}`}
              </span>
            </div>
          </div>

          {/* Health & Shield Vitals */}
          <div className="bg-gray-950/80 border border-gray-800 rounded-lg p-2 flex flex-col gap-1.5 backdrop-blur-xs shadow-md">
            {/* Shield Bar */}
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <div className="flex-1 h-2 bg-gray-900 rounded-full overflow-hidden border border-cyan-500/20">
                <div
                  className="h-full bg-cyan-400 transition-all duration-200"
                  style={{ width: `${shieldPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-mono tabular-nums text-cyan-300 w-7 text-right">
                {Math.round(shield)}
              </span>
            </div>

            {/* Health Bar */}
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <div className="flex-1 h-2 bg-gray-900 rounded-full overflow-hidden border border-rose-500/20">
                <div
                  className={`h-full transition-all duration-200 ${
                    healthPercent < 30 ? 'bg-rose-600 animate-pulse' : 'bg-rose-500'
                  }`}
                  style={{ width: `${healthPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-mono tabular-nums text-rose-300 w-7 text-right">
                {Math.round(health)}
              </span>
            </div>
          </div>

          {/* Objective Progress in Mission Mode */}
          {objectiveProgress && (
            <div className="bg-gray-950/80 border border-amber-500/30 rounded-lg px-2.5 py-1 text-xs text-amber-300 flex items-center justify-between">
              <span>{objectiveProgress.label}</span>
              <span className="font-mono tabular-nums font-bold">
                {objectiveProgress.current} / {objectiveProgress.total}
              </span>
            </div>
          )}
        </div>

        {/* Center: Score & Combo Streak */}
        <div className="flex flex-col items-center">
          <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400/70">
            SCORE
          </div>
          <div className="font-orbitron font-black text-xl sm:text-2xl text-white tracking-wider tabular-nums drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]">
            {score.toLocaleString()}
          </div>

          {/* Combo Multiplier Streak */}
          {combo > 1 && (
            <div className="mt-1 px-2.5 py-0.5 rounded-full bg-linear-to-r from-amber-500 to-rose-500 text-black font-orbitron font-black text-xs tracking-wider shadow-[0_0_12px_#f59e0b] animate-bounce">
              {combo}x {combo >= 5 ? 'UNSTOPPABLE!' : combo >= 3 ? 'RAMPAGE!' : 'STREAK!'}
            </div>
          )}

          <div className="text-[11px] font-mono text-gray-400 mt-0.5 tabular-nums">
            KILLS: <span className="text-cyan-300 font-bold">{kills}</span>
          </div>
        </div>

        {/* Right: 360 Threat Radar */}
        <div className="pointer-events-auto">
          <Radar blips={radarBlips} />
        </div>
      </div>

      {/* BOTTOM CONTROL DECK: Ammo Counter, Weapon Switcher, Ergonomic FIRE & RELOAD Buttons */}
      <div className="flex items-end justify-between w-full pb-1">
        {/* Left: Weapon Selection & Aim Mode Toggle */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Aim Mode Toggle */}
          <button
            onClick={onToggleTouchToAim}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-all shadow-md ${
              touchToAim
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                : 'bg-gray-900/80 border-gray-700 text-gray-400'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{touchToAim ? 'TOUCH TO AIM ON' : 'CENTER AIM'}</span>
          </button>

          {/* Weapon Strip */}
          <div className="flex items-center gap-1.5 bg-gray-950/90 border border-gray-800 p-1.5 rounded-xl backdrop-blur-xs">
            {weapons.map((w) => {
              const isSelected = w.id === currentWeapon.id;
              return (
                <button
                  key={w.id}
                  disabled={!w.unlocked}
                  onClick={() => onSelectWeapon(w.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-orbitron tracking-wider flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-cyan-500/30 border border-cyan-400 text-white shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                      : w.unlocked
                      ? 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-700'
                      : 'opacity-40 bg-gray-950 text-gray-600 border border-transparent'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: w.unlocked ? w.color : '#555' }}
                  />
                  <span className="hidden sm:inline">{w.name.split(' ')[0]}</span>
                  <span className="sm:hidden">{w.type.toUpperCase().substring(0, 3)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Tactical Ammo Display & Reload Alert */}
        <div className="flex flex-col items-center">
          {isReloading ? (
            <div className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 font-orbitron text-sm font-bold tracking-widest animate-pulse flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <RotateCcw className="w-4 h-4 animate-spin" />
              <span>RELOADING {Math.round(reloadProgress * 100)}%</span>
            </div>
          ) : currentWeapon.currentAmmo === 0 ? (
            <button
              onClick={onReload}
              className="pointer-events-auto px-4 py-2 rounded-xl bg-rose-500/30 border border-rose-400 text-rose-200 font-orbitron text-sm font-bold tracking-widest animate-bounce flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>TAP TO RELOAD</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-gray-950/80 px-3 py-1.5 rounded-xl border border-gray-800 backdrop-blur-xs">
              <Zap className="w-4 h-4 text-cyan-400" />
              <div className="flex items-baseline gap-1 font-orbitron tabular-nums">
                <span
                  className="text-2xl font-black"
                  style={{ color: currentWeapon.color }}
                >
                  {currentWeapon.currentAmmo}
                </span>
                <span className="text-sm text-gray-500">/ {currentWeapon.magSize}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Large Ergonomic FIRE Button & RELOAD Button */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Tactical Reload Button */}
          <button
            onClick={onReload}
            disabled={isReloading || currentWeapon.currentAmmo === currentWeapon.magSize}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border flex flex-col items-center justify-center transition-all active:scale-95 shadow-lg ${
              isReloading
                ? 'opacity-50 border-gray-700 bg-gray-900 text-gray-500 cursor-not-allowed'
                : 'border-cyan-500/40 bg-gray-900/90 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/50'
            }`}
            aria-label="Reload weapon"
          >
            <RotateCcw className={`w-5 h-5 sm:w-6 sm:h-6 ${isReloading ? 'animate-spin' : ''}`} />
            <span className="text-[9px] font-mono tracking-wider mt-0.5 font-bold uppercase">
              RELOAD
            </span>
          </button>

          {/* Big Ergonomic FIRE Button */}
          <button
            onClick={onFire}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-rose-500 bg-gradient-to-tr from-rose-700 to-rose-500 text-white font-orbitron font-black text-lg sm:text-xl tracking-wider active:scale-90 active:brightness-125 transition-all shadow-[0_0_25px_rgba(244,63,94,0.6)] flex flex-col items-center justify-center select-none"
            aria-label="Fire weapon"
          >
            <Crosshair className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5" />
            <span>FIRE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
