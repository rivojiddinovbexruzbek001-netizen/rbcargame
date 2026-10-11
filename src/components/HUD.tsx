import React from 'react';
import { CameraView, GameMode } from '../types/game';
import { RaceState, TaxiState } from '../game/CarSimulator';
import {
  Gauge,
  Camera,
  RotateCcw,
  Volume2,
  VolumeX,
  Radio,
  Lightbulb,
  RadioTower,
  Flag,
  Navigation,
  Menu as MenuIcon,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface HUDProps {
  speedKmh: number;
  rpm: number;
  gear: number;
  driftScore: number;
  comboMultiplier: number;
  isDrifting: boolean;
  moneySom: number;
  cameraView: CameraView;
  gameMode: GameMode;
  raceState: RaceState;
  taxiState: TaxiState;
  radarAlert: { speed: number; fine: number } | null;
  onCameraChange: () => void;
  onResetCar: () => void;
  onOpenMenu: () => void;
  onTouchInput: (key: 'throttle' | 'brake' | 'steerLeft' | 'steerRight' | 'handbrake', active: boolean) => void;
  onToggleLights: () => void;
  onHorn: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  speedKmh,
  rpm,
  gear,
  driftScore,
  comboMultiplier,
  isDrifting,
  moneySom,
  cameraView,
  gameMode,
  raceState,
  taxiState,
  radarAlert,
  onCameraChange,
  onResetCar,
  onOpenMenu,
  onTouchInput,
  onToggleLights,
  onHorn,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundManager.getMuted());
  const [isRadioOn, setIsRadioOn] = React.useState(soundManager.isRadioOn());

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleRadio = () => {
    const radio = soundManager.toggleRadio();
    setIsRadioOn(radio);
  };

  const gearText = gear === -1 ? 'R' : gear === 0 ? 'N' : `${gear}`;
  const rpmPercent = Math.min(100, Math.max(0, ((rpm - 900) / (7200 - 900)) * 100));

  return (
    <div id="game-hud" className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5">
      {/* Top Bar: Money, Mode status, Radar flash, Controls */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Money & Mode */}
        <div className="flex flex-col gap-2">
          {/* Money in So'm */}
          <div
            id="hud-currency"
            className="pointer-events-auto bg-neutral-900/85 backdrop-blur-md border border-emerald-500/40 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-lg"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">SO‘M</span>
            <span className="font-racing text-lg sm:text-xl font-bold text-white tracking-wide">
              {moneySom.toLocaleString('uz-UZ')} so‘m
            </span>
          </div>

          {/* Mode Indicator */}
          <div
            id="hud-mode-pill"
            className="pointer-events-auto bg-neutral-900/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-lg text-xs font-semibold text-neutral-300 w-fit flex items-center gap-1.5"
          >
            {gameMode === 'freedrive' && <Navigation className="w-3.5 h-3.5 text-sky-400" />}
            {gameMode === 'drift' && <Gauge className="w-3.5 h-3.5 text-amber-400" />}
            {gameMode === 'race' && <Flag className="w-3.5 h-3.5 text-red-400" />}
            {gameMode === 'simulator' && <Navigation className="w-3.5 h-3.5 text-emerald-400" />}
            {gameMode === 'online' && <RadioTower className="w-3.5 h-3.5 text-purple-400" />}
            <span className="capitalize">
              {gameMode === 'freedrive' && 'Erkin haydash'}
              {gameMode === 'drift' && 'Drift rejimi'}
              {gameMode === 'race' && 'Poyga (Race)'}
              {gameMode === 'simulator' && 'Simulyator & Taksi'}
              {gameMode === 'online' && 'Online multiplayer'}
            </span>
          </div>
        </div>

        {/* Center: Mission / Race / Radar Alert */}
        <div className="flex flex-col items-center gap-2 max-w-sm sm:max-w-md text-center">
          {/* Radar Speed Camera Warning */}
          {radarAlert && (
            <div
              id="hud-radar-alert"
              className="bg-red-600/90 text-white font-racing px-4 py-2 rounded-xl shadow-2xl border border-red-400 animate-bounce flex items-center gap-2 text-sm sm:text-base font-bold"
            >
              <span>📸 DIQQAT! RADAR: {radarAlert.speed} km/soat</span>
              <span className="bg-neutral-950/80 px-2 py-0.5 rounded text-red-300">
                Jarima: -{radarAlert.fine.toLocaleString()} so‘m
              </span>
            </div>
          )}

          {/* Race HUD Status */}
          {gameMode === 'race' && raceState.active && (
            <div
              id="hud-race-status"
              className="bg-neutral-900/90 border border-sky-500/50 backdrop-blur-md px-4 py-2 rounded-xl text-white flex items-center gap-4"
            >
              <div className="text-left">
                <div className="text-[10px] uppercase text-sky-400 font-bold">Aylana</div>
                <div className="font-racing text-lg font-bold">
                  {raceState.lap} / {raceState.totalLaps}
                </div>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div className="text-left">
                <div className="text-[10px] uppercase text-amber-400 font-bold">Pozitsiya</div>
                <div className="font-racing text-lg font-bold text-amber-300">
                  {raceState.position}-O‘RIN
                </div>
              </div>
            </div>
          )}

          {/* Taxi Mission Status */}
          {gameMode === 'simulator' && taxiState.active && (
            <div
              id="hud-taxi-status"
              className="bg-neutral-900/90 border border-amber-500/50 backdrop-blur-md px-4 py-2 rounded-xl text-white text-xs sm:text-sm"
            >
              <div className="font-bold text-amber-400 flex items-center justify-center gap-1">
                <span>🚕 TAKSI TOPSHIRIG‘I:</span>
                <span>{taxiState.passengerName}</span>
              </div>
              <div className="text-neutral-300 mt-0.5">
                {!taxiState.hasPickedUp
                  ? 'Sariq zonaga boring va yo‘lovchini oling'
                  : `Yo‘lovchini manzilga yetkazing: ${taxiState.destinationName} (+${taxiState.rewardSom.toLocaleString()} so‘m)`}
              </div>
            </div>
          )}

          {/* Drift Score Banner */}
          {isDrifting && (
            <div
              id="hud-drift-banner"
              className="bg-neutral-950/80 border border-amber-500/60 px-5 py-2 rounded-2xl backdrop-blur-md shadow-2xl flex items-center gap-3 animate-pulse"
            >
              <span className="font-racing text-2xl sm:text-3xl font-bold text-amber-400 tracking-wider">
                +{driftScore}
              </span>
              <span className="bg-amber-500 text-neutral-950 text-xs font-black px-2 py-0.5 rounded-full uppercase">
                x{comboMultiplier} COMBO
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {/* Radio */}
          <button
            id="btn-hud-radio"
            onClick={handleToggleRadio}
            title="O‘zbek Radio"
            className={`p-2 sm:p-2.5 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
              isRadioOn
                ? 'bg-purple-600/80 border-purple-400 text-white shadow-lg shadow-purple-500/30'
                : 'bg-neutral-900/80 border-white/10 text-neutral-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Mute audio */}
          <button
            id="btn-hud-sound"
            onClick={handleToggleMute}
            title="Ovozni yoqish/o‘chirish"
            className="p-2 sm:p-2.5 rounded-xl bg-neutral-900/80 backdrop-blur-md border border-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />}
          </button>

          {/* Camera switch */}
          <button
            id="btn-hud-camera"
            onClick={onCameraChange}
            title="Kamera ko‘rinishini almashtirish (C)"
            className="p-2 sm:p-2.5 rounded-xl bg-neutral-900/80 backdrop-blur-md border border-white/10 text-neutral-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
            <span className="text-[10px] font-bold hidden sm:inline uppercase">
              {cameraView === 'third_person' && 'Tashqi'}
              {cameraView === 'close_chase' && 'Orqa'}
              {cameraView === 'hood' && 'Kapot'}
              {cameraView === 'cockpit' && 'Salon'}
            </span>
          </button>

          {/* Reset car */}
          <button
            id="btn-hud-reset"
            onClick={onResetCar}
            title="Mashinani qayta joylashtirish (R)"
            className="p-2 sm:p-2.5 rounded-xl bg-neutral-900/80 backdrop-blur-md border border-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          </button>

          {/* Main Menu */}
          <button
            id="btn-hud-menu"
            onClick={onOpenMenu}
            title="Asosiy Menyu"
            className="p-2 sm:p-2.5 rounded-xl bg-neutral-900/90 backdrop-blur-md border border-sky-500/40 text-sky-400 hover:bg-sky-500 hover:text-white transition-all cursor-pointer shadow-lg"
          >
            <MenuIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Area: Speedometer & Mobile Touch Controls */}
      <div className="flex items-end justify-between w-full">
        {/* Mobile Left Touch Controls: Steering */}
        <div className="pointer-events-auto flex items-center gap-3 sm:gap-4 md:hidden">
          <button
            id="btn-touch-left"
            onTouchStart={() => onTouchInput('steerLeft', true)}
            onTouchEnd={() => onTouchInput('steerLeft', false)}
            onMouseDown={() => onTouchInput('steerLeft', true)}
            onMouseUp={() => onTouchInput('steerLeft', false)}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-neutral-900/80 border border-white/20 active:bg-sky-500/50 flex items-center justify-center text-white text-2xl font-bold backdrop-blur-md shadow-xl"
          >
            ⬅
          </button>
          <button
            id="btn-touch-right"
            onTouchStart={() => onTouchInput('steerRight', true)}
            onTouchEnd={() => onTouchInput('steerRight', false)}
            onMouseDown={() => onTouchInput('steerRight', true)}
            onMouseUp={() => onTouchInput('steerRight', false)}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-neutral-900/80 border border-white/20 active:bg-sky-500/50 flex items-center justify-center text-white text-2xl font-bold backdrop-blur-md shadow-xl"
          >
            ➡
          </button>
        </div>

        {/* Center / Gauge: Tachometer & Speedometer */}
        <div
          id="hud-speedometer-cluster"
          className="pointer-events-auto mx-auto bg-neutral-950/85 border border-white/10 backdrop-blur-xl p-3 sm:p-4 rounded-3xl shadow-2xl flex flex-col items-center min-w-[190px] sm:min-w-[220px]"
        >
          {/* RPM Bar */}
          <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden mb-2 p-0.5 border border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                rpmPercent > 85 ? 'bg-red-500' : rpmPercent > 65 ? 'bg-amber-400' : 'bg-sky-400'
              }`}
              style={{ width: `${rpmPercent}%` }}
            />
          </div>

          {/* Speed & Gear */}
          <div className="flex items-baseline justify-center gap-3">
            {/* Gear */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">UZATMA</span>
              <span className="font-racing text-2xl sm:text-3xl font-black text-amber-400">{gearText}</span>
            </div>

            {/* Speed */}
            <div className="flex flex-col items-center">
              <span className="font-racing text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow">
                {Math.round(speedKmh)}
              </span>
              <span className="text-[10px] tracking-widest text-neutral-400 font-bold -mt-1">KM / SOAT</span>
            </div>

            {/* RPM number */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">RPM</span>
              <span className="font-racing text-lg sm:text-xl font-bold text-sky-400">{Math.round(rpm)}</span>
            </div>
          </div>

          {/* Extra lights and horn quick actions */}
          <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-white/10 w-full">
            <button
              id="btn-hud-horn"
              onClick={onHorn}
              title="Signal / Klakson (H)"
              className="p-1.5 rounded-lg bg-neutral-900 border border-white/10 text-neutral-300 hover:text-white active:bg-amber-500 active:text-neutral-950 transition-all cursor-pointer text-[10px] font-bold flex items-center gap-1"
            >
              <span>📢 SIGNAL (H)</span>
            </button>
            <button
              id="btn-hud-lights"
              onClick={onToggleLights}
              title="Faralar (L)"
              className="p-1.5 rounded-lg bg-neutral-900 border border-white/10 text-neutral-300 hover:text-white active:bg-sky-500 active:text-neutral-950 transition-all cursor-pointer text-[10px] font-bold flex items-center gap-1"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>FARA (L)</span>
            </button>
          </div>
        </div>

        {/* Mobile Right Touch Controls: Gas, Brake, Handbrake */}
        <div className="pointer-events-auto flex items-end gap-3 sm:gap-4 md:hidden">
          {/* Handbrake */}
          <button
            id="btn-touch-handbrake"
            onTouchStart={() => onTouchInput('handbrake', true)}
            onTouchEnd={() => onTouchInput('handbrake', false)}
            onMouseDown={() => onTouchInput('handbrake', true)}
            onMouseUp={() => onTouchInput('handbrake', false)}
            className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 active:bg-amber-500 flex items-center justify-center text-amber-300 active:text-neutral-950 text-xs font-bold backdrop-blur-md shadow-xl"
          >
            P
          </button>

          {/* Brake / Reverse */}
          <button
            id="btn-touch-brake"
            onTouchStart={() => onTouchInput('brake', true)}
            onTouchEnd={() => onTouchInput('brake', false)}
            onMouseDown={() => onTouchInput('brake', true)}
            onMouseUp={() => onTouchInput('brake', false)}
            className="w-14 h-16 rounded-2xl bg-neutral-900/90 border border-red-500/40 active:bg-red-500/60 flex flex-col items-center justify-center text-red-400 active:text-white text-xs font-bold backdrop-blur-md shadow-xl"
          >
            <span className="text-lg">⬇</span>
            <span>TORMOZ</span>
          </button>

          {/* Throttle / Gas */}
          <button
            id="btn-touch-throttle"
            onTouchStart={() => onTouchInput('throttle', true)}
            onTouchEnd={() => onTouchInput('throttle', false)}
            onMouseDown={() => onTouchInput('throttle', true)}
            onMouseUp={() => onTouchInput('throttle', false)}
            className="w-14 h-20 rounded-2xl bg-emerald-600/80 border border-emerald-400 active:bg-emerald-500 flex flex-col items-center justify-center text-white text-xs font-bold backdrop-blur-md shadow-xl"
          >
            <span className="text-xl">⬆</span>
            <span>GAZ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
