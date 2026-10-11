import React from 'react';
import { CarId, CarTuning, RimStyle, SpoilerStyle, TireType } from '../types/game';
import { COLOR_PALETTE, TIRE_SPECS } from '../data/cars';
import { ArrowLeft, Palette, Disc, Shield, Gauge, Zap, Sparkles, Check } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface TuningModalProps {
  carId: CarId;
  currentTuning: CarTuning;
  moneySom: number;
  onUpdateTuning: (newTuning: CarTuning) => void;
  onDeductMoney: (amount: number) => boolean;
  onClose: () => void;
}

export const TuningModal: React.FC<TuningModalProps> = ({
  carId,
  currentTuning,
  moneySom,
  onUpdateTuning,
  onDeductMoney,
  onClose,
}) => {
  const [tab, setTab] = React.useState<'visual' | 'performance'>('visual');
  const [tuning, setTuning] = React.useState<CarTuning>({ ...currentTuning });

  const applyAndSave = (updated: CarTuning) => {
    setTuning(updated);
    onUpdateTuning(updated);
  };

  const handleColorChange = (hex: string) => {
    soundManager.playClick();
    applyAndSave({ ...tuning, paintColor: hex });
  };

  const handleFinishChange = (finish: 'gloss' | 'metallic' | 'matte') => {
    soundManager.playClick();
    applyAndSave({ ...tuning, finish });
  };

  const handleTintChange = (tintLevel: number) => {
    soundManager.playClick();
    applyAndSave({ ...tuning, tintLevel });
  };

  const handleRimChange = (rimStyle: RimStyle) => {
    soundManager.playClick();
    applyAndSave({ ...tuning, rimStyle });
  };

  const handleSpoilerChange = (spoiler: SpoilerStyle) => {
    soundManager.playClick();
    applyAndSave({ ...tuning, spoiler });
  };

  const handleSuspensionChange = (suspensionOffset: number) => {
    soundManager.playClick();
    applyAndSave({ ...tuning, suspensionOffset });
  };

  const handleUpgradeEngine = () => {
    if (tuning.engineStage < 3) {
      const cost = tuning.engineStage === 1 ? 12000 : 25000;
      if (onDeductMoney(cost)) {
        soundManager.playMoneyChime();
        applyAndSave({ ...tuning, engineStage: tuning.engineStage + 1 });
      }
    }
  };

  const handleUpgradeTurbo = () => {
    if (!tuning.hasTurbo) {
      const cost = 28000;
      if (onDeductMoney(cost)) {
        soundManager.playMoneyChime();
        applyAndSave({ ...tuning, hasTurbo: true });
      }
    }
  };

  const handleUpgradeBrakes = () => {
    if (tuning.brakeStage < 3) {
      const cost = 8000;
      if (onDeductMoney(cost)) {
        soundManager.playMoneyChime();
        applyAndSave({ ...tuning, brakeStage: tuning.brakeStage + 1 });
      }
    }
  };

  const handleTireChange = (tireType: TireType, cost: number) => {
    if (tuning.tireType === tireType) return;
    if (cost === 0 || onDeductMoney(cost)) {
      soundManager.playMoneyChime();
      applyAndSave({ ...tuning, tireType });
    }
  };

  const handleDriftSetupToggle = () => {
    soundManager.playClick();
    applyAndSave({ ...tuning, driftSetup: !tuning.driftSetup });
  };

  return (
    <div
      id="tuning-modal-overlay"
      className="absolute inset-0 select-none bg-neutral-950/60 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 z-30 pointer-events-auto"
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
            <span className="text-xs uppercase tracking-wider text-purple-400 font-bold">USTAXONA</span>
            <h2 className="font-racing text-2xl sm:text-3xl font-black text-white">AVTO TYUNING</h2>
          </div>
        </div>

        {/* Currency Display */}
        <div className="bg-neutral-900/90 border border-emerald-500/40 px-4 py-1.5 rounded-2xl flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs uppercase text-emerald-400 font-bold">SO‘M:</span>
          <span className="font-racing text-xl font-bold text-white">{moneySom.toLocaleString('uz-UZ')}</span>
        </div>
      </div>

      {/* Main Settings Panel */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between my-auto">
        <div className="bg-neutral-950/90 border border-white/10 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl max-w-lg w-full shadow-2xl overflow-y-auto max-h-[75vh]">
          {/* Tab buttons */}
          <div className="flex items-center gap-2 p-1 bg-neutral-900 rounded-2xl mb-5 border border-white/5">
            <button
              onClick={() => {
                soundManager.playClick();
                setTab('visual');
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-racing font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                tab === 'visual' ? 'bg-purple-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>VIZUAL TYUNING</span>
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setTab('performance');
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-racing font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                tab === 'performance' ? 'bg-amber-500 text-neutral-950 shadow-lg' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>KUCH & HARAKAT</span>
            </button>
          </div>

          {tab === 'visual' ? (
            <div className="space-y-5">
              {/* 1. Paint Color */}
              <div>
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
                  Kuzov Rangi
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_PALETTE.map((c) => {
                    const active = tuning.paintColor.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        onClick={() => handleColorChange(c.hex)}
                        title={c.name}
                        className={`h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                          active ? 'border-sky-400 ring-2 ring-sky-400/40 scale-105' : 'border-white/10 hover:border-white/40'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {active && <Check className={`w-4 h-4 ${c.hex === '#f8fafc' ? 'text-black' : 'text-white'}`} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Paint Finish */}
              <div>
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
                  Kuzov Lak qoplamasi
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                  {(['gloss', 'metallic', 'matte'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => handleFinishChange(f)}
                      className={`py-2 rounded-xl border capitalize transition-all cursor-pointer ${
                        tuning.finish === f
                          ? 'bg-purple-600/30 border-purple-400 text-purple-300'
                          : 'bg-neutral-900 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {f === 'gloss' && 'Yaltiroq'}
                      {f === 'metallic' && 'Metallik'}
                      {f === 'matte' && 'Xira (Matte)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Rim Styles */}
              <div>
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
                  Disk Dizayni
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  {[
                    { id: 'stock', name: 'Zavod OEM' },
                    { id: 'vossen', name: 'Vossen CV3' },
                    { id: 'bbs', name: 'BBS Mesh' },
                    { id: 'sport5', name: 'Sport 5-Spoke' },
                    { id: 'shtamp', name: 'Qora Shtampovka' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleRimChange(r.id as RimStyle)}
                      className={`py-2 px-3 rounded-xl border text-left transition-all cursor-pointer ${
                        tuning.rimStyle === r.id
                          ? 'bg-purple-600/30 border-purple-400 text-purple-300'
                          : 'bg-neutral-900 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Window Tinting (Toning) */}
              <div>
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
                  Oynalar Toningi (Qoraytirish)
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                  {[
                    { val: 0, label: 'Zavod (0%)' },
                    { val: 50, label: 'Lyuks (50%)' },
                    { val: 100, label: 'Krugovoy (100%)' },
                  ].map((t) => (
                    <button
                      key={t.val}
                      onClick={() => handleTintChange(t.val)}
                      className={`py-2 rounded-xl border transition-all cursor-pointer ${
                        tuning.tintLevel === t.val
                          ? 'bg-purple-600/30 border-purple-400 text-purple-300'
                          : 'bg-neutral-900 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Suspension Height */}
              <div>
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
                  Podveska (Klirens balandligi)
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                  {[
                    { offset: -0.05, label: 'Pasaytirilgan' },
                    { offset: 0, label: 'Standart Zavod' },
                    { offset: 0.03, label: 'Ko‘tarilgan' },
                  ].map((s) => (
                    <button
                      key={s.offset}
                      onClick={() => handleSuspensionChange(s.offset)}
                      className={`py-2 rounded-xl border transition-all cursor-pointer ${
                        tuning.suspensionOffset === s.offset
                          ? 'bg-purple-600/30 border-purple-400 text-purple-300'
                          : 'bg-neutral-900 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Spoilers */}
              <div>
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
                  Spoyler
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                  {[
                    { id: 'none', label: 'Yo‘q' },
                    { id: 'lip', label: 'Lip Spoyler' },
                    { id: 'gt', label: 'GT Sport Qanot' },
                  ].map((sp) => (
                    <button
                      key={sp.id}
                      onClick={() => handleSpoilerChange(sp.id as SpoilerStyle)}
                      className={`py-2 rounded-xl border transition-all cursor-pointer ${
                        tuning.spoiler === sp.id
                          ? 'bg-purple-600/30 border-purple-400 text-purple-300'
                          : 'bg-neutral-900 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {sp.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Performance 1: Engine Stage */}
              <div className="p-3.5 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-racing font-bold text-white text-base">DVIGATEL (ENGINE)</div>
                  <div className="text-xs text-neutral-400">Tezlanish va ot kuchini oshirish</div>
                  <div className="text-xs font-bold text-amber-400 mt-1">Hozir: Stage {tuning.engineStage} / 3</div>
                </div>
                {tuning.engineStage < 3 ? (
                  <button
                    onClick={handleUpgradeEngine}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-racing font-bold text-xs cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    +{(tuning.engineStage === 1 ? 12000 : 25000).toLocaleString()} SO‘M
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 font-bold px-2 py-1 bg-emerald-500/10 rounded-lg">
                    MAKSIMAL
                  </span>
                )}
              </div>

              {/* Performance 2: Turbo */}
              <div className="p-3.5 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-racing font-bold text-white text-base flex items-center gap-1.5">
                    <span>TURBO ZARYADLAGICH</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xs text-neutral-400">+Maksimal tezlik va "pshhh" tovushi</div>
                </div>
                {!tuning.hasTurbo ? (
                  <button
                    onClick={handleUpgradeTurbo}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-racing font-bold text-xs cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    +28 000 SO‘M
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 font-bold px-2 py-1 bg-emerald-500/10 rounded-lg">
                    O‘RNATILGAN
                  </span>
                )}
              </div>

              {/* Performance 3: Brakes */}
              <div className="p-3.5 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-racing font-bold text-white text-base">SPORT TORMOZLAR</div>
                  <div className="text-xs text-neutral-400">Tormoz masofasini qisqartirish</div>
                  <div className="text-xs font-bold text-red-400 mt-1">Stage {tuning.brakeStage} / 3</div>
                </div>
                {tuning.brakeStage < 3 ? (
                  <button
                    onClick={handleUpgradeBrakes}
                    className="px-3.5 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-racing font-bold text-xs cursor-pointer"
                  >
                    +8 000 SO‘M
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 font-bold px-2 py-1 bg-emerald-500/10 rounded-lg">
                    MAKSIMAL
                  </span>
                )}
              </div>

              {/* Performance 4: Tires */}
              <div>
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
                  Shina Turi (Grip & Drift)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIRE_SPECS.map((tire) => {
                    const isSelected = tuning.tireType === tire.id;
                    return (
                      <button
                        key={tire.id}
                        onClick={() => handleTireChange(tire.id as TireType, tire.price)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-neutral-900 border-white/10 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-xs text-white">{tire.name}</div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          Grip: x{tire.grip} • Drift: x{tire.drift}
                        </div>
                        <div className="text-[10px] font-bold text-amber-400 mt-1">
                          {isSelected ? 'O‘rnatilgan' : tire.price === 0 ? 'Bepul' : `${tire.price.toLocaleString()} so‘m`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Performance 5: Drift Setup */}
              <div className="p-3.5 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-racing font-bold text-white text-base">DRIFT SETUP</div>
                  <div className="text-xs text-neutral-400">Sirpanish burchagi va boshqaruvni oshirish</div>
                </div>
                <button
                  onClick={handleDriftSetupToggle}
                  className={`px-3.5 py-1.5 rounded-xl font-racing font-bold text-xs cursor-pointer transition-all ${
                    tuning.driftSetup
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {tuning.driftSetup ? 'YOQILGAN' : 'O‘CHIRILGAN'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
