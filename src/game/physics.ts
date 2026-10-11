import * as THREE from 'three';
import { CarSpec, CarTuning, TireType } from '../types/game';
import { soundManager } from '../audio/soundManager';

export interface VehicleInputs {
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  steer: number; // -1 (left) to 1 (right)
  handbrake: boolean;
  reset: boolean;
  horn: boolean;
  headlights: boolean;
}

export interface DriftScoreState {
  currentScore: number;
  comboMultiplier: number;
  isDrifting: boolean;
  driftAngleDegrees: number;
  bankedScore: number;
  lastAwardText: string;
}

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
}

export class CarPhysics {
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public yaw: number = 0; // heading in radians
  public yawVelocity: number = 0;
  public speedKmh: number = 0;
  public steerAngle: number = 0;
  public rollAngle: number = 0;
  public pitchAngle: number = 0;

  // Transmission & Engine
  public rpm: number = 900;
  public currentGear: number = 1; // -1 for reverse, 1..6
  private maxRpm: number = 7200;
  private minRpm: number = 900;

  // Drift status
  public driftState: DriftScoreState = {
    currentScore: 0,
    comboMultiplier: 1,
    isDrifting: false,
    driftAngleDegrees: 0,
    bankedScore: 0,
    lastAwardText: '',
  };

  // Smoke particles
  public smokeParticles: Particle[] = [];
  public skidMarks: { p1: THREE.Vector3; p2: THREE.Vector3; alpha: number }[] = [];
  private lastLeftWheelPos: THREE.Vector3 | null = null;
  private lastRightWheelPos: THREE.Vector3 | null = null;

  // Spec references
  private spec: CarSpec;
  private tuning: CarTuning;

  constructor(spec: CarSpec, tuning: CarTuning) {
    this.spec = spec;
    this.tuning = tuning;
  }

  public setSpecAndTuning(spec: CarSpec, tuning: CarTuning) {
    this.spec = spec;
    this.tuning = tuning;
  }

  public reset(pos: THREE.Vector3 = new THREE.Vector3(0, 0.35, 0), yawAngle: number = 0) {
    this.position.copy(pos);
    this.velocity.set(0, 0, 0);
    this.yaw = yawAngle;
    this.yawVelocity = 0;
    this.speedKmh = 0;
    this.steerAngle = 0;
    this.rollAngle = 0;
    this.pitchAngle = 0;
    this.rpm = 900;
    this.currentGear = 1;
    this.driftState.currentScore = 0;
    this.driftState.isDrifting = false;
  }

  public update(dt: number, inputs: VehicleInputs, surfaceGrip: number = 1.0) {
    // Clamp delta
    const delta = Math.min(dt, 0.05);

    // Calculate tuning multipliers
    const engineMult = 1.0 + (this.tuning.engineStage - 1) * 0.22 + (this.tuning.hasTurbo ? 0.35 : 0);
    const brakeMult = 1.0 + (this.tuning.brakeStage - 1) * 0.25;
    const tireGripMult =
      this.tuning.tireType === 'sport'
        ? 1.35
        : this.tuning.tireType === 'drift'
        ? 0.75
        : this.tuning.tireType === 'offroad'
        ? 1.15
        : 1.0;
    const driftBonus = this.tuning.driftSetup ? 1.4 : 1.0;

    // Steering smoothing
    const targetSteer = -inputs.steer * 0.58; // max steering ~33 deg
    const steerSpeed = 8.5;
    this.steerAngle += (targetSteer - this.steerAngle) * Math.min(1.0, steerSpeed * delta);

    // Forward direction unit vector
    const forwardX = Math.sin(this.yaw);
    const forwardZ = Math.cos(this.yaw);
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);

    // Current local velocity
    const speedForward = this.velocity.x * forwardX + this.velocity.z * forwardZ;
    const speedLateral = this.velocity.x * rightX + this.velocity.z * rightZ;
    this.speedKmh = Math.abs(speedForward) * 3.6;

    // Engine acceleration force
    let driveForce = 0;
    const maxSpeedMs = (this.spec.topSpeedKmh * engineMult) / 3.6;

    if (inputs.throttle > 0) {
      if (speedForward >= -1.0) {
        // Forward drive
        const powerDropoff = Math.max(0, 1.0 - Math.abs(speedForward) / maxSpeedMs);
        driveForce = inputs.throttle * this.spec.acceleration * 1.85 * engineMult * powerDropoff;
      } else {
        // Braking while moving backwards
        driveForce = inputs.throttle * this.spec.braking * 3.0 * brakeMult;
      }
    } else if (inputs.brake > 0) {
      if (speedForward > 1.2) {
        // Normal braking
        driveForce = -inputs.brake * this.spec.braking * 3.2 * brakeMult;
      } else {
        // Reverse drive
        driveForce = -inputs.brake * this.spec.acceleration * 0.95;
      }
    }

