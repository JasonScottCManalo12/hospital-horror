/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Door,
  GameStatus,
  Ghost,
  HospitalMap,
  KeyId,
  LoreNote,
  Player,
  WorldItem,
} from './types/horrorGame';
import { generateHospitalMap, KEY_DEFINITIONS, LORE_NOTES } from './services/hospitalGenerator';
import { createGhosts, updateGhost } from './services/ghostAI';
import { horrorAudio } from './services/horrorAudio';
import { HorrorViewport } from './components/HorrorViewport';
import { HorrorHUD } from './components/HorrorHUD';
import { MobileControls } from './components/MobileControls';
import { LoreModal } from './components/LoreModal';
import { HospitalMapModal } from './components/HospitalMapModal';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { StartMenuModal } from './components/StartMenuModal';
import { HidingOverlay } from './components/HidingOverlay';

export default function App() {
  const [lang, setLang] = useState<'tl' | 'en'>('tl');
  const [gameStatus, setGameStatus] = useState<GameStatus>('menu');
  const [isMuted, setIsMuted] = useState(false);

  // Map and World State
  const [map, setMap] = useState<HospitalMap>(() => generateHospitalMap());
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [player, setPlayer] = useState<Player>({
    x: 11.5,
    y: 12.5,
    angle: -Math.PI / 2,
    health: 100,
    sanity: 100,
    stamina: 100,
    isSprinting: false,
    flashlightOn: true,
    flashlightBattery: 100,
    isHiding: false,
    hidingLockerId: null,
    inventoryKeys: [],
    notesRead: [],
  });

  // UI & Interaction Modals
  const [activeNote, setActiveNote] = useState<LoreNote | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [killerGhost, setKillerGhost] = useState<Ghost | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Jumpscare animation state
  const [isJumpscare, setIsJumpscare] = useState(false);
  const [activeJumpscareGhost, setActiveJumpscareGhost] = useState<Ghost | null>(null);

  // Input states
  const keysDown = useRef<Record<string, boolean>>({});
  const mobileInputs = useRef({
    forward: false,
    backward: false,
    turnLeft: false,
    turnRight: false,
    sprint: false,
  });

  // Closest interactable cache
  const [closestInteractable, setClosestInteractable] = useState<{
    type: 'item' | 'door';
    obj: WorldItem | Door;
    dist: number;
  } | null>(null);

  // Show quick notification toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  }, []);

  // Initialize fresh new game run
  const startNewGame = useCallback(() => {
    horrorAudio.init();
    horrorAudio.resume();

    const newMap = generateHospitalMap(Date.now());
    const initialGhosts = createGhosts(newMap);

    setMap(newMap);
    setGhosts(initialGhosts);
    setPlayer({
      x: newMap.playerSpawn.x,
      y: newMap.playerSpawn.y,
      angle: newMap.playerSpawn.angle,
      health: 100,
      sanity: 100,
      stamina: 100,
      isSprinting: false,
      flashlightOn: true,
      flashlightBattery: 100,
      isHiding: false,
      hidingLockerId: null,
      inventoryKeys: [],
      notesRead: [],
    });

    setKillerGhost(null);
    setActiveNote(null);
    setShowMapModal(false);
    setIsJumpscare(false);
    setActiveJumpscareGhost(null);
    setGameStartTime(Date.now());
    setElapsedSeconds(0);
    setGameStatus('playing');

    showToast(lang === 'tl' ? 'Hanapin ang 4 na susi para makatakas!' : 'Find the 4 keys to escape!');
  }, [lang, showToast]);

  // Flashlight toggle handler
  const handleToggleFlashlight = useCallback(() => {
    setPlayer((prev) => {
      if (prev.flashlightBattery <= 0) return prev;
      const nextState = !prev.flashlightOn;
      horrorAudio.playFlashlightClick(nextState);
      return { ...prev, flashlightOn: nextState };
    });
  }, []);

  // Interact Action (E key or tap)
  const handleInteract = useCallback(() => {
    if (player.isHiding) {
      // Exit hiding
      setPlayer((prev) => ({ ...prev, isHiding: false, hidingLockerId: null }));
      horrorAudio.playDoorCreak(true);
      showToast(lang === 'tl' ? 'Lumabas ka na sa locker' : 'You stepped out of the locker');
      return;
    }

    if (!closestInteractable) return;

    if (closestInteractable.type === 'item') {
      const item = closestInteractable.obj as WorldItem;

      if (item.type === 'key' && item.keyId) {
        const keyDef = KEY_DEFINITIONS[item.keyId];
        horrorAudio.playKeyPickup();
        setPlayer((prev) => ({
          ...prev,
          inventoryKeys: prev.inventoryKeys.includes(item.keyId!) ? prev.inventoryKeys : [...prev.inventoryKeys, item.keyId!],
        }));

        // Mark picked up in map
        setMap((prev) => ({
          ...prev,
          items: prev.items.map((i) => (i.id === item.id ? { ...i, pickedUp: true } : i)),
        }));

        showToast(
          lang === 'tl'
            ? `Nakuha mo ang ${keyDef.name}! (${keyDef.roomDestination})`
            : `Acquired ${keyDef.nameEn}! (${keyDef.roomDestination})`
        );
      } else if (item.type === 'battery') {
        horrorAudio.playItemUse();
        setPlayer((prev) => ({
          ...prev,
          flashlightBattery: Math.min(100, prev.flashlightBattery + 45),
        }));
        setMap((prev) => ({
          ...prev,
          items: prev.items.map((i) => (i.id === item.id ? { ...i, pickedUp: true } : i)),
        }));
        showToast(lang === 'tl' ? 'Baterya napulot! (+45% Ilaw)' : 'Battery found! (+45% Flashlight)');
      } else if (item.type === 'medkit') {
        horrorAudio.playItemUse();
        setPlayer((prev) => ({
          ...prev,
          sanity: Math.min(100, prev.sanity + 40),
          health: Math.min(100, prev.health + 30),
        }));
        setMap((prev) => ({
          ...prev,
          items: prev.items.map((i) => (i.id === item.id ? { ...i, pickedUp: true } : i)),
        }));
        showToast(lang === 'tl' ? 'Ginamit ang pampakalma! (+40% Katatagan)' : 'Sedative applied! (+40% Sanity)');
      } else if (item.type === 'note' && item.noteId) {
        const lore = LORE_NOTES[item.noteId];
        if (lore) {
          setActiveNote(lore);
          setPlayer((prev) => ({
            ...prev,
            notesRead: prev.notesRead.includes(item.noteId!) ? prev.notesRead : [...prev.notesRead, item.noteId!],
          }));
        }
      } else if (item.type === 'locker') {
        horrorAudio.playDoorCreak(true);
        setPlayer((prev) => ({ ...prev, isHiding: true, hidingLockerId: item.id }));
      }
    } else if (closestInteractable.type === 'door') {
      const door = closestInteractable.obj as Door;

      if (door.isExit) {
        // Needs master key
        if (player.inventoryKeys.includes('master_key')) {
          horrorAudio.playVictoryBells();
          setGameStatus('victory');
        } else {
          horrorAudio.playDoorLocked();
          showToast(
            lang === 'tl'
              ? 'Naka-kadena ang Pangunahing Lagusan! Kailangan ng Master Key mula sa Morgue!'
              : 'Main Exit is chained! Requires Master Key from the Morgue!'
          );
        }
      } else if (door.requiredKey) {
        const hasReqKey = player.inventoryKeys.includes(door.requiredKey);
        const keyDef = KEY_DEFINITIONS[door.requiredKey];

        if (hasReqKey) {
          horrorAudio.playDoorCreak(true);
          // Unlock door on grid
          setMap((prev) => {
            const newGrid = prev.grid.map((row) => [...row]);
            newGrid[door.y][door.x] = 0; // Turn into empty floor
            const newDoors = prev.doors.map((d) => (d.x === door.x && d.y === door.y ? { ...d, isOpen: true } : d));
            return { ...prev, grid: newGrid, doors: newDoors };
          });
          showToast(lang === 'tl' ? `Nabuksan ang ${door.name}!` : `Unlocked ${door.nameEn}!`);
        } else {
          horrorAudio.playDoorLocked();
          showToast(
            lang === 'tl'
              ? `Naka-lock! Kailangan ng: ${keyDef.name}`
              : `Locked! Requires: ${keyDef.nameEn}`
          );
        }
      }
    }
  }, [closestInteractable, player.isHiding, player.inventoryKeys, lang, showToast]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Audio resume on first user key
      horrorAudio.resume();

      keysDown.current[e.code] = true;

      if (e.code === 'KeyF') {
        handleToggleFlashlight();
      } else if (e.code === 'KeyE' || e.code === 'Space') {
        if (activeNote) {
          setActiveNote(null);
        } else if (showMapModal) {
          setShowMapModal(false);
        } else {
          handleInteract();
        }
      } else if (e.code === 'KeyM') {
        setShowMapModal((prev) => !prev);
      } else if (e.code === 'Escape') {
        if (activeNote) {
          setActiveNote(null);
        } else if (showMapModal) {
          setShowMapModal(false);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleToggleFlashlight, handleInteract, activeNote, showMapModal]);

  // Main Simulation Loop (Movement, Collision, Ghost AI, Sanity, Battery)
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    let lastTime = performance.now();
    let footstepTimer = 0;
    let animationFrameId: number;

    const gameTick = (currentTime: number) => {
      const deltaTime = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      setElapsedSeconds((Date.now() - gameStartTime) / 1000);

      // 1. Process Player Input & Movement
      const keys = keysDown.current;
      const mob = mobileInputs.current;

      const isForward = keys['KeyW'] || keys['ArrowUp'] || mob.forward;
      const isBackward = keys['KeyS'] || keys['ArrowDown'] || mob.backward;
      const isTurnLeft = keys['KeyA'] || keys['ArrowLeft'] || mob.turnLeft;
      const isTurnRight = keys['KeyD'] || keys['ArrowRight'] || mob.turnRight;
      const wantsSprint = (keys['ShiftLeft'] || keys['ShiftRight'] || mob.sprint) && player.stamina > 10;

      setPlayer((prev) => {
        if (prev.isHiding) {
          // Slowly recover sanity when safely hidden
          const recoveredSanity = Math.min(100, prev.sanity + deltaTime * 2.5);
          return { ...prev, sanity: recoveredSanity };
        }

        // Angle rotation
        const turnSpeed = 2.4;
        let newAngle = prev.angle;
        if (isTurnLeft) newAngle -= turnSpeed * deltaTime;
        if (isTurnRight) newAngle += turnSpeed * deltaTime;

        // Stamina and Speed
        let moveSpeed = 2.6; // Base walk speed
        let newStamina = prev.stamina;
        let isActuallySprinting = false;

        if (wantsSprint && (isForward || isBackward)) {
          isActuallySprinting = true;
          moveSpeed = 4.6;
          newStamina = Math.max(0, prev.stamina - deltaTime * 18);
        } else {
          newStamina = Math.min(100, prev.stamina + deltaTime * 10);
        }

        // Move calculation
        let dx = 0;
        let dy = 0;
        if (isForward) {
          dx += Math.cos(newAngle) * moveSpeed * deltaTime;
          dy += Math.sin(newAngle) * moveSpeed * deltaTime;
        }
        if (isBackward) {
          dx -= Math.cos(newAngle) * (moveSpeed * 0.7) * deltaTime;
          dy -= Math.sin(newAngle) * (moveSpeed * 0.7) * deltaTime;
        }

        // Footstep sound trigger
        if ((isForward || isBackward) && (dx !== 0 || dy !== 0)) {
          footstepTimer += deltaTime;
          const stepInterval = isActuallySprinting ? 0.28 : 0.48;
          if (footstepTimer >= stepInterval) {
            footstepTimer = 0;
            horrorAudio.playFootstep(isActuallySprinting);
          }
        }

        // Collision detection with map grid (Radius = 0.28)
        let newX = prev.x;
        let newY = prev.y;
        const targetX = prev.x + dx;
        const targetY = prev.y + dy;
        const radius = 0.28;

        const isColliding = (checkX: number, checkY: number) => {
          const minGX = Math.floor(checkX - radius);
          const maxGX = Math.floor(checkX + radius);
          const minGY = Math.floor(checkY - radius);
          const maxGY = Math.floor(checkY + radius);

          for (let gy = minGY; gy <= maxGY; gy++) {
            for (let gx = minGX; gx <= maxGX; gx++) {
              if (gx < 0 || gx >= map.width || gy < 0 || gy >= map.height) return true;
              const tile = map.grid[gy][gx];
              // Wall, locked door, exit door, or obstacle
              if (tile === 1 || tile === 2 || tile === 3 || tile === 4) return true;
            }
          }
          return false;
        };

        if (!isColliding(targetX, prev.y)) newX = targetX;
        if (!isColliding(prev.x, targetY)) newY = targetY;

        // Flashlight Battery Drain (approx 1% every 3.5s when active)
        let newBattery = prev.flashlightBattery;
        let newFlashlightOn = prev.flashlightOn;
        if (prev.flashlightOn) {
          newBattery = Math.max(0, prev.flashlightBattery - deltaTime * 0.32);
          if (newBattery <= 0) {
            newFlashlightOn = false;
          }
        }

        // Sanity Drain if pitch dark
        let newSanity = prev.sanity;
        if (!newFlashlightOn) {
          newSanity = Math.max(0, prev.sanity - deltaTime * 1.8);
        }

        return {
          ...prev,
          x: newX,
          y: newY,
          angle: newAngle,
          stamina: newStamina,
          isSprinting: isActuallySprinting,
          flashlightBattery: newBattery,
          flashlightOn: newFlashlightOn,
          sanity: newSanity,
        };
      });

      // 2. Check Nearest Interactables
      let closestObj: { type: 'item' | 'door'; obj: WorldItem | Door; dist: number } | null = null;
      let minInteractDist = 1.6;

      // Doors
      map.doors.forEach((door) => {
        if (!door.isOpen) {
          const dist = Math.hypot(door.x + 0.5 - player.x, door.y + 0.5 - player.y);
          if (dist < minInteractDist) {
            minInteractDist = dist;
            closestObj = { type: 'door', obj: door, dist };
          }
        }
      });

      // Items
      map.items.forEach((item) => {
        if (!item.pickedUp) {
          const dist = Math.hypot(item.x + 0.5 - player.x, item.y + 0.5 - player.y);
          if (dist < minInteractDist) {
            minInteractDist = dist;
            closestObj = { type: 'item', obj: item, dist };
          }
        }
      });

      setClosestInteractable(closestObj);

      // 3. Update Ghost AI
      let closestGhostDistance = 999;
      let anyGhostChasing = false;

      setGhosts((currentGhosts) => {
        return currentGhosts.map((ghost) => {
          const { ghost: updated, attackedPlayer } = updateGhost(ghost, player, map, deltaTime);

          if (updated.distanceToPlayer < closestGhostDistance) {
            closestGhostDistance = updated.distanceToPlayer;
          }
          if (updated.state === 'chase') {
            anyGhostChasing = true;
          }

          // If ghost attacked player!
          if (attackedPlayer) {
            setPlayer((p) => {
              const damagedSanity = Math.max(0, p.sanity - 45);
              const damagedHealth = Math.max(0, p.health - 50);

              // Jumpscare trigger
              setIsJumpscare(true);
              setActiveJumpscareGhost(updated);
              setTimeout(() => {
                setIsJumpscare(false);
                setActiveJumpscareGhost(null);
              }, 950);

              // Check fatal condition
              if (damagedSanity <= 0 || damagedHealth <= 0) {
                setKillerGhost(updated);
                setGameStatus('gameover');
              }

              return { ...p, sanity: damagedSanity, health: damagedHealth };
            });
          }

          return updated;
        });
      });

      // 4. Update Horror Audio Proximity Effects
      horrorAudio.updateProximity(closestGhostDistance, player.sanity, anyGhostChasing);

      animationFrameId = requestAnimationFrame(gameTick);
    };

    animationFrameId = requestAnimationFrame(gameTick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStatus, map, player, gameStartTime]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none font-sans">
      {/* 3D First-Person Viewport Canvas */}
      <HorrorViewport
        player={player}
        ghosts={ghosts}
        map={map}
        closestInteractable={closestInteractable}
        onInteract={handleInteract}
        isJumpscare={isJumpscare}
        activeJumpscareGhost={activeJumpscareGhost}
      />

      {/* Atmospheric In-Game HUD */}
      {gameStatus === 'playing' && !player.isHiding && (
        <HorrorHUD
          player={player}
          ghosts={ghosts}
          map={map}
          isMuted={isMuted}
          onToggleMute={() => {
            const nextMuted = !isMuted;
            setIsMuted(nextMuted);
            horrorAudio.setMute(nextMuted);
          }}
          onToggleFlashlight={handleToggleFlashlight}
          lang={lang}
          onToggleLang={() => setLang((l) => (l === 'tl' ? 'en' : 'tl'))}
          onOpenMap={() => setShowMapModal(true)}
        />
      )}

      {/* Locker Hiding Overlay */}
      {player.isHiding && (
        <HidingOverlay
          ghosts={ghosts}
          onExitHiding={handleInteract}
          lang={lang}
        />
      )}

      {/* Mobile / Touch Controls */}
      {gameStatus === 'playing' && !player.isHiding && (
        <MobileControls
          onMoveForward={(active) => { mobileInputs.current.forward = active; }}
          onMoveBackward={(active) => { mobileInputs.current.backward = active; }}
          onTurnLeft={(active) => { mobileInputs.current.turnLeft = active; }}
          onTurnRight={(active) => { mobileInputs.current.turnRight = active; }}
          onToggleSprint={(active) => { mobileInputs.current.sprint = active; }}
          onToggleFlashlight={handleToggleFlashlight}
          onInteract={handleInteract}
          onOpenMap={() => setShowMapModal(true)}
          isSprinting={player.isSprinting}
          flashlightOn={player.flashlightOn}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/90 border border-amber-500/80 text-amber-300 px-5 py-2 rounded-full text-xs font-mono font-bold tracking-wider shadow-2xl backdrop-blur-md z-40 animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Start Menu Modal */}
      {gameStatus === 'menu' && (
        <StartMenuModal
          onStartGame={startNewGame}
          lang={lang}
          onToggleLang={() => setLang((l) => (l === 'tl' ? 'en' : 'tl'))}
        />
      )}

      {/* Lore Note Reading Modal */}
      {activeNote && (
        <LoreModal
          note={activeNote}
          lang={lang}
          onClose={() => setActiveNote(null)}
        />
      )}

      {/* Architectural Map Modal */}
      {showMapModal && (
        <HospitalMapModal
          map={map}
          player={player}
          lang={lang}
          onClose={() => setShowMapModal(false)}
        />
      )}

      {/* Game Over Modal */}
      {gameStatus === 'gameover' && (
        <GameOverModal
          killerGhost={killerGhost}
          keysCollected={player.inventoryKeys.length}
          lang={lang}
          onRestart={startNewGame}
        />
      )}

      {/* Victory Escape Modal */}
      {gameStatus === 'victory' && (
        <VictoryModal
          timeElapsed={elapsedSeconds}
          notesReadCount={player.notesRead.length}
          remainingSanity={player.sanity}
          lang={lang}
          onRestart={startNewGame}
        />
      )}
    </div>
  );
}
