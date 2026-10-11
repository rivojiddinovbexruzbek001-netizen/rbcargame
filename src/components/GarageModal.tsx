import React from 'react';
import { CarId, CarSpec } from '../types/game';
import { CAR_SPECS } from '../data/cars';
import { X, Check, ShoppingCart, ArrowLeft, ArrowRight, Gauge, Zap, Shield, Flame } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface GarageModalProps {
  selectedCarId: CarId;
  unlockedCars: CarId[];
  moneySom: number;
  onSelectCar: (carId: CarId) => void;
  onBuyCar: (carId: CarId, price: number) => void;
  onClose: () => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  selectedCarId,
  unlockedCars,
  moneySom,
  onSelectCar,
  onBuyCar,
  onClose,
}) => {
  const carList = Object.values(CAR_SPECS);
  const [activeCarId, setActiveCarId] = React.useState<CarId>(selectedCarId);

  const currentSpec = CAR_SPECS[activeCarId];
  const isUnlocked = unlockedCars.includes(activeCarId);
  const isSelected = selectedCarId === activeCarId;
  const canAfford = moneySom >= currentSpec.price;

  const handleSelect = (id: CarId) => {
    soundManager.playClick();
    setActiveCarId(id);
    onSelectCar(id);
  };

  const handleBuy = () => {
    if (!isUnlocked && canAfford) {
      soundManager.playMoneyChime();
      onBuyCar(activeCarId, currentSpec.price);
    }
  };

  return (
    <div
      id="garage-modal-overlay"
      className="absolute inset-0 select-none bg-neutral-950/60 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 z-30 pointer-events-auto"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs uppercase tracking-wider text-sky-400 font-bold">AVTO SALON</span>
            <h2 className="font-racing text-2xl sm:text-3xl font-black text-white">GARAGE</h2>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-neutral-900/90 border border-emerald-500/40 px-4 py-1.5 rounded-2xl flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs uppercase text-emerald-400 font-bold">SO‘M:</span>
          <span className="font-racing text-xl font-bold text-white">{moneySom.toLocaleString('uz-UZ')}</span>
        </div>
      </div>

      {/* Center: Car Details Sidecard */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between my-auto">
        <div className="bg-neutral-950/85 border border-white/10 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl max-w-sm sm:max-w-md w-full shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-sky-400 font-bold">
              {currentSpec.category}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300 font-semibold">
              {currentSpec.driveType} uzatma
            </span>
          </div>

          <h3 className="font-racing text-3xl sm:text-4xl font-black text-white mt-1">{currentSpec.name}</h3>
          <p className="text-xs text-neutral-400 mt-2 leading-relaxed">{currentSpec.description}</p>

          {/* Stats Breakdown */}
          <div className="space-y-3 mt-5 pt-4 border-t border-white/10 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <Gauge className="w-4 h-4 text-sky-400" /> TEZLIK
                </span>
                <span className="font-racing text-sky-400">{currentSpec.topSpeedKmh} KM/S</span>
              </div>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-full transition-all"
                  style={{ width: `${(currentSpec.topSpeedKmh / 260) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <Zap className="w-4 h-4 text-amber-400" /> TEZLANISH
                </span>
                <span className="font-racing text-amber-400">{currentSpec.acceleration} / 10</span>
              </div>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${currentSpec.acceleration * 10}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <Shield className="w-4 h-4 text-red-400" /> TORMOZ
                </span>
                <span className="font-racing text-red-400">{currentSpec.braking} / 10</span>
              </div>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-400 rounded-full transition-all"
                  style={{ width: `${currentSpec.braking * 10}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <Flame className="w-4 h-4 text-purple-400" /> DRIFT
                </span>
                <span className="font-racing text-purple-400">{currentSpec.driftRating} / 10</span>
              </div>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-400 rounded-full transition-all"
                  style={{ width: `${currentSpec.driftRating * 10}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action button: Select or Buy */}
          <div className="mt-6 pt-4 border-t border-white/10">
            {isUnlocked ? (
              <button
                id="btn-garage-select"
                onClick={() => handleSelect(activeCarId)}
                className={`w-full py-3.5 rounded-2xl font-racing font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-400'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/30'
                }`}
              >
                <Check className="w-5 h-5" />
                <span>{isSelected ? 'TANLANGAN' : 'USHBU MASHINANI TANLASH'}</span>
              </button>
            ) : (
              <button
                id="btn-garage-buy"
                onClick={handleBuy}
                disabled={!canAfford}
                className={`w-full py-3.5 rounded-2xl font-racing font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  canAfford
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 shadow-xl shadow-amber-500/20'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/5'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span>
                  SOTIB OLISH: {currentSpec.price.toLocaleString('uz-UZ')} SO‘M
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Horizontal Car Carousel Selector */}
      <div className="w-full max-w-7xl mx-auto overflow-x-auto pb-2 pt-4">
        <div className="flex items-center gap-3 min-w-max">
          {carList.map((car) => {
            const unlocked = unlockedCars.includes(car.id);
            const active = car.id === activeCarId;
            return (
              <button
                key={car.id}
                id={`btn-garage-car-${car.id}`}
                onClick={() => handleSelect(car.id)}
                className={`px-4 py-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-w-[170px] ${
                  active
                    ? 'bg-sky-600/20 border-sky-400 shadow-xl shadow-sky-500/10'
                    : 'bg-neutral-900/80 border-white/10 hover:border-white/30 text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">{car.category}</span>
                  {unlocked ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                      Ochiq
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                      {car.price.toLocaleString()} so‘m
                    </span>
                  )}
                </div>
                <div className="font-racing font-bold text-sm sm:text-base text-white">{car.name}</div>
                <div className="text-[11px] text-neutral-400 mt-1">{car.topSpeedKmh} km/s • {car.driveType}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
