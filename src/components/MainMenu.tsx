import React from 'react';
import { CarSpec, GameMode } from '../types/game';
import {
  Play,
  Warehouse,
  Flag,
  Gauge,
  Navigation,
  RadioTower,
  WifiOff,
  Wrench,
  Settings,
  ShieldCheck,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface MainMenuProps {
  activeCarSpec: CarSpec;
  moneySom: number;
  onStartGame: (mode: GameMode) => void;
  onOpenGarage: () => void;
  onOpenTuning: () => void;
  onOpenOnline: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  activeCarSpec,
  moneySom,
  onStartGame,
  onOpenGarage,
  onOpenTuning,
  onOpenOnline,
  onOpenSettings,
}) => {
  const handleAction = (cb: () => void) => {
    soundManager.playClick();
    cb();
  };

  return (
    <div
      id="main-menu-screen"
      className="absolute inset-0 select-none flex flex-col justify-between p-4 sm:p-8 bg-gradient-to-t from-neutral-950/90 via-transparent to-neutral-950/70 pointer-events-auto"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        <div>
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold tracking-wider uppercase">
              3D SIMULYATOR
            </div>
            <span className="text-xs text-neutral-400 font-medium hidden sm:inline">v1.0.0 O‘zbekcha versiya</span>
          </div>
          <h1 className="font-racing text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-sky-400 tracking-wider mt-1 drop-shadow-md">
            UZBEK AUTO DRIVE
          </h1>
        </div>

        {/* Currency Display */}
        <div
          id="menu-currency-display"
          className="bg-neutral-900/90 border border-emerald-500/40 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3"
        >
          <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse" />
          <div>
            <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Mavjud Mablag‘</div>
            <div className="font-racing text-xl sm:text-2xl font-black text-white">
              {moneySom.toLocaleString('uz-UZ')} so‘m
            </div>
          </div>
        </div>
      </div>

      {/* Center / Car Specs Badge Overlay */}
      <div className="max-w-7xl mx-auto w-full flex items-end justify-between my-auto">
        {/* Active Car info bar */}
        <div className="bg-neutral-950/80 border border-white/10 backdrop-blur-xl p-5 sm:p-6 rounded-3xl max-w-md w-full shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold tracking-wider text-sky-400">Tanlangan avtomobil</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 font-semibold">
              {activeCarSpec.category}
            </span>
          </div>
          <h2 className="font-racing text-2xl sm:text-3xl font-black text-white">{activeCarSpec.name}</h2>
          <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{activeCarSpec.description}</p>

          {/* Stats meters */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
            <div>
              <div className="flex justify-between text-neutral-300 font-semibold mb-1">
                <span>Maks. Tezlik</span>
                <span className="font-racing text-sky-400">{activeCarSpec.topSpeedKmh} km/s</span>
              </div>
              <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-full"
                  style={{ width: `${(activeCarSpec.topSpeedKmh / 260) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-neutral-300 font-semibold mb-1">
                <span>Tezlanish</span>
                <span className="font-racing text-amber-400">{activeCarSpec.acceleration}/10</span>
              </div>
              <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${activeCarSpec.acceleration * 10}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-neutral-300 font-semibold mb-1">
                <span>Boshqaruv</span>
                <span className="font-racing text-emerald-400">{activeCarSpec.handling}/10</span>
              </div>
              <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${activeCarSpec.handling * 10}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-neutral-300 font-semibold mb-1">
                <span>Drift kuchi</span>
                <span className="font-racing text-purple-400">{activeCarSpec.driftRating}/10</span>
              </div>
              <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-400 rounded-full"
                  style={{ width: `${activeCarSpec.driftRating * 10}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Menu Navigation Grid */}
      <div className="max-w-7xl mx-auto w-full pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {/* 1. O'YINNI BOSHLASH (Erkin Haydash) */}
          <button
            id="btn-menu-start"
            onClick={() => handleAction(() => onStartGame('freedrive'))}
            className="col-span-2 sm:col-span-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-racing font-bold p-3.5 sm:p-4 rounded-2xl shadow-xl flex items-center justify-between group transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Play className="w-5 h-5 fill-current" />
              <div className="text-left">
                <div className="text-[10px] text-emerald-200 font-sans tracking-wider uppercase font-semibold">ERKIN HAYDASH</div>
                <div className="text-base sm:text-lg tracking-wide">BOSHLASH</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* 2. GARAGE */}
          <button
            id="btn-menu-garage"
            onClick={() => handleAction(onOpenGarage)}
            className="bg-neutral-900/85 hover:bg-neutral-800/90 border border-white/10 hover:border-sky-500/50 text-white font-racing font-bold p-3.5 sm:p-4 rounded-2xl shadow-lg flex items-center justify-between group transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Warehouse className="w-5 h-5 text-sky-400" />
              <div className="text-left">
                <div className="text-[10px] text-neutral-400 font-sans tracking-wider uppercase font-semibold">MASHINALAR</div>
                <div className="text-base sm:text-lg tracking-wide">GARAGE</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* 3. POYGA (RACE) */}
          <button
            id="btn-menu-race"
            onClick={() => handleAction(() => onStartGame('race'))}
            className="bg-neutral-900/85 hover:bg-neutral-800/90 border border-white/10 hover:border-red-500/50 text-white font-racing font-bold p-3.5 sm:p-4 rounded-2xl shadow-lg flex items-center justify-between group transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Flag className="w-5 h-5 text-red-400" />
              <div className="text-left">
                <div className="text-[10px] text-neutral-400 font-sans tracking-wider uppercase font-semibold">AYLANA VAQT</div>
                <div className="text-base sm:text-lg tracking-wide text-red-300">POYGA</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* 4. DRIFT REJIMI */}
          <button
            id="btn-menu-drift"
            onClick={() => handleAction(() => onStartGame('drift'))}
            className="bg-neutral-900/85 hover:bg-neutral-800/90 border border-white/10 hover:border-amber-500/50 text-white font-racing font-bold p-3.5 sm:p-4 rounded-2xl shadow-lg flex items-center justify-between group transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Flame className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <div className="text-[10px] text-neutral-400 font-sans tracking-wider uppercase font-semibold">SHINA TUTUNI</div>
                <div className="text-base sm:text-lg tracking-wide text-amber-300">DRIFT</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* 5. SIMULYATOR & TAKSI */}
          <button
            id="btn-menu-simulator"
            onClick={() => handleAction(() => onStartGame('simulator'))}
            className="bg-neutral-900/85 hover:bg-neutral-800/90 border border-white/10 hover:border-emerald-500/50 text-white font-racing font-bold p-3.5 sm:p-4 rounded-2xl shadow-lg flex items-center justify-between group transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Navigation className="w-5 h-5 text-emerald-400" />
              <div className="text-left">
                <div className="text-[10px] text-neutral-400 font-sans tracking-wider uppercase font-semibold">YO‘LOVCHILAR</div>
                <div className="text-base sm:text-lg tracking-wide text-emerald-300">TAKSI</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* 6. TYUNING */}
          <button
            id="btn-menu-tuning"
            onClick={() => handleAction(onOpenTuning)}
            className="bg-neutral-900/85 hover:bg-neutral-800/90 border border-white/10 hover:border-purple-500/50 text-white font-racing font-bold p-3.5 sm:p-4 rounded-2xl shadow-lg flex items-center justify-between group transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Wrench className="w-5 h-5 text-purple-400" />
              <div className="text-left">
                <div className="text-[10px] text-neutral-400 font-sans tracking-wider uppercase font-semibold">USTAXONA</div>
                <div className="text-base sm:text-lg tracking-wide text-purple-300">TYUNING</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* 7. ONLINE MULTIPLAYER */}
          <button
            id="btn-menu-online"
            onClick={() => handleAction(onOpenOnline)}
            className="bg-neutral-900/85 hover:bg-neutral-800/90 border border-white/10 hover:border-sky-500/50 text-white font-racing font-bold p-3.5 sm:p-4 rounded-2xl shadow-lg flex items-center justify-between group transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <RadioTower className="w-5 h-5 text-sky-400" />
              <div className="text-left">
                <div className="text-[10px] text-neutral-400 font-sans tracking-wider uppercase font-semibold">XONALAR</div>
                <div className="text-base sm:text-lg tracking-wide text-sky-300">ONLINE</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* 8. SOZLAMALAR */}
          <button
            id="btn-menu-settings"
            onClick={() => handleAction(onOpenSettings)}
            className="bg-neutral-900/85 hover:bg-neutral-800/90 border border-white/10 hover:border-neutral-400 text-white font-racing font-bold p-3.5 sm:p-4 rounded-2xl shadow-lg flex items-center justify-between group transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-5 h-5 text-neutral-400" />
              <div className="text-left">
                <div className="text-[10px] text-neutral-400 font-sans tracking-wider uppercase font-semibold">OB-HAVO & GRAFIKA</div>
                <div className="text-base sm:text-lg tracking-wide">SOZLAMALAR</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
