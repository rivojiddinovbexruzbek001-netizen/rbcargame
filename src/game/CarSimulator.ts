import * as THREE from 'three';
import { CameraView, CarId, CarSpec, CarTuning, GameMode, GraphicQuality, WeatherType } from '../types/game';
import { CAR_SPECS } from '../data/cars';
import { buildCar3D, Car3DObject } from './carModels';
import { CarPhysics, VehicleInputs } from './physics';
import { UzbekWorld } from './world';
import { TrafficSystem } from './traffic';
import { soundManager } from '../audio/soundManager';

export interface RaceState {
  active: boolean;
  lap: number;
  totalLaps: number;
  currentCheckpoint: number;
  checkpoints: THREE.Vector3[];
  checkpointMeshes: THREE.Mesh[];
  startTime: number;
  lapTimes: number[];
  position: number;
  isFinished: boolean;
}

export interface TaxiState {
  active: boolean;
  passengerName: string;
  destinationName: string;
  destinationPos: THREE.Vector3;
  pickupZoneMesh?: THREE.Mesh;
  rewardSom: number;
  hasPickedUp: boolean;
}

export class CarSimulator {
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  // Components
  public world: UzbekWorld;
  public traffic: TrafficSystem;
  public physics: CarPhysics;

  // Active Car
  public currentCarId: CarId;
  public currentTuning: CarTuning;
  public car3D: Car3DObject | null = null;

  // View & Game settings
  public cameraView: CameraView = 'third_person';
  public gameMode: GameMode = 'freedrive';
  public weather: WeatherType = 'sunny';
  public quality: GraphicQuality = 'high';

  // State
  private isRunning: boolean = false;
  private animFrameId: number = 0;
  private lastTime: number = 0;

  // Inputs
  public inputs: VehicleInputs = {
    throttle: 0,
    brake: 0,
    steer: 0,
    handbrake: false,
    reset: false,
    horn: false,
    headlights: false,
  };

  // Smoke particle mesh pool
  private smokeGeometry: THREE.SphereGeometry;
  private smokeMaterial: THREE.MeshBasicMaterial;
  private smokeMeshPool: THREE.Mesh[] = [];

  // Skidmark line object
  private skidLines: THREE.LineSegments | null = null;

  // Radar notification callback
  public onRadarFlash?: (speedKmh: number, fineSom: number) => void;
  public onDriftAward?: (score: number) => void;
  public onRaceUpdate?: (race: RaceState) => void;
  public onTaxiUpdate?: (taxi: TaxiState) => void;

  // Race system
  public raceState: RaceState = {
    active: false,
    lap: 1,
    totalLaps: 3,
    currentCheckpoint: 0,
    checkpoints: [
      new THREE.Vector3(0, 1.5, 40),
      new THREE.Vector3(0, 1.5, 160),
      new THREE.Vector3(60, 1.5, 120),
      new THREE.Vector3(140, 1.5, 100),
      new THREE.Vector3(140, 1.5, 40),
      new THREE.Vector3(50, 1.5, 0),
      new THREE.Vector3(0, 1.5, -40),
      new THREE.Vector3(0, 1.5, -160),
      new THREE.Vector3(-40, 1.5, -60),
      new THREE.Vector3(0, 1.5, 0),
    ],
    checkpointMeshes: [],
    startTime: 0,
    lapTimes: [],
    position: 1,
    isFinished: false,
  };

  // Taxi Passenger System
  public taxiState: TaxiState = {
    active: false,
    passengerName: 'Dilshod aka',
    destinationName: 'Toshkent City',
    destinationPos: new THREE.Vector3(-35, 0, 70),
    rewardSom: 15000,
    hasPickedUp: false,
  };

  // Garage orbit angle
  public garageOrbitAngle: number = 0;
  public isGarageMode: boolean = false;

