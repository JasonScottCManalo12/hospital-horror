import React, { useState } from 'react';
import { Eye, Flashlight, Info, Key, Play, ShieldAlert, Volume2 } from 'lucide-react';
import hallwayImgSrc from '../assets/images/hospital_hallway_1791720045999.jpg';

interface StartMenuModalProps {
  onStartGame: () => void;
  lang: 'tl' | 'en';
  onToggleLang: () => void;
}

export const StartMenuModal: React.FC<StartMenuModalProps> = ({
  onStartGame,
  lang,
  onToggleLang,
}) => {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 select-none">
      <div className="relative max-w-xl w-full bg-[#0e1013] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Banner with Hallway Image */}
        <div className="relative w-full h-52 overflow-hidden border-b border-zinc-800">
          <img
            src={hallwayImgSrc}
            alt="Hospital de San Lazaro"
            className="w-full h-full object-cover filter brightness-70 contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1013] via-[#0e1013]/40 to-transparent" />

          {/* Language Switcher Badge */}
          <button
            onClick={onToggleLang}
            className="absolute top-4 right-4 bg-black/70 hover:bg-black border border-zinc-700 text-zinc-300 hover:text-white px-3 py-1 rounded text-xs font-semibold backdrop-blur transition"
          >
            {lang === 'tl' ? 'English (EN)' : 'Tagalog (TL)'}
          </button>

          {/* Title Overlay */}
          <div className="absolute bottom-4 left-6">
            <span className="text-xs font-mono text-red-500 tracking-widest uppercase font-bold">
              1984 · Abandoned Sanatorium
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-zinc-100 tracking-wide drop-shadow-md">
              TAKAS SA SAN LAZARO
            </h1>
            <p className="text-xs text-zinc-400 font-mono">
              The Vengeful Spirits of Hospital de San Lazaro
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-5 text-zinc-300">
          {/* Brief Story */}
          <p className="text-sm leading-relaxed text-zinc-300">
            {lang === 'tl' ? (
              <>
                Nagising ka sa madilim at inabandonang pasilyo ng <strong>Hospital de San Lazaro</strong>.
                Ang mga pintuan ay nakakadena at ang mga ligaw na kaluluwa nina <strong>Dolores</strong>, <strong>Pasyente 73</strong>, at <strong>Dr. Javier</strong> ay gumagala sa dilim.
                Hanapin ang <strong>4 na susi</strong> para mabuksan ang Pangunahing Lagusan at makaligtas!
              </>
            ) : (
              <>
                You wake up in the pitch-black corridors of the abandoned <strong>Hospital de San Lazaro</strong>.
                All gates are chained shut, and the vengeful spirits of <strong>Nurse Dolores</strong>, <strong>Patient 73</strong>, and <strong>Dr. Javier</strong> stalk the dark wards.
                Locate all <strong>4 hidden keys</strong> to unlock the Main Emergency Exit and escape alive!
              </>
            )}
          </p>

          {/* Key Controls Quick Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="bg-black/60 border border-zinc-800 p-2.5 rounded-lg flex flex-col items-center text-center">
              <span className="text-amber-400 font-bold mb-1">WASD / Arrow</span>
              <span className="text-zinc-400">{lang === 'tl' ? 'Galaw / Lakad' : 'Walk'}</span>
            </div>
            <div className="bg-black/60 border border-zinc-800 p-2.5 rounded-lg flex flex-col items-center text-center">
              <span className="text-cyan-400 font-bold mb-1">Shift</span>
              <span className="text-zinc-400">{lang === 'tl' ? 'Tumakbo' : 'Sprint'}</span>
            </div>
            <div className="bg-black/60 border border-zinc-800 p-2.5 rounded-lg flex flex-col items-center text-center">
              <span className="text-yellow-400 font-bold mb-1">[F]</span>
              <span className="text-zinc-400">{lang === 'tl' ? 'Flashlight' : 'Light On/Off'}</span>
            </div>
            <div className="bg-black/60 border border-zinc-800 p-2.5 rounded-lg flex flex-col items-center text-center">
              <span className="text-emerald-400 font-bold mb-1">[E]</span>
              <span className="text-zinc-400">{lang === 'tl' ? 'Pulutin / Pinto' : 'Interact / Hide'}</span>
            </div>
          </div>

          {/* Survival Tips Box */}
          <div className="bg-red-950/20 border border-red-900/40 p-3 rounded-lg flex items-start gap-3 text-xs text-red-200/90 leading-relaxed">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-red-300 font-semibold block mb-0.5">
                {lang === 'tl' ? 'MGA PAALALA SA KALIGTASAN:' : 'SURVIVAL WARNINGS:'}
              </strong>
              {lang === 'tl' ? (
                <span>
                  • <strong>Patayin ang flashlight</strong> kapag lumakas ang radyo static o bumilis ang tibok ng puso.<br />
                  • Ang pagtakbo ay lumilikha ng malalakas na yapak na naririnig ng mga multo.<br />
                  • <strong>Magtago sa mga locker</strong> kapag hinahabol ka upang mawala ang kanilang atensyon!
                </span>
              ) : (
                <span>
                  • <strong>Turn off your flashlight</strong> when radio static rises or your heart rate spikes.<br />
                  • Sprinting generates loud footsteps that alert the spirits.<br />
                  • <strong>Hide in lockers</strong> when pursued to break line of sight and evade them!
                </span>
              )}
            </div>
          </div>

          {/* Start Button */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={onStartGame}
              className="w-full py-4 bg-red-700 hover:bg-red-600 active:bg-red-800 text-white font-bold text-base rounded-xl shadow-xl shadow-red-950/80 flex items-center justify-center gap-3 transition active:scale-95 group"
            >
              <Play className="w-5 h-5 fill-white group-hover:scale-110 transition" />
              <span>{lang === 'tl' ? 'SIMULAN ANG PAGTAKAS' : 'BEGIN YOUR ESCAPE'}</span>
            </button>
            <p className="text-[11px] text-zinc-500 text-center font-mono">
              {lang === 'tl' ? 'Rekomendado: Magsuot ng headphones para sa 3D audio experience.' : 'Recommended: Wear headphones for full 3D audio immersion.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
