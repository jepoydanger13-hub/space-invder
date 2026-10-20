import React, { useState } from 'react';
import { X, Zap, Shield, ChevronRight, Lock, Check } from 'lucide-react';
import { Weapon } from '../types/game';

interface ArmoryModalProps {
  weapons: Weapon[];
  credits: number;
  onClose: () => void;
  onUnlockWeapon: (weaponId: string, cost: number) => void;
  onUpgradeWeapon: (weaponId: string, stat: 'damageLevel' | 'magLevel' | 'reloadLevel', cost: number) => void;
}

export const ArmoryModal: React.FC<ArmoryModalProps> = ({
  weapons,
  credits,
  onClose,
  onUnlockWeapon,
  onUpgradeWeapon,
}) => {
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>(weapons[0].id);

  const current = weapons.find((w) => w.id === selectedWeaponId) || weapons[0];

  const damageLevel = current.upgrades.damageLevel;
  const magLevel = current.upgrades.magLevel;
  const reloadLevel = current.upgrades.reloadLevel;

  const damageCost = (damageLevel + 1) * 75;
  const magCost = (magLevel + 1) * 50;
  const reloadCost = (reloadLevel + 1) * 60;

  return (
    <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fadeIn">
      <div className="bg-gray-950 border border-cyan-500/30 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(0,240,255,0.2)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-800 bg-gray-900/60">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-cyan-400" />
            <div>
              <h2 className="font-orbitron font-bold text-lg sm:text-xl text-white tracking-wider">
                TACTICAL ARMORY & UPGRADES
              </h2>
              <p className="text-xs text-gray-400 font-mono">ENHANCE FIREPOWER FOR DEEP COMBAT</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-amber-500/30 text-amber-300 font-orbitron text-sm font-bold">
              <Zap className="w-4 h-4 fill-amber-400" />
              <span>{credits} CR</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content: Left Weapon List & Right Weapon Detail */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-y-auto">
          {/* Weapon Selector Tabs */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-gray-800 p-3 sm:p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
            {weapons.map((w) => {
              const isSelected = w.id === selectedWeaponId;
              return (
                <button
                  key={w.id}
                  onClick={() => setSelectedWeaponId(w.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between shrink-0 md:shrink ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: w.unlocked ? w.color : '#444' }}
                    />
                    <div>
                      <div className="font-orbitron font-bold text-xs sm:text-sm text-gray-200">
                        {w.name}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                        {w.type}
                      </div>
                    </div>
                  </div>

                  {!w.unlocked ? (
                    <Lock className="w-4 h-4 text-amber-400/80" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-cyan-400/80 hidden md:block" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Weapon Detail & Upgrades */}
          <div className="md:col-span-8 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Title & Lore */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3
                    className="font-orbitron font-black text-xl sm:text-2xl tracking-wider"
                    style={{ color: current.color }}
                  >
                    {current.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 mt-1 leading-relaxed">
                    {current.description}
                  </p>
                </div>
              </div>

              {/* Base Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6 bg-gray-900/50 p-3.5 rounded-xl border border-gray-800 text-xs">
                <div>
                  <div className="text-gray-400 mb-1">BASE DAMAGE</div>
                  <div className="font-orbitron font-bold text-base text-white tabular-nums">
                    {Math.round(current.damage * (1 + current.upgrades.damageLevel * 0.2))}
                    <span className="text-xs text-cyan-400 ml-1 font-mono">
                      (+{current.upgrades.damageLevel * 20}%)
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 mb-1">MAGAZINE</div>
                  <div className="font-orbitron font-bold text-base text-white tabular-nums">
                    {Math.round(current.magSize * (1 + current.upgrades.magLevel * 0.25))} ROUNDS
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 mb-1">RELOAD TIME</div>
                  <div className="font-orbitron font-bold text-base text-white tabular-nums">
                    {(current.reloadTime * (1 - current.upgrades.reloadLevel * 0.12)).toFixed(1)}s
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 mb-1">HEADSHOT MULTIPLIER</div>
                  <div className="font-orbitron font-bold text-base text-rose-400 tabular-nums">
                    {current.headshotMultiplier}x CRITICAL
                  </div>
                </div>
              </div>

              {/* Unlock Requirement or Upgrades List */}
              {!current.unlocked ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <div className="font-orbitron font-bold text-amber-300 text-sm">
                      WEAPON LOCKED
                    </div>
                    <div className="text-xs text-gray-400">
                      Acquire from Alien Bio-Research using earned credits.
                    </div>
                  </div>

                  <button
                    disabled={credits < current.unlockCost}
                    onClick={() => onUnlockWeapon(current.id, current.unlockCost)}
                    className={`px-5 py-2.5 rounded-xl font-orbitron font-bold text-sm tracking-wider flex items-center gap-2 transition-all ${
                      credits >= current.unlockCost
                        ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] active:scale-95'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>UNLOCK FOR {current.unlockCost} CR</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-orbitron font-bold text-gray-300 tracking-wider uppercase mb-2">
                    WEAPON ENHANCEMENT MATRIX
                  </div>

                  {/* Damage Upgrade */}
                  <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-between">
                    <div>
                      <div className="font-orbitron font-bold text-xs text-white">
                        THERMAL DAMAGE BOOST
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Tier {damageLevel} / 5 · Increases base kinetic impact by +20%
                      </div>
                    </div>

                    {damageLevel >= 5 ? (
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> MAX
                      </div>
                    ) : (
                      <button
                        disabled={credits < damageCost}
                        onClick={() => onUpgradeWeapon(current.id, 'damageLevel', damageCost)}
                        className={`px-3 py-1.5 rounded-lg font-orbitron text-xs font-bold transition-all ${
                          credits >= damageCost
                            ? 'bg-cyan-500 text-black hover:bg-cyan-400 active:scale-95'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        UPGRADE {damageCost} CR
                      </button>
                    )}
                  </div>

                  {/* Mag Upgrade */}
                  <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-between">
                    <div>
                      <div className="font-orbitron font-bold text-xs text-white">
                        EXPANDED BATTERY / MAG
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Tier {magLevel} / 5 · Increases ammo capacity by +25%
                      </div>
                    </div>

                    {magLevel >= 5 ? (
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> MAX
                      </div>
                    ) : (
                      <button
                        disabled={credits < magCost}
                        onClick={() => onUpgradeWeapon(current.id, 'magLevel', magCost)}
                        className={`px-3 py-1.5 rounded-lg font-orbitron text-xs font-bold transition-all ${
                          credits >= magCost
                            ? 'bg-cyan-500 text-black hover:bg-cyan-400 active:scale-95'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        UPGRADE {magCost} CR
                      </button>
                    )}
                  </div>

                  {/* Reload Upgrade */}
                  <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-between">
                    <div>
                      <div className="font-orbitron font-bold text-xs text-white">
                        RAPID RECHARGE CORE
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Tier {reloadLevel} / 5 · Reduces reload delay by 12%
                      </div>
                    </div>

                    {reloadLevel >= 5 ? (
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> MAX
                      </div>
                    ) : (
                      <button
                        disabled={credits < reloadCost}
                        onClick={() => onUpgradeWeapon(current.id, 'reloadLevel', reloadCost)}
                        className={`px-3 py-1.5 rounded-lg font-orbitron text-xs font-bold transition-all ${
                          credits >= reloadCost
                            ? 'bg-cyan-500 text-black hover:bg-cyan-400 active:scale-95'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        UPGRADE {reloadCost} CR
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 text-black font-orbitron font-bold text-xs tracking-wider hover:bg-cyan-400 active:scale-95 transition-all"
              >
                CLOSE ARMORY
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