  constructor(canvas: HTMLCanvasElement, initialCarId: CarId, initialTuning: CarTuning) {
    this.canvas = canvas;
    this.currentCarId = initialCarId;
    this.currentTuning = initialTuning;

    // 1. Three.js Scene & Renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. World & Traffic
    this.world = new UzbekWorld(this.scene);
    this.traffic = new TrafficSystem(this.scene);

    // 3. Physics
    const spec = CAR_SPECS[initialCarId];
    this.physics = new CarPhysics(spec, initialTuning);

    // 4. Smoke Mesh Pool
    this.smokeGeometry = new THREE.SphereGeometry(0.5, 6, 6);
    this.smokeMaterial = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.5 });
    for (let i = 0; i < 70; i++) {
      const m = new THREE.Mesh(this.smokeGeometry, this.smokeMaterial.clone());
      m.visible = false;
      this.scene.add(m);
      this.smokeMeshPool.push(m);
    }

    // 5. Load Car
    this.loadCar(initialCarId, initialTuning);

    // 6. Build Race Checkpoints
    this.buildRaceCheckpoints();

    // 7. Setup Taxi Mission
    this.setupTaxiPickupZone();

    // Initial weather
    this.setWeather('sunny');
  }

  public setQuality(q: GraphicQuality) {
    this.quality = q;
    if (q === 'low') {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
    } else if (q === 'medium') {
      this.renderer.setPixelRatio(1.2);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
  }

  public loadCar(carId: CarId, tuning: CarTuning) {
    if (this.car3D) {
      this.scene.remove(this.car3D.group);
    }
    this.currentCarId = carId;
    this.currentTuning = tuning;

    const spec = CAR_SPECS[carId];
    this.physics.setSpecAndTuning(spec, tuning);

    this.car3D = buildCar3D(carId, tuning);
    this.scene.add(this.car3D.group);
  }

  public setWeather(w: WeatherType) {
    this.weather = w;
    this.world.setWeather(w);
    // Turn on headlights automatically at night or in fog
    if (this.car3D) {
      const headlightsOn = w === 'night' || w === 'fog' || this.inputs.headlights;
      this.car3D.headlightLights.forEach((l) => (l.intensity = headlightsOn ? 2.2 : 0));
      this.car3D.headlightsMat.emissiveIntensity = headlightsOn ? 1.5 : 0.4;
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    soundManager.startEngine();
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animFrameId);
    soundManager.stopEngine();
  }

  public resetCar() {
    this.physics.reset(new THREE.Vector3(0, 0.35, 0), 0);
  }

  private loop = () => {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.loop);

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.isGarageMode) {
      this.updateGarage(dt);
    } else {
      this.updateSimulation(dt, now);
    }

    this.renderer.render(this.scene, this.camera);
  };

  private updateGarage(dt: number) {
    // Slow 360 degree turntable rotation in garage
    this.garageOrbitAngle += dt * 0.4;
    if (this.car3D) {
      this.car3D.group.position.set(0, 0, 0);
      this.car3D.group.rotation.set(0, 0, 0);
    }

    const radius = 6.2;
    const camX = Math.sin(this.garageOrbitAngle) * radius;
    const camZ = Math.cos(this.garageOrbitAngle) * radius;
    this.camera.position.set(camX, 2.1, camZ);
    this.camera.lookAt(0, 0.8, 0);
  }

  private updateSimulation(dt: number, nowMs: number) {
    // 1. Surface grip calculation
    let surfaceGrip = 1.0;
    if (this.weather === 'rain') surfaceGrip *= 0.82;
    // Off-road check: outside road boundaries
    const px = Math.abs(this.physics.position.x);
    const pz = Math.abs(this.physics.position.z);
    if (px > 12 && pz > 12 && !(this.physics.position.x > 70 && this.physics.position.z > 30)) {
      // Grass / dirt off-road
      surfaceGrip *= 0.7;
    }

    // 2. Physics step
    this.physics.update(dt, this.inputs, surfaceGrip);

    // 3. Collision against world obstacles
    this.checkWorldCollisions();

    // 4. Traffic step & collision
    const isRedLightNS = this.world.trafficLights[0]?.state === 'red';
    this.traffic.update(dt, this.physics.position, isRedLightNS);

    const trafficHit = this.traffic.checkPlayerCollision(this.physics.position);
    if (trafficHit.collided) {
      this.physics.handleCollision(trafficHit.normal, 0.5);
    }

    // 5. Radar speed trap check
    this.checkSpeedCameras(nowMs);

    // 6. Update Car 3D mesh position & wheel rotation
    this.syncCar3D(dt);

    // 7. Update Smoke Particles & Skidmarks
    this.syncParticlesAndSkids();

    // 8. Game modes update (Race checkpoints or Taxi)
    if (this.gameMode === 'race' && this.raceState.active) {
      this.updateRace();
    } else if (this.gameMode === 'simulator' && this.taxiState.active) {
      this.updateTaxi();
    }

    // 9. World lights cycle
    this.world.update(nowMs / 1000);

    // 10. Camera positioning
    this.updateCamera(dt);
  }

  private syncCar3D(dt: number) {
    if (!this.car3D) return;

    // Set position and orientation with pitch & roll
    this.car3D.group.position.copy(this.physics.position);
    this.car3D.group.rotation.set(0, this.physics.yaw, 0);
    this.car3D.group.rotateX(this.physics.pitchAngle);
    this.car3D.group.rotateZ(this.physics.rollAngle);

    // Rotate and steer wheels
    const wheelRotDelta = (this.physics.speedKmh / 3.6 / 0.34) * dt * (this.physics.velocity.z < 0 ? -1 : 1);

    // Front wheels steer & rotate
    this.car3D.wheels.fl.rotation.y = this.physics.steerAngle;
    this.car3D.wheels.fr.rotation.y = Math.PI + this.physics.steerAngle;
    this.car3D.wheels.fl.rotation.x += wheelRotDelta;
    this.car3D.wheels.fr.rotation.x -= wheelRotDelta;

    // Rear wheels only rotate
    this.car3D.wheels.rl.rotation.x += wheelRotDelta;
    this.car3D.wheels.rr.rotation.x -= wheelRotDelta;

    // Steering wheel interior rotation
    if (this.car3D.steeringWheel) {
      this.car3D.steeringWheel.rotation.z = -this.physics.steerAngle * 2.8;
    }

    // Brake lights active
    const isBraking = this.inputs.brake > 0 || this.inputs.handbrake;
    this.car3D.taillightsMat.emissiveIntensity = isBraking ? 1.6 : 0.4;
  }

  private syncParticlesAndSkids() {
    // Smoke
    for (let i = 0; i < this.smokeMeshPool.length; i++) {
      const mesh = this.smokeMeshPool[i];
      if (i < this.physics.smokeParticles.length) {
        const p = this.physics.smokeParticles[i];
        mesh.visible = true;
        mesh.position.copy(p.position);
        mesh.scale.setScalar(p.size);
        (mesh.material as THREE.MeshBasicMaterial).opacity = p.opacity;
      } else {
        mesh.visible = false;
      }
    }
  }

  private checkWorldCollisions() {
    const pos = this.physics.position;
    for (const obs of this.world.obstacles) {
      if (pos.x >= obs.minX && pos.x <= obs.maxX && pos.z >= obs.minZ && pos.z <= obs.maxZ) {
        // Collided with obstacle
        const centerX = (obs.minX + obs.maxX) / 2;
        const centerZ = (obs.minZ + obs.maxZ) / 2;
        const normal = new THREE.Vector3(pos.x - centerX, 0, pos.z - centerZ).normalize();
        this.physics.handleCollision(normal, 0.4);
        break;
      }
    }
  }

  private checkSpeedCameras(nowMs: number) {
    const pos = this.physics.position;
    for (const cam of this.world.speedCameras) {
      if (pos.distanceTo(cam.position) < 8.0) {
        if (nowMs - cam.lastTriggerTime > 12000) {
          if (this.physics.speedKmh > cam.speedLimitKmh + 5) {
            cam.lastTriggerTime = nowMs;
            soundManager.playRadarBeep();
            const fineSom = Math.round((this.physics.speedKmh - cam.speedLimitKmh) * 1500);
            if (this.onRadarFlash) {
              this.onRadarFlash(Math.round(this.physics.speedKmh), fineSom);
            }
          }
        }
      }
    }
  }

  private updateCamera(dt: number) {
    const carPos = this.physics.position;
    const yaw = this.physics.yaw;
    const forwardX = Math.sin(yaw);
    const forwardZ = Math.cos(yaw);

    if (this.cameraView === 'third_person') {
      // Third person follow camera
      const distance = 5.8;
      const height = 2.1;
      const targetPos = new THREE.Vector3(
        carPos.x - forwardX * distance,
        carPos.y + height,
        carPos.z - forwardZ * distance
      );
      this.camera.position.lerp(targetPos, Math.min(1.0, 9.0 * dt));
      this.camera.lookAt(carPos.x, carPos.y + 0.9, carPos.z);
    } else if (this.cameraView === 'close_chase') {
      const distance = 4.2;
      const height = 1.6;
      const targetPos = new THREE.Vector3(
        carPos.x - forwardX * distance,
        carPos.y + height,
        carPos.z - forwardZ * distance
      );
      this.camera.position.lerp(targetPos, Math.min(1.0, 12.0 * dt));
      this.camera.lookAt(carPos.x, carPos.y + 0.8, carPos.z);
    } else if (this.cameraView === 'hood') {
      // Hood camera
      this.camera.position.set(
        carPos.x + forwardX * 1.2,
        carPos.y + 0.9,
        carPos.z + forwardZ * 1.2
      );
      this.camera.lookAt(
        carPos.x + forwardX * 30,
        carPos.y + 0.8,
        carPos.z + forwardZ * 30
      );
    } else if (this.cameraView === 'cockpit') {
      // Cockpit / Salon camera inside driver's seat
      const rightX = Math.cos(yaw);
      const rightZ = -Math.sin(yaw);
      this.camera.position.set(
        carPos.x - rightX * 0.35 + forwardX * 0.1,
        carPos.y + 0.98,
        carPos.z - rightZ * 0.35 + forwardZ * 0.1
      );
      this.camera.lookAt(
        carPos.x - rightX * 0.35 + forwardX * 35,
        carPos.y + 0.9,
        carPos.z - rightZ * 0.35 + forwardZ * 35
      );
    }
  }

  // Checkpoints & Racing
  private buildRaceCheckpoints() {
    const ringGeo = new THREE.TorusGeometry(3.5, 0.25, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });

    this.raceState.checkpoints.forEach((cp) => {
      const mesh = new THREE.Mesh(ringGeo, ringMat);
      mesh.position.copy(cp);
      mesh.visible = false;
      this.scene.add(mesh);
      this.raceState.checkpointMeshes.push(mesh);
    });
  }

  public startRace() {
    this.gameMode = 'race';
    this.raceState.active = true;
    this.raceState.lap = 1;
    this.raceState.currentCheckpoint = 0;
    this.raceState.startTime = performance.now();
    this.raceState.isFinished = false;
    this.raceState.position = 1;

    // Reset car at start line
    this.physics.reset(new THREE.Vector3(0, 0.35, -10), 0);

    this.raceState.checkpointMeshes.forEach((m, idx) => {
      m.visible = idx === 0;
    });

    if (this.onRaceUpdate) {
      this.onRaceUpdate(this.raceState);
    }
  }

  private updateRace() {
    const cpIndex = this.raceState.currentCheckpoint;
    const targetCP = this.raceState.checkpoints[cpIndex];

    if (this.physics.position.distanceTo(targetCP) < 8.0) {
      // Checkpoint reached!
      soundManager.playMoneyChime();
      this.raceState.checkpointMeshes[cpIndex].visible = false;

      const nextCP = (cpIndex + 1) % this.raceState.checkpoints.length;
      this.raceState.currentCheckpoint = nextCP;
      this.raceState.checkpointMeshes[nextCP].visible = true;

      // Completed lap?
      if (nextCP === 0) {
        if (this.raceState.lap >= this.raceState.totalLaps) {
          // Finished!
          this.raceState.isFinished = true;
          this.raceState.active = false;
          soundManager.playMoneyChime();
        } else {
          this.raceState.lap++;
        }
      }

      if (this.onRaceUpdate) {
        this.onRaceUpdate(this.raceState);
      }
    }
  }

  // Taxi system
  private setupTaxiPickupZone() {
    const zoneGeo = new THREE.CylinderGeometry(4.5, 4.5, 0.15, 24);
    const zoneMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.6 });
    const zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
    zoneMesh.position.set(45, 0.1, -50);
    this.scene.add(zoneMesh);
    this.taxiState.pickupZoneMesh = zoneMesh;
  }

  public startTaxiMission() {
    this.gameMode = 'simulator';
    this.taxiState.active = true;
    this.taxiState.hasPickedUp = false;
    this.taxiState.destinationName = 'Chorsu Choyxona';
    this.taxiState.destinationPos = new THREE.Vector3(45, 0, 40);
    this.taxiState.rewardSom = 25000;
    if (this.taxiState.pickupZoneMesh) {
      this.taxiState.pickupZoneMesh.visible = true;
      this.taxiState.pickupZoneMesh.position.set(45, 0.1, -50);
    }
    if (this.onTaxiUpdate) {
      this.onTaxiUpdate(this.taxiState);
    }
  }

  private updateTaxi() {
    if (!this.taxiState.hasPickedUp) {
      if (this.physics.position.distanceTo(new THREE.Vector3(45, 0, -50)) < 6.0 && this.physics.speedKmh < 10) {
        // Picked up passenger!
        this.taxiState.hasPickedUp = true;
        soundManager.playMoneyChime();
        if (this.taxiState.pickupZoneMesh) {
          this.taxiState.pickupZoneMesh.position.copy(this.taxiState.destinationPos);
        }
        if (this.onTaxiUpdate) {
          this.onTaxiUpdate(this.taxiState);
        }
      }
    } else {
      if (this.physics.position.distanceTo(this.taxiState.destinationPos) < 6.0 && this.physics.speedKmh < 10) {
        // Arrived at destination!
        soundManager.playMoneyChime();
        this.taxiState.active = false;
        if (this.taxiState.pickupZoneMesh) {
          this.taxiState.pickupZoneMesh.visible = false;
        }
        if (this.onTaxiUpdate) {
          this.onTaxiUpdate(this.taxiState);
        }
      }
    }
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public destroy() {
    this.stop();
    this.renderer.dispose();
  }
}
