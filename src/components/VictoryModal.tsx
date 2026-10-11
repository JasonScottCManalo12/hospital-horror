import React from 'react';
import { Award, CheckCircle2, RotateCcw, ShieldCheck, Trophy } from 'lucide-react';
import hallwayImgSrc from '../assets/images/hospital_hallway_1791720045999.jpg';

interface VictoryModalProps {
  timeElapsed: number; // in seconds
  notesReadCount: number;
  remainingSanity: number;
  lang: 'tl' | 'en';
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  timeElapsed,
  notesReadCount,
  remainingSanity,
  lang,
  onRestart,
}) => {
  const mins = Math.floor(timeElapsed / 60);
  const secs = Math.floor(timeElapsed % 60);
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 select-none">
      <div className="max-w-lg w-full bg-[#0d1512] border border-emerald-800/60 rounded-xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-600/20 blur-3xl rounded-full pointer-events-none" />

        {/* Escape Atmosphere Backdrop Preview */}
        <div className="relative w-full h-36 rounded-lg border border-emerald-900/60 overflow-hidden shadow-2xl mb-4">
          <img
            src={hallwayImgSrc}
            alt="Hospital Exit"
            className="w-full h-full object-cover filter brightness-75 contrast-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1512] to-transparent" />
          <div className="absolute bottom-2 left-4 flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>{lang === 'tl' ? 'Matagumpay na Nakatakas!' : 'Successfully Escaped!'}</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif font-black text-emerald-300 tracking-wider mb-2">
          {lang === 'tl' ? 'NAKATAKAS KA SA SAN LAZARO!' : 'YOU ESCAPED SAN LAZARO!'}
        </h1>

        <p className="text-sm text-zinc-300 leading-relaxed mb-4">
          {lang === 'tl'
            ? 'Nabuksan mo ang nakakadenang Pangunahing Lagusan gamit ang Master Key at muling nakalanghap ng sariwang hangin sa labas ng abandonadong ospital.'
            : 'You unlocked the chained Emergency Exit gate using the Master Key and finally breathed fresh air outside the haunted sanatorium.'}
        </p>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-3 gap-2 bg-black/60 border border-zinc-800 rounded-lg p-3 mb-6 text-center font-mono">
          <div>
            <div className="text-[11px] text-zinc-500">{lang === 'tl' ? 'Oras' : 'Time'}</div>
            <div className="text-emerald-400 text-base font-bold">{timeFormatted}</div>
          </div>
          <div>
            <div className="text-[11px] text-zinc-500">{lang === 'tl' ? 'Katinuan' : 'Sanity'}</div>
            <div className="text-cyan-400 text-base font-bold">{Math.round(remainingSanity)}%</div>
          </div>
          <div>
            <div className="text-[11px] text-zinc-500">{lang === 'tl' ? 'Mga Tala' : 'Lore Notes'}</div>
            <div className="text-amber-400 text-base font-bold">{notesReadCount} / 4</div>
          </div>
        </div>

        {/* Play Again Button */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold rounded-lg shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2.5 transition active:scale-95"
        >
          <RotateCcw className="w-5 h-5" />
          <span>{lang === 'tl' ? 'Maglaro Muli (Bagong Random Floorplan)' : 'Play Again (New Random Floorplan)'}</span>
        </button>
      </div>
    </div>
  );
};
