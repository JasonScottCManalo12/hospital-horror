import React, { useState } from 'react';
import { Ghost, HospitalMap, KeyId, Player } from '../types/horrorGame';
import { KEY_DEFINITIONS } from '../services/hospitalGenerator';
import {
  Activity,
  Battery,
  BatteryCharging,
  Eye,
  Flashlight,
  FlashlightOff,
  Heart,
  Key,
  Lock,
  MapPin,
  Volume2,
  VolumeX,
  Compass,
} from 'lucide-react';

interface HorrorHUDProps {
  player: Player;
  ghosts: Ghost[];
  map: HospitalMap;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleFlashlight: () => void;
  lang: 'tl' | 'en';
  onToggleLang: () => void;
  onOpenMap: () => void;
}

export const HorrorHUD: React.FC<HorrorHUDProps> = ({
  player,
  ghosts,
  map,
  isMuted,
  onToggleMute,
  onToggleFlashlight,
  lang,
  onToggleLang,
  onOpenMap,
}) => {
  const [showMinimap, setShowMinimap] = useState(true);

  // Compute closest ghost distance for proximity warning
  let closestDist = 999;
  let chasingGhost: Ghost | null = null;
  ghosts.forEach((g) => {
    if (g.distanceToPlayer < closestDist) closestDist = g.distanceToPlayer;
    if (g.state === 'chase') chasingGhost = g;
  });

  const keysFoundCount = player.inventoryKeys.length;
  const isHeartPounding = closestDist < 7.0 || player.sanity < 40;

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 z-20">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Player Vitals (Sanity, Heartbeat, Stamina, Battery) */}
        <div className="flex flex-col gap-2 bg-black/75 border border-zinc-800/80 p-3 rounded-lg backdrop-blur-md pointer-events-auto min-w-[240px]">
          {/* Sanity / Katatagan ng Isip */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              {lang === 'tl' ? 'Katatagan ng Isip' : 'Sanity'}
            </span>
            <span className={`font-mono text-xs font-bold ${player.sanity > 60 ? 'text-emerald-400' : player.sanity > 30 ? 'text-amber-400' : 'text-red-500 animate-pulse'}`}>
              {Math.round(player.sanity)}%
            </span>
          </div>
          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                player.sanity > 60
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : player.sanity > 30
                  ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                  : 'bg-gradient-to-r from-red-600 to-rose-400'
              }`}
              style={{ width: `${Math.max(0, player.sanity)}%` }}
            />
          </div>

          {/* Stamina / Pagtakbo */}
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              {lang === 'tl' ? 'Lakas / Pagtakbo' : 'Stamina'}
            </span>
            <span className="font-mono text-xs text-cyan-400 font-bold">
              {Math.round(player.stamina)}%
            </span>
          </div>
          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-150"
              style={{ width: `${Math.max(0, player.stamina)}%` }}
            />
          </div>

          {/* Flashlight Battery */}
          <div className="flex items-center justify-between text-xs mt-1">
            <button
              onClick={onToggleFlashlight}
              className="flex items-center gap-1.5 font-semibold text-zinc-300 hover:text-amber-300 transition-colors pointer-events-auto"
            >
              {player.flashlightOn ? (
                <Flashlight className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <FlashlightOff className="w-3.5 h-3.5 text-zinc-500" />
              )}
              <span>{lang === 'tl' ? 'Baterya ng Flashlight [F]' : 'Flashlight [F]'}</span>
            </button>
            <div className="flex items-center gap-1">
              <span className={`font-mono text-xs font-bold ${player.flashlightBattery < 20 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
                {Math.round(player.flashlightBattery)}%
              </span>
              {player.flashlightBattery > 0 ? (
                <Battery className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <BatteryCharging className="w-3.5 h-3.5 text-red-500" />
              )}
            </div>
          </div>
          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${player.flashlightBattery < 20 ? 'bg-red-500' : 'bg-gradient-to-r from-amber-500 to-yellow-400'}`}
              style={{ width: `${Math.max(0, player.flashlightBattery)}%` }}
            />
          </div>
        </div>

        {/* Center: Threat / Proximity EMF Radio Warning */}
        <div className="flex flex-col items-center">
          {closestDist < 8.0 && (
            <div className={`px-4 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2 text-xs font-bold tracking-wider uppercase animate-bounce ${
              chasingGhost
                ? 'bg-red-950/80 border-red-500/80 text-red-300 shadow-lg shadow-red-950/50'
                : 'bg-zinc-950/80 border-amber-500/70 text-amber-300'
            }`}>
              <Heart className={`w-3.5 h-3.5 text-red-500 fill-red-500 ${isHeartPounding ? 'animate-ping' : ''}`} />
              <span>
                {chasingGhost
                  ? (lang === 'tl' ? 'TUMAKBO! TINATUGIS KA NG MULTO!' : 'RUN! THE SPIRIT IS CHASING YOU!')
                  : (lang === 'tl' ? 'MAY KALULUWA SA MALAPIT... PATAYIN ANG ILAW' : 'SPIRIT NEARBY... TURN OFF LIGHT')}
              </span>
            </div>
          )}
        </div>

        {/* Right: Controls & Minimap */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Quick utility toggles */}
          <div className="flex items-center gap-1 bg-black/75 border border-zinc-800 p-1 rounded-lg backdrop-blur-md">
            <button
              onClick={onToggleLang}
              className="px-2 py-1 text-xs font-semibold rounded text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
              title="Palitan ang Wika / Switch Language"
            >
              {lang.toUpperCase()}
            </button>
            <button
              onClick={onToggleMute}
              className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded transition"
              title="Tunog / Audio"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <button
              onClick={onOpenMap}
              className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded transition"
              title="Blueprint ng Ospital / Map"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>

          {/* Mini-Radar Hospital Blueprint */}
          <div className="relative w-36 h-36 bg-black/90 border border-zinc-800 rounded-lg p-1 shadow-2xl overflow-hidden">
            <div className="text-[10px] text-zinc-400 font-mono flex items-center justify-between px-1 mb-1">
              <span>{lang === 'tl' ? 'RADAR WARD' : 'RADAR'}</span>
              <span className="text-amber-400">SAN LAZARO</span>
            </div>
            {/* Grid Preview */}
            <div className="relative w-full h-[110px] bg-zinc-950 rounded border border-zinc-900 overflow-hidden">
              {/* Rooms & Walls */}
              {map.grid.map((row, r) => (
                <div key={r} className="flex h-[4.5px]">
                  {row.map((cell, c) => (
                    <div
                      key={c}
                      className={`flex-1 ${
                        cell === 1
                          ? 'bg-zinc-800/80'
                          : cell === 2
                          ? 'bg-amber-600/70'
                          : cell === 3
                          ? 'bg-emerald-500'
                          : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              ))}

              {/* Player Icon on Radar */}
              <div
                className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-300 -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(player.x / map.width) * 100}%`,
                  top: `${(player.y / map.height) * 100}%`,
                }}
              >
                {/* Heading indicator */}
                <div
                  className="w-2.5 h-0.5 bg-cyan-300 origin-left absolute top-1/2 left-1/2"
                  style={{
                    transform: `rotate(${player.angle}rad)`,
                  }}
                />
              </div>

              {/* Ghost blips on Radar if static/close */}
              {closestDist < 9.0 && ghosts.map((g) => (
                <div
                  key={g.id}
                  className="absolute w-2 h-2 rounded-full bg-red-500 animate-ping -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    left: `${(g.x / map.width) * 100}%`,
                    top: `${(g.y / map.height) * 100}%`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Inventory Keychain & Objectives Bar */}
      <div className="flex items-end justify-between gap-4 pointer-events-auto">
        {/* Objectives / Gabay */}
        <div className="bg-black/80 border border-zinc-800/80 p-3 rounded-lg backdrop-blur-md max-w-sm">
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            {lang === 'tl' ? 'Pangunahing Layunin:' : 'Primary Objective:'}
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {keysFoundCount < 4 ? (
              lang === 'tl' ? (
                <>
                  Kolektahin ang <strong className="text-amber-400">4 na susi</strong> sa mga abandonadong ward upang mabuksan ang <strong className="text-red-400">Pangunahing Lagusan (Exit)</strong> sa Hilaga.
                </>
              ) : (
                <>
                  Collect all <strong className="text-amber-400">4 keys</strong> across the hospital wards to open the <strong className="text-red-400">Main Emergency Exit</strong> to the North.
                </>
              )
            ) : (
              lang === 'tl' ? (
                <span className="text-emerald-400 font-bold animate-pulse">
                  Nasa iyo na ang Master Key! Tumakbo sa Hilagang Lagusan para makatakas!
                </span>
              ) : (
                <span className="text-emerald-400 font-bold animate-pulse">
                  You have the Master Key! Sprint to the North Exit to escape!
                </span>
              )
            )}
          </p>
        </div>

        {/* Keychain Slots */}
        <div className="bg-black/80 border border-zinc-800/80 p-3 rounded-lg backdrop-blur-md flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-zinc-300">
              {lang === 'tl' ? 'Mga Susi' : 'Keys'} ({keysFoundCount}/4):
            </span>
          </div>

          <div className="flex items-center gap-2">
            {(['nurse_key', 'surgeon_key', 'morgue_key', 'master_key'] as KeyId[]).map((keyId) => {
              const hasKey = player.inventoryKeys.includes(keyId);
              const keyInfo = KEY_DEFINITIONS[keyId];

              return (
                <div
                  key={keyId}
                  className={`w-9 h-9 rounded border flex items-center justify-center transition-all ${
                    hasKey
                      ? 'border-amber-400 bg-amber-950/40 text-amber-300 shadow-md shadow-amber-500/20'
                      : 'border-zinc-800 bg-zinc-950/60 text-zinc-700'
                  }`}
                  title={hasKey ? (lang === 'tl' ? keyInfo.name : keyInfo.nameEn) : (lang === 'tl' ? 'Nawawalang Susi' : 'Missing Key')}
                >
                  <Key
                    className={`w-4 h-4 ${hasKey ? '' : 'opacity-30'}`}
                    style={{ color: hasKey ? keyInfo.color : undefined }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
