/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { soundEffects } from './audio/SoundEffects';
import { ArmoryModal } from './components/ArmoryModal';
import { BestiaryModal } from './components/BestiaryModal';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { SettingsModal } from './components/SettingsModal';
import { TitleScreen } from './components/TitleScreen';
import { VictoryModal } from './components/VictoryModal';
import { AlienWorld } from './game/AlienWorld';
import { INITIAL_WEAPONS, MISSIONS, loadProgress, saveProgress } from './game/Progression';
import {
  AlienType,
  ARSettings,
  GameMode,
  GameStats,
  OffscreenIndicator,
  PlayerProgress,
  RadarBlip,
  Weapon,
} from './types/game';

type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';

export default function App() {
  // DOM References
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const worldRef = useRef<AlienWorld | null>(null);

  // Persistence State
  const [progress, setProgress] = useState<PlayerProgress>(() => loadProgress());

  // Game Lifecycle State
  const [gameState, setGameState] = useState<GameState>('title');
  const [selectedMode, setSelectedMode] = useState<GameMode>('survival');
  const [currentMissionIdx, setCurrentMissionIdx] = useState<number>(0);

  // Weapons State
  const [weapons, setWeapons] = useState<Weapon[]>(() => {
    const saved = loadProgress();
    return INITIAL_WEAPONS.map((w) => ({
      ...w,
      unlocked: saved.unlockedWeapons.includes(w.id),
      upgrades: saved.upgrades[w.id] || { damageLevel: 0, magLevel: 0, reloadLevel: 0 },
      currentAmmo: Math.round(w.magSize * (1 + (saved.upgrades[w.id]?.magLevel || 0) * 0.25)),
      magSize: Math.round(w.magSize * (1 + (saved.upgrades[w.id]?.magLevel || 0) * 0.25)),
    }));
  });

  const [currentWeaponId, setCurrentWeaponId] = useState<string>('blaster_x1');
  const currentWeapon = weapons.find((w) => w.id === currentWeaponId) || weapons[0];

  // Combat Vitals
  const [health, setHealth] = useState<number>(100);
  const maxHealth = 100;
  const [shield, setShield] = useState<number>(100);
  const maxShield = 100;
  const lastDamageTimeRef = useRef<number>(0);

  // Weapon Firing & Reloading
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [reloadProgress, setReloadProgress] = useState<number>(0);
  const [isFiring, setIsFiring] = useState<boolean>(false);
  const [hitMarker, setHitMarker] = useState<'none' | 'hit' | 'headshot'>('none');
  const lastFireTimeRef = useRef<number>(0);

  // Match / Wave Stats
  const [score, setScore] = useState<number>(0);
  const [kills, setKills] = useState<number>(0);
  const [headshots, setHeadshots] = useState<number>(0);
  const [shotsFired, setShotsFired] = useState<number>(0);
  const [shotsHit, setShotsHit] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [combo, setCombo] = useState<number>(1);
  const [comboTimer, setComboTimer] = useState<number>(0);

  // Mission Objectives
  const [missionKills, setMissionKills] = useState<number>(0);

  // Radar & Offscreen Indicators
  const [radarBlips, setRadarBlips] = useState<RadarBlip[]>([]);
  const [offscreenIndicators, setOffscreenIndicators] = useState<OffscreenIndicator[]>([]);

  // Settings
  const [settings, setSettings] = useState<ARSettings>({
    useCamera: true,
    useDeviceOrientation: true,
    touchToAim: false,
    invertY: false,
    sensitivity: 1.0,
    haptics: true,
    sound: true,
    graphicsQuality: 'high',
  });

  // Modals
  const [isArmoryOpen, setIsArmoryOpen] = useState<boolean>(false);
  const [isBestiaryOpen, setIsBestiaryOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Final Stats for End Game Screen
  const [finalStats, setFinalStats] = useState<GameStats>({
    score: 0,
    kills: 0,
    headshots: 0,
    accuracy: 0,
    shotsFired: 0,
    shotsHit: 0,
    creditsEarned: 0,
    waveReached: 1,
  });

  // Sync settings with audio engine
  useEffect(() => {
    soundEffects.setMuted(!settings.sound);
    soundEffects.setHapticsEnabled(settings.haptics);
  }, [settings.sound, settings.haptics]);

  // Handle Shield Regeneration
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastDamageTimeRef.current > 3500) {
        setShield((prev) => Math.min(maxShield, prev + 5));
      }
    }, 500);
    return () => clearInterval(interval);
  }, [gameState]);

  // Handle Combo Decay
  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => {
      setComboTimer((prev) => {
        if (prev > 0) return prev - 0.2;
        if (combo > 1) setCombo(1);
        return 0;
      });
    }, 200);
    return () => clearInterval(timer);
  }, [gameState, combo]);

  // Callbacks for World
  const onAlienKilled = useCallback(
    (alienType: AlienType, headshot: boolean, baseScore: number, creditsGained: number) => {
      setKills((prev) => prev + 1);
      if (headshot) setHeadshots((prev) => prev + 1);

      setCombo((prev) => Math.min(prev + 1, 8));
      setComboTimer(3.5);

      const multipliedScore = baseScore * Math.max(1, combo);
      setScore((prev) => prev + multipliedScore);

      // Add credits
      setProgress((prev) => {
        const next = {
          ...prev,
          credits: prev.credits + creditsGained,
          xp: prev.xp + Math.round(baseScore * 0.5),
          bestiaryDiscovered: { ...prev.bestiaryDiscovered, [alienType]: true },
        };
        saveProgress(next);
        return next;
      });

      // Track mission objectives
      if (selectedMode === 'mission') {
        setMissionKills((prev) => {
          const next = prev + 1;
          const currentMission = MISSIONS[currentMissionIdx];
          if (next >= currentMission.targetKills) {
            // Mission accomplished!
            handleVictory(currentMission.rewardCredits, currentMission.rewardXP);
          }
          return next;
        });
      } else if (selectedMode === 'boss' && alienType === 'boss') {
        // Boss killed!
        handleVictory(500, 1500);
      }
    },
    [combo, selectedMode, currentMissionIdx]
  );

  const onPlayerDamaged = useCallback((damage: number) => {
    lastDamageTimeRef.current = Date.now();

    setShield((prevShield) => {
      if (prevShield > 0) {
        const remainingShield = Math.max(0, prevShield - damage);
        const absorbed = prevShield - remainingShield;
        const leakDamage = damage - absorbed;

        if (leakDamage > 0) {
          setHealth((prevHealth) => {
            const nextHealth = Math.max(0, prevHealth - leakDamage);
            if (nextHealth <= 0) {
              handleGameOver();
            }
            return nextHealth;
          });
        }
        return remainingShield;
      } else {
        setHealth((prevHealth) => {
          const nextHealth = Math.max(0, prevHealth - damage);
          if (nextHealth <= 0) {
            handleGameOver();
          }
          return nextHealth;
        });
        return 0;
      }
    });
  }, []);

  const onWaveCompleted = useCallback(() => {
    setWave((prev) => prev + 1);
  }, []);

  const onRadarUpdate = useCallback((blips: RadarBlip[], offscreen: OffscreenIndicator[]) => {
    setRadarBlips(blips);
    setOffscreenIndicators(offscreen);
  }, []);

  // Initialize 3D Alien World once
  useEffect(() => {
    if (!canvasContainerRef.current || !videoRef.current) return;

    const world = new AlienWorld(
      canvasContainerRef.current,
      videoRef.current,
      settings,
      {
        onAlienKilled,
        onPlayerDamaged,
        onWaveCompleted,
        onRadarUpdate,
      }
    );

    worldRef.current = world;

    return () => {
      world.dispose();
      worldRef.current = null;
    };
  }, []);

  // Start Game
  const handleStartGame = (mode: GameMode) => {
    setSelectedMode(mode);
    setGameState('playing');
    setHealth(100);
    setShield(100);
    setScore(0);
    setKills(0);
    setHeadshots(0);
    setShotsFired(0);
    setShotsHit(0);
    setWave(1);
    setCombo(1);
    setMissionKills(0);

    // Reset weapons ammo
    setWeapons((prev) =>
      prev.map((w) => ({
        ...w,
        currentAmmo: w.magSize,
      }))
    );

    if (worldRef.current) {
      worldRef.current.start(mode, 1);
    }
  };

  const handlePause = () => {
    setGameState('paused');
    if (worldRef.current) worldRef.current.pause();
  };

  const handleResume = () => {
    setGameState('playing');
    if (worldRef.current) worldRef.current.resume();
  };

  const handleRestart = () => {
    handleStartGame(selectedMode);
  };

  const handleReturnToTitle = () => {
    setGameState('title');
    if (worldRef.current) {
      worldRef.current.pause();
    }
  };

  const handleGameOver = () => {
    setGameState('gameover');
    if (worldRef.current) worldRef.current.pause();

    const stats: GameStats = {
      score,
      kills,
      headshots,
      accuracy: shotsFired > 0 ? (shotsHit / shotsFired) * 100 : 0,
      shotsFired,
      shotsHit,
      creditsEarned: Math.round(kills * 12 + headshots * 15),
      waveReached: wave,
    };
    setFinalStats(stats);

    // Update high score
    if (score > progress.highScore) {
      setProgress((prev) => {
        const next = { ...prev, highScore: score };
        saveProgress(next);
        return next;
      });
    }
  };

  const handleVictory = (rewardCredits: number, rewardXP: number) => {
    setGameState('victory');
    if (worldRef.current) worldRef.current.pause();

    const stats: GameStats = {
      score,
      kills,
      headshots,
      accuracy: shotsFired > 0 ? (shotsHit / shotsFired) * 100 : 0,
      shotsFired,
      shotsHit,
      creditsEarned: rewardCredits,
      waveReached: wave,
    };
    setFinalStats(stats);

    setProgress((prev) => {
      const next = {
        ...prev,
        credits: prev.credits + rewardCredits,
        xp: prev.xp + rewardXP,
        highScore: Math.max(prev.highScore, score),
      };
      saveProgress(next);
      return next;
    });
  };

  // Reload Weapon Logic
  const handleReload = () => {
    if (isReloading || currentWeapon.currentAmmo === currentWeapon.magSize) return;

    setIsReloading(true);
    setReloadProgress(0);
    soundEffects.playReload();

    const reloadDuration = currentWeapon.reloadTime * 1000;
    const intervalTime = 50;
    const steps = reloadDuration / intervalTime;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      setReloadProgress(Math.min(1, step / steps));
      if (step >= steps) {
        clearInterval(interval);
        setIsReloading(false);
        setReloadProgress(0);

        setWeapons((prev) =>
          prev.map((w) =>
            w.id === currentWeapon.id ? { ...w, currentAmmo: w.magSize } : w
          )
        );
      }
    }, intervalTime);
  };

  // Fire Weapon
  const handleFire = (touchScreenCoords?: { x: number; y: number }) => {
    if (gameState !== 'playing' || isReloading) return;

    // Check rate of fire
    const now = Date.now();
    const minFireDelay = (1 / currentWeapon.fireRate) * 1000;
    if (now - lastFireTimeRef.current < minFireDelay) return;
    lastFireTimeRef.current = now;

    // Check ammo
    if (currentWeapon.currentAmmo <= 0) {
      soundEffects.playDryFire();
      handleReload();
      return;
    }

    // Deduct 1 ammo
    setWeapons((prev) =>
      prev.map((w) =>
        w.id === currentWeapon.id ? { ...w, currentAmmo: w.currentAmmo - 1 } : w
      )
    );

    setIsFiring(true);
    setTimeout(() => setIsFiring(false), 90);
    setShotsFired((prev) => prev + 1);

    // Call 3D engine raycast
    if (worldRef.current) {
      const result = worldRef.current.shoot(currentWeapon, touchScreenCoords);

      if (result.hit) {
        setShotsHit((prev) => prev + 1);
        setHitMarker(result.headshot ? 'headshot' : 'hit');
        setTimeout(() => setHitMarker('none'), 180);
      }
    }
  };

  // Touch on screen shooting handler when touchToAim is enabled
  const handleScreenTouch = (e: React.PointerEvent) => {
    if (!settings.touchToAim || gameState !== 'playing') return;
    handleFire({ x: e.clientX, y: e.clientY });
  };

  // Keyboard Shortcuts (Space to fire, R to reload, 1-4 switch weapon, Esc to pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'title') {
        if (e.code === 'Space' || e.code === 'Enter') {
          handleStartGame(selectedMode);
        }
        return;
      }

      if (gameState === 'playing') {
        if (e.code === 'Space') {
          handleFire();
        } else if (e.code === 'KeyR') {
          handleReload();
        } else if (e.code === 'Digit1' && weapons[0]?.unlocked) {
          setCurrentWeaponId(weapons[0].id);
        } else if (e.code === 'Digit2' && weapons[1]?.unlocked) {
          setCurrentWeaponId(weapons[1].id);
        } else if (e.code === 'Digit3' && weapons[2]?.unlocked) {
          setCurrentWeaponId(weapons[2].id);
        } else if (e.code === 'Digit4' && weapons[3]?.unlocked) {
          setCurrentWeaponId(weapons[3].id);
        } else if (e.code === 'Escape') {
          handlePause();
        }
      } else if (gameState === 'paused' && e.code === 'Escape') {
        handleResume();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, currentWeapon, isReloading, weapons, selectedMode]);

  // Unlock Weapon Handler
  const handleUnlockWeapon = (weaponId: string, cost: number) => {
    if (progress.credits < cost) return;

    setProgress((prev) => {
      const next = {
        ...prev,
        credits: prev.credits - cost,
        unlockedWeapons: [...prev.unlockedWeapons, weaponId],
      };
      saveProgress(next);
      return next;
    });

    setWeapons((prev) =>
      prev.map((w) => (w.id === weaponId ? { ...w, unlocked: true } : w))
    );
  };

  // Upgrade Weapon Handler
  const handleUpgradeWeapon = (
    weaponId: string,
    stat: 'damageLevel' | 'magLevel' | 'reloadLevel',
    cost: number
  ) => {
    if (progress.credits < cost) return;

    setProgress((prev) => {
      const currentWeaponUpgrades = prev.upgrades[weaponId] || {
        damageLevel: 0,
        magLevel: 0,
        reloadLevel: 0,
      };
      const nextUpgrades = {
        ...currentWeaponUpgrades,
        [stat]: currentWeaponUpgrades[stat] + 1,
      };

      const next = {
        ...prev,
        credits: prev.credits - cost,
        upgrades: { ...prev.upgrades, [weaponId]: nextUpgrades },
      };
      saveProgress(next);
      return next;
    });

    setWeapons((prev) =>
      prev.map((w) => {
        if (w.id === weaponId) {
          const nextUpgrades = {
            ...w.upgrades,
            [stat]: w.upgrades[stat] + 1,
          };
          const newMagSize = Math.round(
            w.magSize * (stat === 'magLevel' ? 1.25 : 1)
          );
          return {
            ...w,
            upgrades: nextUpgrades,
            magSize: newMagSize,
          };
        }
        return w;
      })
    );
  };

  const handleUpdateSettings = (newSettings: Partial<ARSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...newSettings };
      if (worldRef.current && newSettings.useCamera !== undefined) {
        worldRef.current.toggleCameraMode(newSettings.useCamera);
      }
      return next;
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none touch-none">
      {/* 1. Live Rear Camera Feed Video (Behind 3D Scene) */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          settings.useCamera ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 2. Three.js WebGL Canvas Mount Container */}
      <div
        ref={canvasContainerRef}
        onPointerDown={handleScreenTouch}
        className="absolute inset-0 w-full h-full z-0 touch-none"
      />

      {/* 3. In-Game HUD (During active gameplay) */}
      {gameState === 'playing' && (
        <GameHUD
          score={score}
          kills={kills}
          headshots={headshots}
          health={health}
          maxHealth={maxHealth}
          shield={shield}
          maxShield={maxShield}
          wave={wave}
          mode={selectedMode}
          objectiveProgress={
            selectedMode === 'mission'
              ? {
                  current: missionKills,
                  total: MISSIONS[currentMissionIdx].targetKills,
                  label: MISSIONS[currentMissionIdx].title,
                }
              : undefined
          }
          combo={combo}
          comboTimer={comboTimer}
          currentWeapon={currentWeapon}
          weapons={weapons}
          isReloading={isReloading}
          reloadProgress={reloadProgress}
          hitMarker={hitMarker}
          isFiring={isFiring}
          touchToAim={settings.touchToAim}
          radarBlips={radarBlips}
          offscreenIndicators={offscreenIndicators}
          onFire={() => handleFire()}
          onReload={handleReload}
          onSelectWeapon={(id) => setCurrentWeaponId(id)}
          onToggleTouchToAim={() =>
            handleUpdateSettings({ touchToAim: !settings.touchToAim })
          }
          onPause={handlePause}
          onCalibrateGyro={() => worldRef.current?.calibrateGyro()}
        />
      )}

      {/* 4. Title Screen Game Shell */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onOpenArmory={() => setIsArmoryOpen(true)}
          onOpenBestiary={() => setIsBestiaryOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          credits={progress.credits}
          highScore={progress.highScore}
          selectedMode={selectedMode}
          onSelectMode={setSelectedMode}
        />
      )}

      {/* 5. Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onReturnToTitle={handleReturnToTitle}
        />
      )}

      {/* 6. Game Over Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          stats={finalStats}
          onRestart={handleRestart}
          onReturnToTitle={handleReturnToTitle}
        />
      )}

      {/* 7. Victory Modal */}
      {gameState === 'victory' && (
        <VictoryModal
          stats={finalStats}
          rewardCredits={finalStats.creditsEarned}
          rewardXP={800}
          onContinue={() => {
            if (selectedMode === 'mission') {
              const nextIdx = (currentMissionIdx + 1) % MISSIONS.length;
              setCurrentMissionIdx(nextIdx);
            }
            handleStartGame(selectedMode);
          }}
          onReturnToTitle={handleReturnToTitle}
        />
      )}

      {/* Modals from Menu/Pause */}
      {isArmoryOpen && (
        <ArmoryModal
          weapons={weapons}
          credits={progress.credits}
          onClose={() => setIsArmoryOpen(false)}
          onUnlockWeapon={handleUnlockWeapon}
          onUpgradeWeapon={handleUpgradeWeapon}
        />
      )}

      {isBestiaryOpen && (
        <BestiaryModal
          discovered={progress.bestiaryDiscovered}
          onClose={() => setIsBestiaryOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onCalibrateGyro={() => worldRef.current?.calibrateGyro()}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
