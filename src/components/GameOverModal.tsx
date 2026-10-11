import React from 'react';
import { Ghost } from '../types/horrorGame';
import { RotateCcw, Skull } from 'lucide-react';
import { GHOST_PROFILES } from '../services/ghostAI';
import ghostImgSrc from '../assets/images/vengeful_spirit_1791720067076.jpg';

interface GameOverModalProps {
  killerGhost: Ghost | null;
  keysCollected: number;
  lang: 'tl' | 'en';
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  killerGhost,
  keysCollected,
  lang,
  onRestart,
}) => {
  const profile = killerGhost ? GHOST_PROFILES[killerGhost.type] : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 select-none">
      <div className="max-w-md w-full bg-[#120808] border border-red-900/60 rounded-xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        {/* Creepy Red Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-600/20 blur-3xl rounded-full pointer-events-none" />

        {/* Ghost Portrait thumbnail */}
        <div className="relative w-28 h-28 rounded-full border-2 border-red-700/80 overflow-hidden shadow-2xl mb-4">
          <img
            src={ghostImgSrc}
            alt="Vengeful Spirit"
            className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition"
          />
        </div>

        <div className="flex items-center gap-2 text-red-500 font-mono text-xs uppercase tracking-widest mb-1">
          <Skull className="w-4 h-4" />
          <span>{lang === 'tl' ? 'Nilamon ng Kadiliman' : 'Consumed by Darkness'}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif font-black text-red-500 tracking-wider mb-2">
          {lang === 'tl' ? 'IKAW AY NAMATAY' : 'YOU DIED'}
        </h1>

        <p className="text-sm text-zinc-300 leading-relaxed mb-4">
          {profile ? (
            lang === 'tl' ? (
              <>
                Inabutan ka ni <strong className="text-red-400">{profile.title}</strong> sa madilim na pasilyo ng San Lazaro.
              </>
            ) : (
              <>
                You were caught by <strong className="text-red-400">{profile.titleEn}</strong> in the dark corridors of San Lazaro.
              </>
            )
          ) : (
            lang === 'tl'
              ? 'Tuluyang naubos ang iyong katinuan sa madidilim na silid ng ospital.'
              : 'Your sanity collapsed completely in the hospital darkness.'
          )}
        </p>

        {/* Stats card */}
        <div className="w-full bg-black/60 border border-zinc-800 rounded-lg p-3 mb-6 flex justify-around text-xs font-mono">
          <div>
            <div className="text-zinc-500">{lang === 'tl' ? 'Mga Susang Nahanap' : 'Keys Found'}</div>
            <div className="text-amber-400 text-lg font-bold">{keysCollected} / 4</div>
          </div>
          <div>
            <div className="text-zinc-500">{lang === 'tl' ? 'Resulta' : 'Outcome'}</div>
            <div className="text-red-400 text-lg font-bold">{lang === 'tl' ? 'Naiwan Magpakailanman' : 'Trapped Forever'}</div>
          </div>
        </div>

        {/* Retry Button */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 bg-red-700 hover:bg-red-600 active:bg-red-800 text-white font-bold rounded-lg shadow-xl shadow-red-950/60 flex items-center justify-center gap-2.5 transition active:scale-95"
        >
          <RotateCcw className="w-5 h-5" />
          <span>{lang === 'tl' ? 'Subukan Muli (Bagong Random Hospital)' : 'Try Again (New Random Hospital)'}</span>
        </button>
      </div>
    </div>
  );
};
