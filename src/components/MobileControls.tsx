import React from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Compass, Flashlight, Hand, Zap } from 'lucide-react';

interface MobileControlsProps {
  onMoveForward: (active: boolean) => void;
  onMoveBackward: (active: boolean) => void;
  onTurnLeft: (active: boolean) => void;
  onTurnRight: (active: boolean) => void;
  onToggleSprint: (active: boolean) => void;
  onToggleFlashlight: () => void;
  onInteract: () => void;
  onOpenMap: () => void;
  isSprinting: boolean;
  flashlightOn: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMoveForward,
  onMoveBackward,
  onTurnLeft,
  onTurnRight,
  onToggleSprint,
  onToggleFlashlight,
  onInteract,
  onOpenMap,
  isSprinting,
  flashlightOn,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none flex justify-between items-end p-4 pb-6 md:hidden">
      {/* Left: Directional D-Pad */}
      <div className="relative w-36 h-36 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-full border border-white/10 p-2 grid grid-cols-3 grid-rows-3 gap-1">
        <div />
        <button
          className="flex items-center justify-center bg-zinc-800/80 active:bg-zinc-700 text-white rounded active:scale-95 transition"
          onTouchStart={(e) => { e.preventDefault(); onMoveForward(true); }}
          onTouchEnd={(e) => { e.preventDefault(); onMoveForward(false); }}
          onMouseDown={() => onMoveForward(true)}
          onMouseUp={() => onMoveForward(false)}
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div />

        <button
          className="flex items-center justify-center bg-zinc-800/80 active:bg-zinc-700 text-white rounded active:scale-95 transition"
          onTouchStart={(e) => { e.preventDefault(); onTurnLeft(true); }}
          onTouchEnd={(e) => { e.preventDefault(); onTurnLeft(false); }}
          onMouseDown={() => onTurnLeft(true)}
          onMouseUp={() => onTurnLeft(false)}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onInteract}
          className="flex items-center justify-center bg-amber-600/90 active:bg-amber-500 text-black font-bold rounded active:scale-90 transition"
        >
          <Hand className="w-5 h-5" />
        </button>
        <button
          className="flex items-center justify-center bg-zinc-800/80 active:bg-zinc-700 text-white rounded active:scale-95 transition"
          onTouchStart={(e) => { e.preventDefault(); onTurnRight(true); }}
          onTouchEnd={(e) => { e.preventDefault(); onTurnRight(false); }}
          onMouseDown={() => onTurnRight(true)}
          onMouseUp={() => onTurnRight(false)}
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        <div />
        <button
          className="flex items-center justify-center bg-zinc-800/80 active:bg-zinc-700 text-white rounded active:scale-95 transition"
          onTouchStart={(e) => { e.preventDefault(); onMoveBackward(true); }}
          onTouchEnd={(e) => { e.preventDefault(); onMoveBackward(false); }}
          onMouseDown={() => onMoveBackward(true)}
          onMouseUp={() => onMoveBackward(false)}
        >
          <ArrowDown className="w-5 h-5" />
        </button>
        <div />
      </div>

      {/* Right: Action Buttons (Sprint, Flashlight, Interact, Map) */}
      <div className="flex flex-col gap-3 pointer-events-auto items-end">
        <button
          onClick={onOpenMap}
          className="w-12 h-12 rounded-full bg-zinc-900/90 border border-zinc-700 flex items-center justify-center text-amber-400 active:scale-90 transition shadow-lg"
          title="Map"
        >
          <Compass className="w-6 h-6" />
        </button>

        <button
          onClick={onToggleFlashlight}
          className={`w-14 h-14 rounded-full border flex items-center justify-center active:scale-90 transition shadow-xl ${
            flashlightOn ? 'bg-amber-500/90 border-amber-300 text-black' : 'bg-zinc-900/90 border-zinc-700 text-zinc-400'
          }`}
          title="Flashlight"
        >
          <Flashlight className="w-7 h-7" />
        </button>

        <button
          onTouchStart={(e) => { e.preventDefault(); onToggleSprint(true); }}
          onTouchEnd={(e) => { e.preventDefault(); onToggleSprint(false); }}
          onMouseDown={() => onToggleSprint(true)}
          onMouseUp={() => onToggleSprint(false)}
          className={`w-16 h-16 rounded-full border flex items-center justify-center active:scale-90 transition shadow-2xl ${
            isSprinting ? 'bg-cyan-500 border-cyan-300 text-black' : 'bg-zinc-800/90 border-zinc-600 text-cyan-400'
          }`}
          title="Sprint"
        >
          <Zap className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};
