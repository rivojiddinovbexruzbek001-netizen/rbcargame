import React from 'react';
import { GraphicQuality, WeatherType } from '../types/game';
import { ArrowLeft, Monitor, CloudSun, Volume2, Keyboard, Sun, CloudRain, CloudFog, Moon } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface SettingsModalProps {
  currentWeather: WeatherType;
  currentQuality: GraphicQuality;
  onWeatherChange: (w: WeatherType) => void;
  onQualityChange: (q: GraphicQuality) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentWeather,
  currentQuality,
  onWeatherChange,
  onQualityChange,
  onClose,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundManager.getMuted());
  const [isRadioOn, setIsRadioOn] = React.useState(soundManager.isRadioOn());

  const handleToggleMute = () => {
    const res = soundManager.toggleMute();
    setIsMuted(res);
  };

  const handleToggleRadio = () => {
    const res = soundManager.toggleRadio();
    setIsRadioOn(res);
  };

  return (
    <div
      id="settings-modal-overlay"
      className="absolute inset-0 select-none bg-neutral-950/70 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 z-30 pointer-events-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold">SOZLAMALAR</span>
            <h2 className="font-racing text-2xl sm:text-3xl font-black text-white">GRAFIKA & OVOZ</h2>
          </div>
        </div>
      </div>

      {/* Center Settings Card */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between my-auto">
        <div className="bg-neutral-950/90 border border-white/10 backdrop-blur-2xl p-6 rounded-3xl max-w-lg w-full shadow-2xl space-y-5 overflow-y-auto max-h-[75vh]">
          {/* 1. Ob-havo (Weather) */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
              <CloudSun className="w-4 h-4 text-sky-400" />
              <span>OB-HAVO TIZIMI</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'sunny', name: 'Quyoshli', icon: Sun, color: 'text-amber-400' },
                { id: 'rain', name: 'Yomg‘ir', icon: CloudRain, color: 'text-sky-400' },
                { id: 'fog', name: 'Tuman', icon: CloudFog, color: 'text-neutral-400' },
                { id: 'night', name: 'Tun', icon: Moon, color: 'text-purple-400' },
              ].map((w) => {
                const active = currentWeather === w.id;
                const Icon = w.icon;
                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      soundManager.playClick();
                      onWeatherChange(w.id as WeatherType);
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      active
                        ? 'bg-sky-600/30 border-sky-400 text-white shadow-lg'
                        : 'bg-neutral-900 border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${w.color}`} />
                    <span className="text-xs font-bold">{w.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Grafika sifati (Quality: Low, Medium, High) */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
              <Monitor className="w-4 h-4 text-emerald-400" />
              <span>GRAFIKA SIFATI (FPS OPTIMIZATSIYA)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low', name: 'Past (Low)', desc: 'Yuqori FPS' },
                { id: 'medium', name: 'O‘rta (Medium)', desc: 'Balans' },
                { id: 'high', name: 'Yuqori (High)', desc: 'To‘liq soyalar' },
              ].map((q) => {
                const active = currentQuality === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      soundManager.playClick();
                      onQualityChange(q.id as GraphicQuality);
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      active
                        ? 'bg-emerald-600/30 border-emerald-400 text-white shadow-lg'
                        : 'bg-neutral-900 border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="font-racing font-bold text-xs sm:text-sm">{q.name}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{q.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Ovozlar va Musiqa */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
              <Volume2 className="w-4 h-4 text-purple-400" />
              <span>OVOZ & RADIO</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleToggleMute}
                className={`p-3 rounded-2xl border transition-all cursor-pointer font-racing font-bold text-xs ${
                  isMuted ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-neutral-900 border-white/10 text-emerald-400'
                }`}
              >
                OVOZ: {isMuted ? 'O‘CHIRILGAN' : 'YOQILGAN'}
              </button>

              <button
                onClick={handleToggleRadio}
                className={`p-3 rounded-2xl border transition-all cursor-pointer font-racing font-bold text-xs ${
                  isRadioOn
                    ? 'bg-purple-600/30 border-purple-400 text-purple-300'
                    : 'bg-neutral-900 border-white/10 text-neutral-400'
                }`}
              >
                O‘ZBEK RADIO: {isRadioOn ? 'YOQILGAN' : 'O‘CHIRILGAN'}
              </button>
            </div>
          </div>

          {/* 4. Boshqaruv qo'llanmasi (Controls Guide) */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
              <Keyboard className="w-4 h-4 text-sky-400" />
              <span>BOSHQARUV TUGMALARI</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-300 bg-neutral-900/80 p-3 rounded-2xl border border-white/5">
              <div><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-white/20 text-sky-400 font-bold">W</kbd> yoki <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-white/20 text-sky-400 font-bold">↑</kbd> : Gaz</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-white/20 text-red-400 font-bold">S</kbd> yoki <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-white/20 text-red-400 font-bold">↓</kbd> : Tormoz / Orqaga</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-white/20 font-bold">A / D</kbd> : Rul (Chap / O‘ng)</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-white/20 text-amber-400 font-bold">SPACE</kbd> : Qo‘l tormozi (Drift)</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-white/20 font-bold">C</kbd> : Kamera almashtirish</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-white/20 font-bold">R</kbd> : Qayta tiklash</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-white/20 font-bold">H</kbd> : Signal (Klakson)</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-white/20 font-bold">L</kbd> : Faralar (Chiroq)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