    // Rolling resistance & aerodynamic drag
    const aeroDrag = 0.0022 * speedForward * Math.abs(speedForward);
    const rollingResistance = 0.85 * Math.sign(speedForward);

    // Lateral grip and drift calculation
    let maxLateralGrip = 9.5 * tireGripMult * surfaceGrip;
    if (inputs.handbrake) {
      maxLateralGrip *= 0.28; // Handbrake breaks traction immediately
    }
    if (this.tuning.driftSetup) {
      maxLateralGrip *= 0.85;
    }

    // Drift detection: slip angle between velocity vector and heading
    let slipAngle = 0;
    const totalSpeed = this.velocity.length();
    if (totalSpeed > 3.0) {
      slipAngle = Math.atan2(Math.abs(speedLateral), Math.abs(speedForward));
    }
    const slipAngleDeg = (slipAngle * 180) / Math.PI;
    this.driftState.driftAngleDegrees = slipAngleDeg;

    const isDriftingNow = (slipAngleDeg > 12 || inputs.handbrake) && totalSpeed > 4.5;
    this.driftState.isDrifting = isDriftingNow;

    // Lateral friction opposes sideways slide
    let lateralFriction = -speedLateral * 14.0;
    if (isDriftingNow) {
      // Slip threshold exceeded -> sliding drift physics
      lateralFriction = -Math.sign(speedLateral) * maxLateralGrip * (inputs.handbrake ? 0.4 : 0.85);
      // Generate tire smoke
      this.emitTireSmoke(totalSpeed, delta);
    } else {
      lateralFriction = Math.max(-maxLateralGrip * 8, Math.min(maxLateralGrip * 8, lateralFriction));
    }

    // Update Drift Score
    if (isDriftingNow) {
      const points = Math.round(slipAngleDeg * totalSpeed * 0.25 * driftBonus * delta * 60);
      this.driftState.currentScore += points;

      if (this.driftState.currentScore > 1000) {
        this.driftState.comboMultiplier = 4;
        this.driftState.lastAwardText = 'AFSONAVIY DRIFT! x4';
      } else if (this.driftState.currentScore > 500) {
        this.driftState.comboMultiplier = 3;
        this.driftState.lastAwardText = 'A‘LO DRIFT! x3';
      } else if (this.driftState.currentScore > 250) {
        this.driftState.comboMultiplier = 2;
        this.driftState.lastAwardText = 'ZO‘R DRIFT! x2';
      } else {
        this.driftState.comboMultiplier = 1;
        this.driftState.lastAwardText = '+100 DRIFT';
      }
    } else {
      if (this.driftState.currentScore > 0) {
        // Bank score
        this.driftState.bankedScore += Math.round(this.driftState.currentScore * this.driftState.comboMultiplier);
        this.driftState.currentScore = 0;
        this.driftState.comboMultiplier = 1;
      }
    }

    // Sound feedback for drift
    soundManager.updateDrift(isDriftingNow ? Math.min(1.0, (slipAngleDeg / 40) * (totalSpeed / 20)) : 0);

    // Angular yaw velocity (turning)
    let turnResponsiveness = (this.spec.handling / 7.0) * 1.8;
    if (isDriftingNow) {
      turnResponsiveness *= 1.35 * driftBonus; // Easier to pivot during drift
    }
    const targetYawVel = this.steerAngle * speedForward * 0.08 * turnResponsiveness;
    this.yawVelocity += (targetYawVel - this.yawVelocity) * Math.min(1.0, 10.0 * delta);

    if (inputs.handbrake && totalSpeed > 2.0) {
      // Oversteer snap
      this.yawVelocity += -Math.sign(this.steerAngle || 1) * 0.8 * delta;
    }

    this.yaw += this.yawVelocity * delta;

    // Apply forces into world acceleration
    const netForwardAcc = driveForce - aeroDrag - (Math.abs(speedForward) > 0.1 ? rollingResistance : 0);
    const accX = forwardX * netForwardAcc + rightX * lateralFriction;
    const accZ = forwardZ * netForwardAcc + rightZ * lateralFriction;

    this.velocity.x += accX * delta;
    this.velocity.z += accZ * delta;

    // Ground position update
    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;

    // Dynamic body pitch (squat on accel, dive on brake) & roll in turns
    const targetPitch = Math.max(-0.06, Math.min(0.06, -netForwardAcc * 0.003));
    this.pitchAngle += (targetPitch - this.pitchAngle) * Math.min(1.0, 10 * delta);

    const targetRoll = Math.max(-0.08, Math.min(0.08, this.yawVelocity * speedForward * 0.008));
    this.rollAngle += (targetRoll - this.rollAngle) * Math.min(1.0, 10 * delta);

    // Calculate RPM and Gear simulation
    this.updateGears(speedForward, inputs.throttle > 0);

    // Sound engine update
    const rpmRatio = (this.rpm - this.minRpm) / (this.maxRpm - this.minRpm);
    soundManager.updateEngine(rpmRatio, inputs.throttle > 0, this.speedKmh);

