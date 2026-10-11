import * as THREE from 'three';
import { buildCar3D, Car3DObject } from './carModels';
import { CarId, CarTuning } from '../types/game';

export interface TrafficCar {
  id: number;
  carId: CarId;
  car3D: Car3DObject;
  position: THREE.Vector3;
  velocity: number; // m/s
  lane: 'north' | 'south' | 'east' | 'west';
  targetSpeed: number;
  isStopped: boolean;
}

export class TrafficSystem {
  public cars: TrafficCar[] = [];
  private scene: THREE.Scene;
  private nextId: number = 1;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.spawnInitialTraffic();
  }

  private spawnInitialTraffic() {
    const trafficTypes: { carId: CarId; color: string; lane: 'north' | 'south' | 'east' | 'west'; startZ: number; startX: number }[] = [
      { carId: 'cobalt', color: '#f8fafc', lane: 'north', startX: 4.5, startZ: -120 },
      { carId: 'damas', color: '#ffffff', lane: 'north', startX: 8.5, startZ: -40 },
      { carId: 'gentra', color: '#111827', lane: 'south', startX: -4.5, startZ: 140 },
      { carId: 'spark', color: '#38bdf8', lane: 'south', startX: -8.5, startZ: 60 },
      { carId: 'nexia2', color: '#94a3b8', lane: 'north', startX: 4.5, startZ: 80 },
      { carId: 'malibu', color: '#0f172a', lane: 'south', startX: -4.5, startZ: -80 },
    ];

    trafficTypes.forEach((cfg) => {
      const tuning: CarTuning = {
        paintColor: cfg.color,
        finish: 'metallic',
        tintLevel: 50,
        rimStyle: 'stock',
        rimColor: '#cbd5e1',
        suspensionOffset: 0,
        spoiler: 'none',
        engineStage: 1,
        hasTurbo: false,
        brakeStage: 1,
        tireType: 'street',
        driftSetup: false,
      };

      const car3D = buildCar3D(cfg.carId, tuning);
      car3D.group.position.set(cfg.startX, 0, cfg.startZ);

      // Facing orientation
      if (cfg.lane === 'north') {
        car3D.group.rotation.y = 0; // heading +Z
      } else if (cfg.lane === 'south') {
        car3D.group.rotation.y = Math.PI; // heading -Z
      }

      this.scene.add(car3D.group);

      this.cars.push({
        id: this.nextId++,
        carId: cfg.carId,
        car3D,
        position: car3D.group.position,
        velocity: 10 + Math.random() * 4, // ~40-50 km/h
        lane: cfg.lane,
        targetSpeed: 11 + Math.random() * 3,
        isStopped: false,
      });
    });
  }

  public update(dt: number, playerPos: THREE.Vector3, isRedLightNorthSouth: boolean) {
    const delta = Math.min(dt, 0.05);

    this.cars.forEach((car) => {
      let speed = car.velocity;
      let shouldStop = false;

      // 1. Check traffic light at center intersection (Z ~ 0)
      if (car.lane === 'north' && car.position.z < -20 && car.position.z > -35 && isRedLightNorthSouth) {
        shouldStop = true;
      } else if (car.lane === 'south' && car.position.z > 20 && car.position.z < 35 && isRedLightNorthSouth) {
        shouldStop = true;
      }

      // 2. Check distance to player
      const distToPlayer = car.position.distanceTo(playerPos);
      if (distToPlayer < 12) {
        // If player is directly ahead in our lane, brake!
        const forward = car.lane === 'north' ? 1 : -1;
        const zDiff = (playerPos.z - car.position.z) * forward;
        if (zDiff > 0 && zDiff < 10 && Math.abs(playerPos.x - car.position.x) < 3.2) {
          shouldStop = true;
        }
      }

      // Accelerate or brake
      if (shouldStop) {
        car.velocity = Math.max(0, car.velocity - 18 * delta);
        car.isStopped = true;
      } else {
        car.velocity = Math.min(car.targetSpeed, car.velocity + 6 * delta);
        car.isStopped = false;
      }

      // Move along lane
      if (car.lane === 'north') {
        car.position.z += car.velocity * delta;
        if (car.position.z > 250) {
          car.position.z = -250; // loop around
        }
      } else if (car.lane === 'south') {
        car.position.z -= car.velocity * delta;
        if (car.position.z < -250) {
          car.position.z = 250; // loop around
        }
      }

      // Rotate wheels with speed
      const wheelRot = (car.velocity / 0.34) * delta;
      car.car3D.wheels.fl.rotation.x += wheelRot;
      car.car3D.wheels.fr.rotation.x -= wheelRot;
      car.car3D.wheels.rl.rotation.x += wheelRot;
      car.car3D.wheels.rr.rotation.x -= wheelRot;

      // Brake light emissive glow
      if (car.isStopped || shouldStop) {
        car.car3D.taillightsMat.emissiveIntensity = 1.2;
      } else {
        car.car3D.taillightsMat.emissiveIntensity = 0.4;
      }
    });
  }

  public checkPlayerCollision(playerPos: THREE.Vector3): { collided: boolean; normal: THREE.Vector3 } {
    for (const car of this.cars) {
      const dx = playerPos.x - car.position.x;
      const dz = playerPos.z - car.position.z;
      if (Math.abs(dx) < 2.0 && Math.abs(dz) < 4.2) {
        const normal = new THREE.Vector3(dx, 0, dz).normalize();
        return { collided: true, normal };
      }
    }
    return { collided: false, normal: new THREE.Vector3() };
  }
}
