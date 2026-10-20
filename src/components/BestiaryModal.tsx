import React, { useState } from 'react';
import { X, BookOpen, Skull, AlertCircle, Eye, Activity } from 'lucide-react';
import { AlienType } from '../types/game';
import { ALIEN_SPECS } from '../game/Progression';

interface BestiaryModalProps {
  discovered: Record<AlienType, boolean>;
  onClose: () => void;
}

export const BestiaryModal: React.FC<BestiaryModalProps> = ({ onClose }) => {
  const alienTypes: AlienType[] = ['crawler', 'stalker', 'flying', 'brute', 'boss'];
  const [selectedType, setSelectedType] = useState<AlienType>('crawler');

  const spec = ALIEN_SPECS[selectedType];

  return (
    <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fadeIn">
      <div className="bg-gray-950 border border-emerald-500/30 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(16,185,129,0.2)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-800 bg-gray-900/60">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="font-orbitron font-bold text-lg sm:text-xl text-white tracking-wider">
                EXTRATERRESTRIAL CODEX
              </h2>
              <p className="text-xs text-gray-400 font-mono">TACTICAL DOSSIER & WEAKNESS DATABASE</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-y-auto">
          {/* Alien Species Selector */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-gray-800 p-3 sm:p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
            {alienTypes.map((type) => {
              const info = ALIEN_SPECS[type];
              const isSelected = type === selectedType;

              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between shrink-0 md:shrink ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                      : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: info.color }}
                    />
                    <div>
                      <div className="font-orbitron font-bold text-xs sm:text-sm text-gray-200">
                        {info.name}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                        THREAT: {type === 'boss' ? 'APEX CLASS' : type === 'brute' ? 'HEAVY' : 'SWARM'}
                      </div>
                    </div>
                  </div>

                  <Skull className="w-4 h-4 text-emerald-400/80 hidden md:block" />
                </button>
              );
            })}
          </div>

          {/* Dossier Detail */}
          <div className="md:col-span-8 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] uppercase tracking-wider">
                  IDENTIFIED SPECIMEN
                </span>
                <span className="text-xs text-gray-400 font-mono">CLASS: {selectedType.toUpperCase()}</span>
              </div>

              <h3
                className="font-orbitron font-black text-2xl tracking-wider mb-2"
                style={{ color: spec.color }}
              >
                {spec.name}
              </h3>

              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-6 bg-gray-900/40 p-3.5 rounded-xl border border-gray-800">
                {spec.lore}
              </p>

              {/* Combat Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 text-xs">
                <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    <Activity className="w-3.5 h-3.5 text-rose-400" />
                    <span>HEALTH PROFILE</span>
                  </div>
                  <div className="font-orbitron font-bold text-base text-white tabular-nums">
                    {spec.maxHealth} HP
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>ATTACK STRENGTH</span>
                  </div>
                  <div className="font-orbitron font-bold text-base text-amber-300 tabular-nums">
                    {spec.attackPower} DMG
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>MOVEMENT VECTOR</span>
                  </div>
                  <div className="font-orbitron font-bold text-base text-cyan-300">
                    {spec.flying ? 'AERIAL HOVER' : 'SURFACE RUNNER'}
                  </div>
                </div>
              </div>

              {/* Weak point intelligence */}
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
                <div className="font-orbitron font-bold text-xs text-cyan-300 mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  TACTICAL WEAKNESS INTEL
                </div>
                <div className="text-xs text-gray-300 leading-relaxed">
                  {selectedType === 'crawler' &&
                    'Aim directly for the cranial mandibular pincers at the front center. A clean headshot causes biological shock and instant destruction.'}
                  {selectedType === 'stalker' &&
                    'The elongated cranial crest houses its neural optics. Hits to the glowing visor deal 2.5x critical damage and stun claw swings.'}
                  {selectedType === 'flying' &&
                    'The central optical orb and dual wing joints. Auto-rifles can rapidly shred its aerial mobility.'}
                  {selectedType === 'brute' &&
                    'Armored head plates can be shattered with Nova Plasma or Railgun fire. Avoid standard pistol fire against heavy body armor.'}
                  {selectedType === 'boss' &&
                    'Phase 1: Destroy the 4 orbital crystal spires to bring down its invulnerability shield. Phase 2: Unleash heavy firepower on the imperial crown head.'}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 text-black font-orbitron font-bold text-xs tracking-wider hover:bg-emerald-400 active:scale-95 transition-all"
              >
                RETURN TO MENU
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