    // Update particles (smoke)
    this.updateParticles(delta);

    // Update skid marks
    if (isDriftingNow || (inputs.handbrake && totalSpeed > 3.0)) {
      this.recordSkidMark();
    } else {
      this.lastLeftWheelPos = null;
      this.lastRightWheelPos = null;
    }
  }

  private updateGears(speedForward: number, isThrottle: boolean) {
    if (speedForward < -0.5) {
      this.currentGear = -1; // Reverse
      this.rpm = Math.min(this.maxRpm, this.minRpm + Math.abs(speedForward) * 450);
      return;
    }

    // Gear ratios (km/h per gear)
    const gearLimits = [35, 65, 105, 150, 195, 260];
    let gear = 1;
    for (let i = 0; i < gearLimits.length; i++) {
      if (this.speedKmh > gearLimits[i]) {
        gear = i + 2;
      } else {
        gear = i + 1;
        break;
      }
    }
    gear = Math.min(6, gear);

    if (gear !== this.currentGear) {
      // Gear shift turbo release!
      if (this.tuning.hasTurbo && gear > this.currentGear) {
        soundManager.playTurbo();
      }
      this.currentGear = gear;
    }

    const prevLimit = gear === 1 ? 0 : gearLimits[gear - 2];
    const nextLimit = gearLimits[gear - 1];
    const progressInGear = Math.max(0, Math.min(1.0, (this.speedKmh - prevLimit) / (nextLimit - prevLimit)));

    if (isThrottle) {
      this.rpm = 2200 + progressInGear * (this.maxRpm - 2400);
    } else {
      this.rpm = Math.max(this.minRpm, this.minRpm + progressInGear * 2800);
    }
  }

  private emitTireSmoke(speed: number, dt: number) {
    if (this.smokeParticles.length > 80) return;
    const forwardX = Math.sin(this.yaw);
    const forwardZ = Math.cos(this.yaw);
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);

    // Left and right rear tire ground positions
    const rearZ = -1.35;
    const wheelWidth = 0.82;

    const leftPos = new THREE.Vector3(
      this.position.x - rightX * wheelWidth + forwardX * rearZ,
      0.15,
      this.position.z - rightZ * wheelWidth + forwardZ * rearZ
    );
    const rightPos = new THREE.Vector3(
      this.position.x + rightX * wheelWidth + forwardX * rearZ,
      0.15,
      this.position.z + rightZ * wheelWidth + forwardZ * rearZ
    );

    [leftPos, rightPos].forEach((pos) => {
      this.smokeParticles.push({
        position: pos.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.8 - forwardX * 1.5,
          Math.random() * 0.9 + 0.4,
          (Math.random() - 0.5) * 0.8 - forwardZ * 1.5
        ),
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
        size: 0.45 + Math.random() * 0.4,
        opacity: 0.6,
      });
    });
  }

  private recordSkidMark() {
    const forwardX = Math.sin(this.yaw);
    const forwardZ = Math.cos(this.yaw);
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);
    const rearZ = -1.35;
    const wheelWidth = 0.82;

    const currentLeft = new THREE.Vector3(
      this.position.x - rightX * wheelWidth + forwardX * rearZ,
      0.03,
      this.position.z - rightZ * wheelWidth + forwardZ * rearZ
    );
    const currentRight = new THREE.Vector3(
      this.position.x + rightX * wheelWidth + forwardX * rearZ,
      0.03,
      this.position.z + rightZ * wheelWidth + forwardZ * rearZ
    );

    if (this.lastLeftWheelPos && this.lastRightWheelPos) {
      if (this.skidMarks.length > 250) {
        this.skidMarks.shift();
      }
      this.skidMarks.push({
        p1: this.lastLeftWheelPos.clone(),
        p2: currentLeft.clone(),
        alpha: 0.7,
      });
      this.skidMarks.push({
        p1: this.lastRightWheelPos.clone(),
        p2: currentRight.clone(),
        alpha: 0.7,
      });
    }

    this.lastLeftWheelPos = currentLeft;
    this.lastRightWheelPos = currentRight;
  }

  private updateParticles(dt: number) {
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.smokeParticles.splice(i, 1);
        continue;
      }
      p.position.addScaledVector(p.velocity, dt);
      p.size += dt * 0.9;
      p.opacity = (1 - p.life / p.maxLife) * 0.55;
    }
  }

  public handleCollision(normal: THREE.Vector3, bounceFactor: number = 0.4) {
    const dot = this.velocity.dot(normal);
    if (dot < 0) {
      const impactSpeed = Math.abs(dot) * 3.6;
      if (impactSpeed > 10) {
        soundManager.playCrash(impactSpeed);
      }
      // Reflect velocity with bounce damping
      this.velocity.sub(normal.clone().multiplyScalar((1 + bounceFactor) * dot));
      // Dampen speed
      this.velocity.multiplyScalar(0.7);
    }
  }
}
