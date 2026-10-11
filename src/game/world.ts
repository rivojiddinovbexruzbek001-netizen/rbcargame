import * as THREE from 'three';
import { WeatherType } from '../types/game';

export interface WorldObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface SpeedCamera {
  position: THREE.Vector3;
  speedLimitKmh: number;
  lastTriggerTime: number;
}

export interface TrafficLight {
  meshGroup: THREE.Group;
  redMat: THREE.MeshBasicMaterial;
  yellowMat: THREE.MeshBasicMaterial;
  greenMat: THREE.MeshBasicMaterial;
  state: 'red' | 'yellow' | 'green';
}

export class UzbekWorld {
  public scene: THREE.Scene;
  public obstacles: WorldObstacle[] = [];
  public speedCameras: SpeedCamera[] = [];
  public trafficLights: TrafficLight[] = [];
  public streetLights: THREE.Light[] = [];

  // Sky & lighting
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Ambient Hemisphere light
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.8);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // Sun / directional light with real-time shadows
    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 1.3);
    this.dirLight.position.set(60, 90, 40);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 250;
    this.dirLight.shadow.camera.left = -90;
    this.dirLight.shadow.camera.right = 90;
    this.dirLight.shadow.camera.top = 90;
    this.dirLight.shadow.camera.bottom = -90;
    this.scene.add(this.dirLight);

    this.buildMap();
  }

  // Create canvas textures for roads, signs, and Uzbek buildings
  private createRoadTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dark asphalt
    ctx.fillStyle = '#27272a';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle grain
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    // Road dashed white center stripes
    ctx.fillStyle = '#f8fafc';
    for (let y = 20; y < 512; y += 80) {
      ctx.fillRect(250, y, 12, 45);
    }

    // Solid white edge lines
    ctx.fillRect(24, 0, 8, 512);
    ctx.fillRect(480, 0, 8, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private createHighwaySignTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Uzbek highway green background
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, 512, 256);

    // White border
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(8, 8, 496, 240);

    // Sign text in Uzbek
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px "Chakra Petch", sans-serif';
    ctx.fillText('M39 TOSHKENT  ⬆', 40, 75);

    ctx.font = 'bold 36px "Chakra Petch", sans-serif';
    ctx.fillText('SAMARQAND  280 km', 40, 140);
    ctx.fillText('BUXORO     540 km', 40, 205);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  private createGasStationTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Yellow and green UNG petrol
    ctx.fillStyle = '#047857';
    ctx.fillRect(0, 0, 512, 128);

    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 96, 512, 32);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('UNG PETROL', 35, 70);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('AI-92  AI-95  METAN', 320, 68);

    return new THREE.CanvasTexture(canvas);
  }

  private createChoyxonaSign(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 244, 116);
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('CHORSUR', 55, 50);
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('CHOYXONA & OSH', 25, 90);
    return new THREE.CanvasTexture(canvas);
  }

  private buildMap() {
    const roadTexture = this.createRoadTexture();

    // 1. Terrain Ground (Base soil and green grass)
    const groundGeo = new THREE.PlaneGeometry(800, 800);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x3f3f46,
      roughness: 0.95,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Main Central Boulevard (Toshkent City Avenue)
    // 24m wide, 500m long asphalt highway running north-south
    const mainRoadGeo = new THREE.PlaneGeometry(24, 600);
    mainRoadGeo.rotateX(-Math.PI / 2);
    const mainRoadTex = roadTexture.clone();
    mainRoadTex.repeat.set(1, 25);
    mainRoadTex.needsUpdate = true;
    const roadMat = new THREE.MeshStandardMaterial({
      map: mainRoadTex,
      roughness: 0.65,
      metalness: 0.1,
    });
    const mainRoad = new THREE.Mesh(mainRoadGeo, roadMat);
    mainRoad.position.set(0, 0, 0);
    mainRoad.receiveShadow = true;
    this.scene.add(mainRoad);

    // 3. Cross Avenue (East-West Boulevard)
    const crossRoadGeo = new THREE.PlaneGeometry(500, 24);
    crossRoadGeo.rotateX(-Math.PI / 2);
    const crossRoadTex = roadTexture.clone();
    crossRoadTex.repeat.set(20, 1);
    crossRoadTex.needsUpdate = true;
    const crossRoad = new THREE.Mesh(crossRoadGeo, new THREE.MeshStandardMaterial({
      map: crossRoadTex,
      roughness: 0.65,
      metalness: 0.1,
    }));
    crossRoad.position.set(0, 0.01, 0);
    crossRoad.receiveShadow = true;
    this.scene.add(crossRoad);

    // 4. Drift Oval & Arena (East side of map)
    const driftRingGeo = new THREE.RingGeometry(35, 75, 48);
    driftRingGeo.rotateX(-Math.PI / 2);
    const driftMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.8,
      metalness: 0.1,
    });
    const driftRing = new THREE.Mesh(driftRingGeo, driftMat);
    driftRing.position.set(140, 0.02, 100);
    driftRing.receiveShadow = true;
    this.scene.add(driftRing);

    // Drift center monument / flag pole (O'zbekiston bayrog'i)
    this.buildUzbekFlagPole(140, 100);

    // 5. Curbs / Sidewalks (Trotoarlar)
    this.buildSidewalks();

    // 6. Toshkent City Skyscrapers (Modern glass & steel architecture)
    this.buildSkyscrapers();

    // 7. Mahalla & Chorsu District (Old city, brick walls, choyxona)
    this.buildMahallaDistrict();

    // 8. UNG Zapravka (Petrol Station)
    this.buildGasStation(45, -70);

    // 9. Highway Gantry & Overhead Signs
    this.buildHighwayGantry(0, 120);
    this.buildHighwayGantry(0, -140);

    // 10. Speed Cameras (Radarlar!)
    this.buildRadarPost(new THREE.Vector3(13, 0, 60), 70);
    this.buildRadarPost(new THREE.Vector3(-13, 0, -80), 70);

    // 11. Traffic Lights (Svetoforlar)
    this.buildTrafficLight(13, 14, 0);
    this.buildTrafficLight(-13, -14, Math.PI);
    this.buildTrafficLight(-14, 13, -Math.PI / 2);
    this.buildTrafficLight(14, -13, Math.PI / 2);

    // 12. Street Lights (Chiroq ustunlari) & Trees (Chinor, Terak)
    this.buildStreetDecorations();
  }

  private buildUzbekFlagPole(x: number, z: number) {
    const poleGeo = new THREE.CylinderGeometry(0.18, 0.25, 24, 16);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(x, 12, z);
    pole.castShadow = true;
    this.scene.add(pole);

    // Uzbek Flag canvas
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 120;
    const ctx = canvas.getContext('2d')!;
    // Sky blue stripe
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(0, 0, 240, 38);
    // Red thin line
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, 38, 240, 3);
    // White stripe
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 41, 240, 38);
    // Red thin line
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, 79, 240, 3);
    // Green stripe
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, 82, 240, 38);
    // Crescent & stars
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(40, 19, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.arc(43, 19, 9, 0, Math.PI * 2);
    ctx.fill();

    const flagTex = new THREE.CanvasTexture(canvas);
    const flagGeo = new THREE.PlaneGeometry(6, 3);
    const flagMat = new THREE.MeshStandardMaterial({
      map: flagTex,
      side: THREE.DoubleSide,
      roughness: 0.6,
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(x + 3, 21.5, z);
    this.scene.add(flag);

    // Register obstacle for flagpole
    this.obstacles.push({ minX: x - 1.5, maxX: x + 1.5, minZ: z - 1.5, maxZ: z + 1.5 });
  }

  private buildSidewalks() {
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x71717a, roughness: 0.8 });

    // Main road left & right curbs
    const curbGeoL = new THREE.BoxGeometry(3, 0.35, 580);
    const curbL = new THREE.Mesh(curbGeoL, curbMat);
    curbL.position.set(-13.5, 0.17, 0);
    curbL.receiveShadow = true;
    this.scene.add(curbL);

    const curbR = new THREE.Mesh(curbGeoL, curbMat);
    curbR.position.set(13.5, 0.17, 0);
    curbR.receiveShadow = true;
    this.scene.add(curbR);
  }

  private buildSkyscrapers() {
    // Modern glass towers like Nest One and Tashkent City
    const towers = [
      { x: -45, z: 45, w: 22, d: 22, h: 85, color: 0x38bdf8 },
      { x: -45, z: 95, w: 28, d: 24, h: 120, color: 0x0284c7 },
      { x: -50, z: -55, w: 26, d: 26, h: 70, color: 0x64748b },
      { x: -45, z: -115, w: 32, d: 24, h: 95, color: 0x0f172a },
      { x: -85, z: 20, w: 35, d: 35, h: 60, color: 0x475569 },
    ];

    towers.forEach((t) => {
      const geo = new THREE.BoxGeometry(t.w, t.h, t.d);
      const mat = new THREE.MeshStandardMaterial({
        color: t.color,
        metalness: 0.8,
        roughness: 0.2,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(t.x, t.h / 2, t.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      // Window grid strips
      const windowGeo = new THREE.BoxGeometry(t.w + 0.1, t.h * 0.9, t.d + 0.1);
      const winMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.15,
        wireframe: true,
      });
      const winMesh = new THREE.Mesh(windowGeo, winMat);
      winMesh.position.set(t.x, t.h / 2, t.z);
      this.scene.add(winMesh);

      // Obstacle collision boundary
      this.obstacles.push({
        minX: t.x - t.w / 2 - 1,
        maxX: t.x + t.w / 2 + 1,
        minZ: t.z - t.d / 2 - 1,
        maxZ: t.z + t.d / 2 + 1,
      });
    });
  }

  private buildMahallaDistrict() {
    // Authentic Uzbek traditional 1-2 floor houses with brick fences
    const brickMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });

    const houses = [
      { x: 45, z: 45, w: 18, d: 14, h: 7 },
      { x: 75, z: 45, w: 16, d: 14, h: 6.5 },
      { x: 45, z: -45, w: 20, d: 16, h: 7.5 },
      { x: 75, z: -45, w: 15, d: 15, h: 6 },
    ];

    houses.forEach((h) => {
      // Main wall
      const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(h.w, h.h, h.d), wallMat);
      wallMesh.position.set(h.x, h.h / 2, h.z);
      wallMesh.castShadow = true;
      this.scene.add(wallMesh);

      // Pitched roof
      const roofGeo = new THREE.ConeGeometry(Math.max(h.w, h.d) * 0.75, 4.5, 4);
      roofGeo.rotateY(Math.PI / 4);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(h.x, h.h + 2.2, h.z);
      roof.castShadow = true;
      this.scene.add(roof);

      // Traditional Uzbek brick fence around the yard
      const fenceL = new THREE.Mesh(new THREE.BoxGeometry(h.w + 6, 2.4, 0.6), brickMat);
      fenceL.position.set(h.x, 1.2, h.z - h.d / 2 - 3);
      this.scene.add(fenceL);

      this.obstacles.push({
        minX: h.x - h.w / 2 - 2,
        maxX: h.x + h.w / 2 + 2,
        minZ: h.z - h.d / 2 - 4,
        maxZ: h.z + h.d / 2 + 2,
      });
    });

    // Choyxona with billboard sign
    const choyxonaSign = this.createChoyxonaSign();
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshBasicMaterial({ map: choyxonaSign }));
    signMesh.position.set(45, 9, 36);
    this.scene.add(signMesh);
  }

  private buildGasStation(x: number, z: number) {
    const tex = this.createGasStationTexture();

    // Canopy roof
    const canopyGeo = new THREE.BoxGeometry(26, 1.2, 18);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x047857, metalness: 0.3, roughness: 0.4 });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(x, 6.2, z);
    canopy.castShadow = true;
    this.scene.add(canopy);

    // Banner wrap around canopy
    const bannerGeo = new THREE.PlaneGeometry(26, 1.2);
    const bannerMat = new THREE.MeshBasicMaterial({ map: tex });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(x, 6.2, z + 9.05);
    this.scene.add(banner);

    // 4 Support Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.5, 0.5, 6, 16);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xfacc15 });
    [-8, 8].forEach((px) => {
      [-5, 5].forEach((pz) => {
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(x + px, 3, z + pz);
        pillar.castShadow = true;
        this.scene.add(pillar);
      });
    });

    // Fuel Dispensers (Kolonkalar)
    const pumpGeo = new THREE.BoxGeometry(1.2, 2.2, 2.8);
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0x047857 });
    [-5, 5].forEach((px) => {
      const pump = new THREE.Mesh(pumpGeo, pumpMat);
      pump.position.set(x + px, 1.1, z);
      this.scene.add(pump);
      this.obstacles.push({
        minX: x + px - 1,
        maxX: x + px + 1,
        minZ: z - 1.8,
        maxZ: z + 1.8,
      });
    });

    // Gas station store building behind
    const store = new THREE.Mesh(new THREE.BoxGeometry(24, 5, 12), new THREE.MeshStandardMaterial({ color: 0xf1f5f9 }));
    store.position.set(x, 2.5, z - 18);
    store.castShadow = true;
    this.scene.add(store);

    this.obstacles.push({
      minX: x - 13,
      maxX: x + 13,
      minZ: z - 25,
      maxZ: z - 12,
    });
  }

  private buildHighwayGantry(x: number, z: number) {
    const signTex = this.createHighwaySignTexture();
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });

    // Vertical metal columns on both sides of road
    const colGeo = new THREE.CylinderGeometry(0.35, 0.35, 9, 12);
    const colL = new THREE.Mesh(colGeo, gantryMat);
    colL.position.set(x - 14, 4.5, z);
    this.scene.add(colL);

    const colR = new THREE.Mesh(colGeo, gantryMat);
    colR.position.set(x + 14, 4.5, z);
    this.scene.add(colR);

    // Overhead truss beam
    const beamGeo = new THREE.BoxGeometry(28.5, 0.8, 0.8);
    const beam = new THREE.Mesh(beamGeo, gantryMat);
    beam.position.set(x, 8.5, z);
    this.scene.add(beam);

    // Large Green highway sign
    const signGeo = new THREE.PlaneGeometry(12, 4.2);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(x, 8.4, z - 0.45);
    this.scene.add(sign);

    this.obstacles.push({ minX: x - 15, maxX: x - 13, minZ: z - 1, maxZ: z + 1 });
    this.obstacles.push({ minX: x + 13, maxX: x + 15, minZ: z - 1, maxZ: z + 1 });
  }

  private buildRadarPost(pos: THREE.Vector3, speedLimitKmh: number) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 6.5, 12),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
    );
    pole.position.set(pos.x, 3.25, pos.z);
    this.scene.add(pole);

    // Radar camera box
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.6, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
    );
    box.position.set(pos.x, 6.2, pos.z);
    this.scene.add(box);

    // Flash lens
    const lens = new THREE.Mesh(
      new THREE.CircleGeometry(0.18, 16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    lens.position.set(pos.x, 6.2, pos.z - 0.52);
    this.scene.add(lens);

    this.speedCameras.push({
      position: pos,
      speedLimitKmh,
      lastTriggerTime: 0,
    });
  }

  private buildTrafficLight(x: number, z: number, rotationY: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotationY;

    // Pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 5.5, 12),
      new THREE.MeshStandardMaterial({ color: 0x334155 })
    );
    pole.position.y = 2.75;
    group.add(pole);

    // Light box
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1.6, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x18181b })
    );
    box.position.set(0, 4.6, 0);
    group.add(box);

    const redMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0x444400 });
    const greenMat = new THREE.MeshBasicMaterial({ color: 0x004400 });

    const lightGeo = new THREE.CircleGeometry(0.18, 16);

    const redMesh = new THREE.Mesh(lightGeo, redMat);
    redMesh.position.set(0, 5.1, 0.23);
    group.add(redMesh);

    const yelMesh = new THREE.Mesh(lightGeo, yellowMat);
    yelMesh.position.set(0, 4.6, 0.23);
    group.add(yelMesh);

    const grnMesh = new THREE.Mesh(lightGeo, greenMat);
    grnMesh.position.set(0, 4.1, 0.23);
    group.add(grnMesh);

    this.scene.add(group);

    this.trafficLights.push({
      meshGroup: group,
      redMat,
      yellowMat,
      greenMat,
      state: 'green',
    });
  }

  private buildStreetDecorations() {
    // Poplar trees (Teraklar) & street light posts along the avenue
    for (let z = -240; z <= 240; z += 40) {
      if (Math.abs(z) < 25) continue; // Skip intersection

      // Left and right trees
      [-17, 17].forEach((x) => {
        // Trunk
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.35, 3.5, 8),
          new THREE.MeshStandardMaterial({ color: 0x78350f })
        );
        trunk.position.set(x, 1.75, z);
        trunk.castShadow = true;
        this.scene.add(trunk);

        // Tall green foliage (Terak)
        const foliage = new THREE.Mesh(
          new THREE.ConeGeometry(1.6, 7.5, 8),
          new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 })
        );
        foliage.position.set(x, 6.5, z);
        foliage.castShadow = true;
        this.scene.add(foliage);

        this.obstacles.push({ minX: x - 1, maxX: x + 1, minZ: z - 1, maxZ: z + 1 });
      });

      // Street lights every 80m
      if (z % 80 === 0) {
        [-15, 15].forEach((x) => {
          const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.16, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0x64748b })
          );
          pole.position.set(x, 4, z);
          this.scene.add(pole);

          // Arm reaching over road
          const arm = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.12, 0.12),
            new THREE.MeshStandardMaterial({ color: 0x64748b })
          );
          arm.position.set(x > 0 ? x - 1.5 : x + 1.5, 7.8, z);
          this.scene.add(arm);

          // Lamp bulb
          const lampLight = new THREE.PointLight(0xfef08a, 0.8, 25);
          lampLight.position.set(x > 0 ? x - 2.8 : x + 2.8, 7.5, z);
          this.scene.add(lampLight);
          this.streetLights.push(lampLight);
        });
      }
    }
  }

  public update(timeSeconds: number) {
    // Cycle traffic lights every 12 seconds: Green (6s) -> Yellow (2s) -> Red (4s)
    const cycle = timeSeconds % 12;
    this.trafficLights.forEach((tl, idx) => {
      // Opposite lanes offset
      const laneOffset = idx % 2 === 0 ? 0 : 6;
      const t = (cycle + laneOffset) % 12;

      if (t < 6) {
        tl.state = 'green';
        tl.greenMat.color.setHex(0x22c55e);
        tl.yellowMat.color.setHex(0x333300);
        tl.redMat.color.setHex(0x330000);
      } else if (t < 8) {
        tl.state = 'yellow';
        tl.greenMat.color.setHex(0x003300);
        tl.yellowMat.color.setHex(0xfacc15);
        tl.redMat.color.setHex(0x330000);
      } else {
        tl.state = 'red';
        tl.greenMat.color.setHex(0x003300);
        tl.yellowMat.color.setHex(0x333300);
        tl.redMat.color.setHex(0xef4444);
      }
    });
  }

  public setWeather(weather: WeatherType) {
    if (weather === 'night') {
      this.scene.background = new THREE.Color(0x050508);
      this.scene.fog = new THREE.FogExp2(0x09090c, 0.008);
      this.dirLight.intensity = 0.15;
      this.dirLight.color.setHex(0x38bdf8);
      this.hemiLight.intensity = 0.2;
      this.streetLights.forEach((l) => (l.intensity = 1.4));
    } else if (weather === 'fog') {
      this.scene.background = new THREE.Color(0x94a3b8);
      this.scene.fog = new THREE.FogExp2(0x94a3b8, 0.025);
      this.dirLight.intensity = 0.6;
      this.hemiLight.intensity = 0.6;
      this.streetLights.forEach((l) => (l.intensity = 0.7));
    } else if (weather === 'rain') {
      this.scene.background = new THREE.Color(0x334155);
      this.scene.fog = new THREE.FogExp2(0x334155, 0.012);
      this.dirLight.intensity = 0.7;
      this.dirLight.color.setHex(0x93c5fd);
      this.hemiLight.intensity = 0.5;
      this.streetLights.forEach((l) => (l.intensity = 1.0));
    } else {
      // Sunny
      this.scene.background = new THREE.Color(0x7dd3fc);
      this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.004);
      this.dirLight.intensity = 1.4;
      this.dirLight.color.setHex(0xfff7ed);
      this.hemiLight.intensity = 0.85;
      this.streetLights.forEach((l) => (l.intensity = 0));
    }
  }
}
