import React from 'react';
import { Eye, Heart, LogOut } from 'lucide-react';
import { Ghost } from '../types/horrorGame';

interface HidingOverlayProps {
  ghosts: Ghost[];
  onExitHiding: () => void;
  lang: 'tl' | 'en';
}

export const HidingOverlay: React.FC<HidingOverlayProps> = ({
  ghosts,
  onExitHiding,
  lang,
}) => {
  let closestDist = 999;
  let spiritNearby = false;
  ghosts.forEach((g) => {
    if (g.distanceToPlayer < closestDist) closestDist = g.distanceToPlayer;
    if (g.distanceToPlayer < 6.0) spiritNearby = true;
  });

  return (
    <div className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-between p-6 pointer-events-auto select-none">
      {/* Top Banner */}
      <div className="bg-zinc-950/90 border border-zinc-800 px-6 py-2.5 rounded-full flex items-center gap-3 backdrop-blur shadow-2xl">
        <Eye className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span className="text-sm font-semibold tracking-wide text-zinc-200">
          {lang === 'tl'
            ? 'Nagtatago sa Locker · Pigilin ang iyong hininga'
            : 'Hiding Inside Locker · Hold your breath'}
        </span>
      </div>

      {/* Middle Locker Grate Slat Simulation */}
      <div className="relative w-72 sm:w-96 h-80 border-4 border-zinc-900 rounded-lg overflow-hidden bg-black shadow-2xl flex flex-col justify-between p-2">
        {/* Metal Locker Slats */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="w-full h-8 bg-zinc-950/95 border-y border-zinc-800 flex items-center justify-center"
          >
            <div className="w-11/12 h-1 bg-black/80 rounded-full" />
          </div>
        ))}

        {/* Proximity warning through grate */}
        {spiritNearby && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-950/20 backdrop-blur-[1px] animate-pulse">
            <div className="text-center">
              <Heart className="w-8 h-8 text-red-500 fill-red-500 mx-auto animate-bounce mb-1" />
              <p className="text-xs font-bold text-red-400 uppercase tracking-widest">
                {lang === 'tl' ? 'NASA LABAS ANG MULTO...' : 'SPIRIT OUTSIDE...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Button to Step Out */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onExitHiding}
          className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-600 text-white font-bold rounded-lg shadow-xl flex items-center gap-2.5 transition active:scale-95"
        >
          <LogOut className="w-5 h-5 text-amber-400" />
          <span>{lang === 'tl' ? 'Lumabas sa Locker [E]' : 'Step Out of Locker [E]'}</span>
        </button>
        <span className="text-xs text-zinc-500">
          {lang === 'tl' ? 'Siguraduhing malayo na ang kaluluwa bago lumabas!' : 'Make sure the spirit has walked away before leaving!'}
        </span>
      </div>
    </div>
  );
};
