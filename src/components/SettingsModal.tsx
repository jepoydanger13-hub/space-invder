import React from 'react';
import { X, Camera, Compass, Sliders, Volume2, VolumeX, Smartphone, RefreshCw } from 'lucide-react';
import { ARSettings } from '../types/game';

interface SettingsModalProps {
  settings: ARSettings;
  onUpdateSettings: (newSettings: Partial<ARSettings>) => void;
  onCalibrateGyro: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onCalibrateGyro,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fadeIn">
      <div className="bg-gray-950 border border-cyan-500/30 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-[0_0_40px_rgba(0,240,255,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="font-orbitron font-bold text-lg text-white tracking-wider">
              AR & CONTROLS CONFIGURATION
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Camera AR Mode vs Cyber Holodeck */}
          <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="font-orbitron font-bold text-xs text-white">
                  LIVE CAMERA AR MODE
                </div>
                <div className="text-[11px] text-gray-400">
                  {settings.useCamera
                    ? 'Using real-world rear camera view'
                    : 'Using 3D cyber holodeck practice room'}
                </div>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ useCamera: !settings.useCamera })}
              className={`w-12 h-6 rounded-full transition-all relative ${
                settings.useCamera ? 'bg-cyan-500' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                  settings.useCamera ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Gyroscope / Device Orientation Tracking */}
          <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Compass className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="font-orbitron font-bold text-xs text-white">
                  GYROSCOPE MOTION AIM
                </div>
                <div className="text-[11px] text-gray-400">
                  Rotate phone physically to look around
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                onUpdateSettings({ useDeviceOrientation: !settings.useDeviceOrientation })
              }
              className={`w-12 h-6 rounded-full transition-all relative ${
                settings.useDeviceOrientation ? 'bg-cyan-500' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                  settings.useDeviceOrientation ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Gyro Calibrate Button */}
          {settings.useDeviceOrientation && (
            <button
              onClick={onCalibrateGyro}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 font-orbitron text-xs font-bold tracking-wider hover:bg-cyan-900/40 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>RE-CENTER / CALIBRATE GYROSCOPE</span>
            </button>
          )}

          {/* Touch To Aim Toggle */}
          <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="font-orbitron font-bold text-xs text-white">
                  TOUCH-TO-AIM SHOOTING
                </div>
                <div className="text-[11px] text-gray-400">
                  Tap directly on aliens on screen to fire
                </div>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ touchToAim: !settings.touchToAim })}
              className={`w-12 h-6 rounded-full transition-all relative ${
                settings.touchToAim ? 'bg-cyan-500' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                  settings.touchToAim ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Aim Sensitivity Slider */}
          <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <div className="font-orbitron font-bold text-xs text-white">
                AIM SENSITIVITY
              </div>
              <div className="font-mono text-cyan-300 text-xs font-bold">
                {settings.sensitivity.toFixed(1)}x
              </div>
            </div>
            <input
              type="range"
              min="0.4"
              max="2.5"
              step="0.1"
              value={settings.sensitivity}
              onChange={(e) => onUpdateSettings({ sensitivity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Audio Sound FX */}
          <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.sound ? (
                <Volume2 className="w-5 h-5 text-cyan-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-500" />
              )}
              <div>
                <div className="font-orbitron font-bold text-xs text-white">
                  SOUND EFFECTS
                </div>
                <div className="text-[11px] text-gray-400">Procedural audio synthesis</div>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ sound: !settings.sound })}
              className={`w-12 h-6 rounded-full transition-all relative ${
                settings.sound ? 'bg-cyan-500' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                  settings.sound ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Haptics Feedback */}
          <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="font-orbitron font-bold text-xs text-white">
                  HAPTIC VIBRATION
                </div>
                <div className="text-[11px] text-gray-400">Physical recoil feedback on fire and hits</div>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ haptics: !settings.haptics })}
              className={`w-12 h-6 rounded-full transition-all relative ${
                settings.haptics ? 'bg-cyan-500' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                  settings.haptics ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 text-black font-orbitron font-bold text-xs tracking-wider hover:bg-cyan-400 active:scale-95 transition-all"
          >
            CONFIRM & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
