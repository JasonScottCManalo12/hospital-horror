import React from 'react';
import { LoreNote } from '../types/horrorGame';
import { BookOpen, Calendar, FileText, User, X } from 'lucide-react';

interface LoreModalProps {
  note: LoreNote;
  lang: 'tl' | 'en';
  onClose: () => void;
}

export const LoreModal: React.FC<LoreModalProps> = ({ note, lang, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative max-w-lg w-full bg-[#14120e] border border-amber-900/60 rounded-xl p-6 sm:p-8 shadow-2xl text-amber-100 flex flex-col gap-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-amber-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-amber-900/40 pb-3">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-widest mb-1">
            <FileText className="w-4 h-4" />
            <span>Hospital de San Lazaro Archives · 1984</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-amber-200">
            {lang === 'tl' ? note.title : note.titleEn}
          </h2>
        </div>

        {/* Metadata info */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-amber-400/80 font-mono">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            {note.date}
          </span>
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-500" />
            {lang === 'tl' ? note.author : note.authorEn}
          </span>
        </div>

        {/* Content Body with aged typewritten aesthetic */}
        <div className="bg-[#0b0a08] border border-amber-950 p-4 rounded-lg font-serif text-sm sm:text-base leading-relaxed text-amber-200/90 italic tracking-wide">
          "{lang === 'tl' ? note.content : note.contentEn}"
        </div>

        {/* Footer tip */}
        <div className="flex items-center justify-between text-xs text-amber-500/70 pt-2 border-t border-amber-900/30">
          <span>{lang === 'tl' ? 'Pindutin ang [ESC] o [E] para Isara' : 'Press [ESC] or [E] to Close'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-700/40 hover:bg-amber-600/60 text-amber-100 font-semibold rounded transition"
          >
            {lang === 'tl' ? 'Itabi ang Tala' : 'Put Away Note'}
          </button>
        </div>
      </div>
    </div>
  );
};
