export type CarId =
  | 'gentra'
  | 'cobalt'
  | 'damas'
  | 'nexia3'
  | 'nexia2'
  | 'spark'
  | 'matiz'
  | 'malibu'
  | 'lacetti'
  | 'lada';

export type GameMode = 'freedrive' | 'drift' | 'race' | 'simulator' | 'online';

export type WeatherType = 'sunny' | 'rain' | 'fog' | 'night';

export type CameraView = 'third_person' | 'close_chase' | 'hood' | 'cockpit';

export type GraphicQuality = 'low' | 'medium' | 'high';

export type TireType = 'street' | 'sport' | 'drift' | 'offroad';

export type RimStyle = 'stock' | 'vossen' | 'bbs' | 'sport5' | 'shtamp';

export type SpoilerStyle = 'none' | 'lip' | 'gt';

export interface CarTuning {
  paintColor: string;
  finish: 'gloss' | 'metallic' | 'matte';
  tintLevel: number; // 0, 50, 100
  rimStyle: RimStyle;
  rimColor: string;
  suspensionOffset: number; // -0.06 to +0.03
  spoiler: SpoilerStyle;
  engineStage: number; // 1 to 3
  hasTurbo: boolean;
  brakeStage: number; // 1 to 3
  tireType: TireType;
  driftSetup: boolean;
}

export interface CarSpec {
  id: CarId;
  name: string;
  category: string;
  description: string;
  price: number; // In so'm, 0 means starter unlocked
  topSpeedKmh: number; // Base top speed
  acceleration: number; // 0-100 responsiveness (1-10)
  braking: number; // 1-10
  handling: number; // 1-10
  driftRating: number; // 1-10
  weightKg: number;
  driveType: 'FWD' | 'RWD' | 'AWD';
  defaultColor: string;
  unlocked: boolean;
}

export interface PlayerStats {
  moneySom: number;
  selectedCarId: CarId;
  unlockedCars: CarId[];
  tunings: Record<CarId, CarTuning>;
  highDriftScore: number;
  raceWins: number;
  completedTaxiRides: number;
}

export interface ActiveMission {
  type: 'taxi' | 'race' | 'drift_challenge' | 'free';
  title: string;
  targetName: string;
  targetDistanceMeters: number;
  rewardSom: number;
  timeRemainingSeconds?: number;
  targetPosition?: [number, number, number];
}

export interface OnlineRoom {
  id: string;
  name: string;
  hostName: string;
  playersCount: number;
  maxPlayers: number;
  mode: string;
  pingMs: number;
}
