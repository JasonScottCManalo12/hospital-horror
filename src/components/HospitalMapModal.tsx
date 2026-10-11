import React from 'react';
import { HospitalMap, Player } from '../types/horrorGame';
import { Compass, Key, Lock, MapPin, X } from 'lucide-react';
import { KEY_DEFINITIONS } from '../services/hospitalGenerator';

interface HospitalMapModalProps {
  map: HospitalMap;
  player: Player;
  lang: 'tl' | 'en';
  onClose: () => void;
}

export const HospitalMapModal: React.FC<HospitalMapModalProps> = ({
  map,
  player,
  lang,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative max-w-2xl w-full bg-[#0c1014] border border-cyan-900/60 rounded-xl p-6 shadow-2xl text-cyan-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold tracking-wide text-cyan-200">
              {lang === 'tl' ? 'Arkitektural na Plano · Ospital de San Lazaro' : 'Architectural Floor Plan · San Lazaro Asylum'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-cyan-400 hover:text-white rounded hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Blueprint Visualizer */}
        <div className="relative w-full aspect-square max-h-[380px] bg-[#05080c] border border-cyan-800/60 rounded-lg p-2 overflow-hidden flex items-center justify-center shadow-inner">
          <div className="relative w-full h-full">
            {/* Grid */}
            {map.grid.map((row, r) => (
              <div key={r} className="flex h-[4.16%]">
                {row.map((cell, c) => (
                  <div
                    key={c}
                    className={`flex-1 border-[0.5px] border-cyan-950/40 ${
                      cell === 1
                        ? 'bg-cyan-950/80'
                        : cell === 2
                        ? 'bg-amber-600/80 animate-pulse'
                        : cell === 3
                        ? 'bg-red-600/90 animate-pulse'
                        : cell === 4
                        ? 'bg-zinc-700/60'
                        : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
            ))}

            {/* Room Labels */}
            {map.roomLabels.map((lbl, idx) => (
              <div
                key={idx}
                className="absolute text-[9px] font-mono font-bold text-cyan-400/90 bg-black/60 px-1 py-0.5 rounded -translate-x-1/2 -translate-y-1/2 pointer-events-none whitespace-nowrap border border-cyan-800/40"
                style={{
                  left: `${(lbl.x / map.width) * 100}%`,
                  top: `${(lbl.y / map.height) * 100}%`,
                }}
              >
                {lang === 'tl' ? lbl.name : lbl.nameEn}
              </div>
            ))}

            {/* Player Location Marker */}
            <div
              className="absolute w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-white shadow-lg shadow-cyan-400 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center animate-bounce"
              style={{
                left: `${(player.x / map.width) * 100}%`,
                top: `${(player.y / map.height) * 100}%`,
              }}
            >
              <div
                className="w-4 h-0.5 bg-yellow-300 origin-left absolute top-1/2 left-1/2"
                style={{ transform: `rotate(${player.angle}rad)` }}
              />
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-zinc-300 border-t border-cyan-900/40 pt-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-cyan-400 rounded-full" />
            <span>{lang === 'tl' ? 'Iyong Posisyon' : 'Your Position'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-600 rounded" />
            <span>{lang === 'tl' ? 'Pangunahing Lagusan (Exit)' : 'Emergency Exit'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-600 rounded" />
            <span>{lang === 'tl' ? 'Naka-lock na Pinto' : 'Locked Gate'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-cyan-950 border border-cyan-800 rounded" />
            <span>{lang === 'tl' ? 'Pader / Pasilyo' : 'Wall / Corridor'}</span>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-700/50 rounded font-semibold text-sm transition"
          >
            {lang === 'tl' ? 'Bumalik sa Laro [ESC]' : 'Resume Game [ESC]'}
          </button>
        </div>
      </div>
    </div>
  );
};
