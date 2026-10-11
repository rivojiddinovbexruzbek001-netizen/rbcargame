import React, { useEffect, useRef, useState } from 'react';
import { CameraView, CarId, CarTuning, GameMode, GraphicQuality, OnlineRoom, WeatherType } from './types/game';
import { CAR_SPECS, DEFAULT_TUNING } from './data/cars';
import { CarSimulator, RaceState, TaxiState } from './game/CarSimulator';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { GarageModal } from './components/GarageModal';
import { TuningModal } from './components/TuningModal';
import { OnlineModal } from './components/OnlineModal';
import { SettingsModal } from './components/SettingsModal';
import { soundManager } from './audio/soundManager';

const STORAGE_KEY_SAVE = 'uzbek_auto_drive_save_v1';

interface SavedData {
  moneySom: number;
  unlockedCars: CarId[];
  selectedCarId: CarId;
  carTunings: Record<CarId, CarTuning>;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<CarSimulator | null>(null);

  // Persistent user state with LocalStorage
  const [saveData, setSaveData] = useState<SavedData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVE);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {
      moneySom: 45000,
      unlockedCars: ['gentra'],
      selectedCarId: 'gentra',
      carTunings: {
        gentra: { ...DEFAULT_TUNING, paintColor: '#111827' },
        cobalt: { ...DEFAULT_TUNING, paintColor: '#f8fafc' },
        damas: { ...DEFAULT_TUNING, paintColor: '#ffffff' },
        nexia3: { ...DEFAULT_TUNING, paintColor: '#71717a' },
        nexia2: { ...DEFAULT_TUNING, paintColor: '#94a3b8' },
        spark: { ...DEFAULT_TUNING, paintColor: '#38bdf8' },
        matiz: { ...DEFAULT_TUNING, paintColor: '#cbd5e1' },
        malibu: { ...DEFAULT_TUNING, paintColor: '#0f172a' },
        lacetti: { ...DEFAULT_TUNING, paintColor: '#1e293b' },
        lada: { ...DEFAULT_TUNING, paintColor: '#ffffff' },
      },
    };
  });

  // Game UI state
  const [inMenu, setInMenu] = useState<boolean>(true);
  const [activeModal, setActiveModal] = useState<'none' | 'garage' | 'tuning' | 'online' | 'settings'>('none');
  const [gameMode, setGameMode] = useState<GameMode>('freedrive');
  const [cameraView, setCameraView] = useState<CameraView>('third_person');
  const [weather, setWeather] = useState<WeatherType>('sunny');
  const [quality, setQuality] = useState<GraphicQuality>('high');

  // Live Telemetry
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [rpm, setRpm] = useState<number>(900);
  const [gear, setGear] = useState<number>(1);
  const [driftScore, setDriftScore] = useState<number>(0);
  const [comboMultiplier, setComboMultiplier] = useState<number>(1);
  const [isDrifting, setIsDrifting] = useState<boolean>(false);
  const [radarAlert, setRadarAlert] = useState<{ speed: number; fine: number } | null>(null);

  // Mission States
  const [raceState, setRaceState] = useState<RaceState>({
    active: false,
    lap: 1,
    totalLaps: 3,
    currentCheckpoint: 0,
    checkpoints: [],
    checkpointMeshes: [],
    startTime: 0,
    lapTimes: [],
    position: 1,
    isFinished: false,
  });

  const [taxiState, setTaxiState] = useState<TaxiState>({
    active: false,
    passengerName: 'Dilshod aka',
    destinationName: 'Toshkent City',
    destinationPos: { x: 0, y: 0, z: 0 } as any,
    rewardSom: 15000,
    hasPickedUp: false,
  });

  // Save to LocalStorage on update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVE, JSON.stringify(saveData));
    } catch {
      // ignore
    }
  }, [saveData]);

  // Initialize Simulator on Mount
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const tuning = saveData.carTunings[saveData.selectedCarId] || DEFAULT_TUNING;

    const sim = new CarSimulator(canvas, saveData.selectedCarId, tuning);
    simRef.current = sim;

    // Callbacks from simulation
    sim.onRadarFlash = (speed, fine) => {
      setRadarAlert({ speed, fine });
      setSaveData((prev) => ({
        ...prev,
        moneySom: Math.max(0, prev.moneySom - fine),
      }));
      setTimeout(() => setRadarAlert(null), 4000);
    };

    sim.onRaceUpdate = (state) => {
      setRaceState({ ...state });
      if (state.isFinished) {
        // Race won reward!
        const reward = 35000;
        setSaveData((prev) => ({ ...prev, moneySom: prev.moneySom + reward }));
      }
    };

    sim.onTaxiUpdate = (state) => {
      setTaxiState({ ...state });
      if (!state.active && state.hasPickedUp) {
        // Destination reached
        setSaveData((prev) => ({ ...prev, moneySom: prev.moneySom + state.rewardSom }));
      }
    };

    // Resize observer
    const handleResize = () => {
      if (canvasRef.current && sim) {
        sim.resize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Initial start
    sim.isGarageMode = true;
    sim.start();

    // Telemetry update interval (30 fps for smooth HUD)
    const hudInterval = setInterval(() => {
      if (!simRef.current) return;
      const phys = simRef.current.physics;
      setSpeedKmh(phys.speedKmh);
      setRpm(phys.rpm);
      setGear(phys.currentGear);
      setIsDrifting(phys.driftState.isDrifting);
      setDriftScore(Math.round(phys.driftState.currentScore));
      setComboMultiplier(phys.driftState.comboMultiplier);

      // Bank drift money if drift ended with high score
      if (phys.driftState.currentScore > 300 && !phys.driftState.isDrifting) {
        const reward = Math.round(phys.driftState.currentScore * 0.2);
        setSaveData((prev) => ({ ...prev, moneySom: prev.moneySom + reward }));
        phys.driftState.currentScore = 0;
      }
    }, 40);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(hudInterval);
      sim.destroy();
    };
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      const sim = simRef.current;
      if (!sim) return;

      const key = e.key.toLowerCase();

      if (key === 'w' || e.key === 'ArrowUp') {
        sim.inputs.throttle = 1;
      } else if (key === 's' || e.key === 'ArrowDown') {
        sim.inputs.brake = 1;
      } else if (key === 'a' || e.key === 'ArrowLeft') {
        sim.inputs.steer = -1;
      } else if (key === 'd' || e.key === 'ArrowRight') {
        sim.inputs.steer = 1;
      } else if (e.code === 'Space') {
        e.preventDefault();
        sim.inputs.handbrake = true;
      } else if (key === 'c') {
        handleCameraChange();
      } else if (key === 'r') {
        handleResetCar();
      } else if (key === 'h') {
        soundManager.playHorn();
      } else if (key === 'l') {
        sim.inputs.headlights = !sim.inputs.headlights;
        sim.setWeather(sim.weather); // re-evaluates headlights
      } else if (e.key === 'Escape') {
        setInMenu((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const sim = simRef.current;
      if (!sim) return;

      const key = e.key.toLowerCase();
      if (key === 'w' || e.key === 'ArrowUp') {
        sim.inputs.throttle = 0;
      } else if (key === 's' || e.key === 'ArrowDown') {
        sim.inputs.brake = 0;
      } else if (key === 'a' || e.key === 'ArrowLeft' || key === 'd' || e.key === 'ArrowRight') {
        sim.inputs.steer = 0;
      } else if (e.code === 'Space') {
        sim.inputs.handbrake = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [cameraView]);

  // Touch handlers for mobile
  const handleTouchInput = (key: 'throttle' | 'brake' | 'steerLeft' | 'steerRight' | 'handbrake', active: boolean) => {
    const sim = simRef.current;
    if (!sim) return;

    if (key === 'throttle') sim.inputs.throttle = active ? 1 : 0;
    if (key === 'brake') sim.inputs.brake = active ? 1 : 0;
    if (key === 'steerLeft') sim.inputs.steer = active ? -1 : 0;
    if (key === 'steerRight') sim.inputs.steer = active ? 1 : 0;
    if (key === 'handbrake') sim.inputs.handbrake = active;
  };

  // Camera Cycle
  const handleCameraChange = () => {
    soundManager.playClick();
    const views: CameraView[] = ['third_person', 'close_chase', 'hood', 'cockpit'];
    const nextIdx = (views.indexOf(cameraView) + 1) % views.length;
    const nextView = views[nextIdx];
    setCameraView(nextView);
    if (simRef.current) {
      simRef.current.cameraView = nextView;
    }
  };

  // Reset Car position
  const handleResetCar = () => {
    soundManager.playClick();
    if (simRef.current) {
      simRef.current.resetCar();
    }
  };

  // Start game with specified mode
  const handleStartGame = (mode: GameMode) => {
    setGameMode(mode);
    setInMenu(false);
    setActiveModal('none');

    if (simRef.current) {
      simRef.current.isGarageMode = false;
      simRef.current.gameMode = mode;
      simRef.current.resetCar();

      if (mode === 'race') {
        simRef.current.startRace();
      } else if (mode === 'simulator') {
        simRef.current.startTaxiMission();
      }
    }
  };

  // Select Car
  const handleSelectCar = (carId: CarId) => {
    setSaveData((prev) => ({ ...prev, selectedCarId: carId }));
    if (simRef.current) {
      const tuning = saveData.carTunings[carId] || DEFAULT_TUNING;
      simRef.current.loadCar(carId, tuning);
    }
  };

  // Buy Car
  const handleBuyCar = (carId: CarId, price: number) => {
    if (saveData.moneySom >= price) {
      setSaveData((prev) => ({
        ...prev,
        moneySom: prev.moneySom - price,
        unlockedCars: [...prev.unlockedCars, carId],
        selectedCarId: carId,
      }));
      if (simRef.current) {
        const tuning = saveData.carTunings[carId] || DEFAULT_TUNING;
        simRef.current.loadCar(carId, tuning);
      }
    }
  };

  // Update Tuning
  const handleUpdateTuning = (newTuning: CarTuning) => {
    setSaveData((prev) => ({
      ...prev,
      carTunings: {
        ...prev.carTunings,
        [saveData.selectedCarId]: newTuning,
      },
    }));
    if (simRef.current) {
      simRef.current.loadCar(saveData.selectedCarId, newTuning);
    }
  };

  // Deduct Money (for tuning purchases)
  const handleDeductMoney = (amount: number): boolean => {
    if (saveData.moneySom >= amount) {
      setSaveData((prev) => ({ ...prev, moneySom: prev.moneySom - amount }));
      return true;
    }
    return false;
  };

  // Weather change
  const handleWeatherChange = (w: WeatherType) => {
    setWeather(w);
    if (simRef.current) {
      simRef.current.setWeather(w);
    }
  };

  // Quality change
  const handleQualityChange = (q: GraphicQuality) => {
    setQuality(q);
    if (simRef.current) {
      simRef.current.setQuality(q);
    }
  };

  // Online Join Room
  const handleJoinOnlineRoom = (room: OnlineRoom) => {
    handleStartGame('online');
  };

  const activeSpec = CAR_SPECS[saveData.selectedCarId];
  const activeTuning = saveData.carTunings[saveData.selectedCarId] || DEFAULT_TUNING;

  return (
    <div id="uzbek-auto-drive-root" className="relative w-screen h-screen overflow-hidden bg-black font-sans select-none">
      {/* 3D WebGL Canvas Viewport */}
      <canvas ref={canvasRef} id="webgl-canvas" className="w-full h-full block" />

      {/* Main Gameplay HUD (When in game) */}
      {!inMenu && (
        <HUD
          speedKmh={speedKmh}
          rpm={rpm}
          gear={gear}
          driftScore={driftScore}
          comboMultiplier={comboMultiplier}
          isDrifting={isDrifting}
          moneySom={saveData.moneySom}
          cameraView={cameraView}
          gameMode={gameMode}
          raceState={raceState}
          taxiState={taxiState}
          radarAlert={radarAlert}
          onCameraChange={handleCameraChange}
          onResetCar={handleResetCar}
          onOpenMenu={() => {
            soundManager.playClick();
            if (simRef.current) simRef.current.isGarageMode = true;
            setInMenu(true);
          }}
          onTouchInput={handleTouchInput}
          onToggleLights={() => {
            if (simRef.current) {
              simRef.current.inputs.headlights = !simRef.current.inputs.headlights;
              simRef.current.setWeather(simRef.current.weather);
            }
          }}
          onHorn={() => soundManager.playHorn()}
        />
      )}

      {/* Main Menu (When in menu and no modal open) */}
      {inMenu && activeModal === 'none' && (
        <MainMenu
          activeCarSpec={activeSpec}
          moneySom={saveData.moneySom}
          onStartGame={handleStartGame}
          onOpenGarage={() => setActiveModal('garage')}
          onOpenTuning={() => setActiveModal('tuning')}
          onOpenOnline={() => setActiveModal('online')}
          onOpenSettings={() => setActiveModal('settings')}
        />
      )}

      {/* Garage Modal */}
      {activeModal === 'garage' && (
        <GarageModal
          selectedCarId={saveData.selectedCarId}
          unlockedCars={saveData.unlockedCars}
          moneySom={saveData.moneySom}
          onSelectCar={handleSelectCar}
          onBuyCar={handleBuyCar}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Tuning Modal */}
      {activeModal === 'tuning' && (
        <TuningModal
          carId={saveData.selectedCarId}
          currentTuning={activeTuning}
          moneySom={saveData.moneySom}
          onUpdateTuning={handleUpdateTuning}
          onDeductMoney={handleDeductMoney}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Online Multiplayer Modal */}
      {activeModal === 'online' && (
        <OnlineModal onJoinRoom={handleJoinOnlineRoom} onClose={() => setActiveModal('none')} />
      )}

      {/* Settings Modal */}
      {activeModal === 'settings' && (
        <SettingsModal
          currentWeather={weather}
          currentQuality={quality}
          onWeatherChange={handleWeatherChange}
          onQualityChange={handleQualityChange}
          onClose={() => setActiveModal('none')}
        />
      )}
    </div>
  );
}
