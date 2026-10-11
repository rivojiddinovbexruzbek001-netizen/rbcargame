import * as THREE from 'three';
import { CarId, CarTuning, RimStyle, SpoilerStyle } from '../types/game';

export interface Car3DObject {
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  windowsMesh: THREE.Mesh;
  wheels: {
    fl: THREE.Group; // Front Left
    fr: THREE.Group; // Front Right
    rl: THREE.Group; // Rear Left
    rr: THREE.Group; // Rear Right
  };
  headlightsMat: THREE.MeshStandardMaterial;
  taillightsMat: THREE.MeshStandardMaterial;
  headlightLights: THREE.SpotLight[];
  spoilerGroup: THREE.Group;
  exhaustPositions: THREE.Vector3[];
  steeringWheel?: THREE.Mesh;
}

// Generate license plate texture with authentic Uzbekistan style (UZ flag + 01 777 AAA)
function createUzbekPlateTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // White plate background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Black border
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#1e293b';
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

  // Left blue strip with UZ flag & letters
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(4, 4, 38, canvas.height - 8);

  // Mini Uzbek flag stripes inside blue box
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(6, 6, 34, 7);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(6, 13, 34, 4);
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(6, 17, 34, 7);

  // Text "UZ"
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('UZ', 10, 48);

  // Plate numbers: 01 777 AAA (Tashkent city code)
  ctx.fillStyle = '#09090b';
  ctx.font = 'bold 36px "Chakra Petch", monospace, sans-serif';
  ctx.fillText('01 777 AAA', 54, 46);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

// Shared plate texture
let cachedPlateTexture: THREE.CanvasTexture | null = null;
function getPlateTexture(): THREE.CanvasTexture {
  if (!cachedPlateTexture) {
    cachedPlateTexture = createUzbekPlateTexture();
  }
  return cachedPlateTexture;
}

// Helper to build a wheel with tire, rim style, brake disc, and caliper
export function createWheelMesh(rimStyle: RimStyle, rimColorHex: string): THREE.Group {
  const wheelGroup = new THREE.Group();

  // Rubber tire
  const tireGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.22, 24);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.9,
    metalness: 0.1,
  });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  wheelGroup.add(tire);

  // Wheel rim face
  const rimColor = new THREE.Color(rimColorHex);
  const rimMat = new THREE.MeshStandardMaterial({
    color: rimColor,
    roughness: 0.25,
    metalness: 0.85,
  });

  const rimCenterGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.225, 24);
  rimCenterGeo.rotateZ(Math.PI / 2);
  const rimCenter = new THREE.Mesh(rimCenterGeo, rimMat);
  wheelGroup.add(rimCenter);

  // Spokes based on style
  if (rimStyle === 'vossen') {
    // 5 thick concave spokes
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const spokeGeo = new THREE.BoxGeometry(0.04, 0.24, 0.05);
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.position.set(0.1, Math.cos(angle) * 0.12, Math.sin(angle) * 0.12);
      spoke.rotation.x = angle;
      wheelGroup.add(spoke);
    }
  } else if (rimStyle === 'bbs') {
    // Mesh cross spokes
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI * 2) / 10;
      const spokeGeo = new THREE.BoxGeometry(0.02, 0.24, 0.02);
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.position.set(0.1, Math.cos(angle) * 0.12, Math.sin(angle) * 0.12);
      spoke.rotation.x = angle;
      wheelGroup.add(spoke);
    }
  } else if (rimStyle === 'shtamp') {
    // Classic black steel wheel with small holes
    const shtampMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6, metalness: 0.4 });
    const capGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.228, 16);
    capGeo.rotateZ(Math.PI / 2);
    const cap = new THREE.Mesh(capGeo, shtampMat);
    wheelGroup.add(cap);
    // Silver center nut
    const nutGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.235, 8);
    nutGeo.rotateZ(Math.PI / 2);
    const nut = new THREE.Mesh(nutGeo, new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 }));
    wheelGroup.add(nut);
  } else {
    // Stock/Sport alloy spokes
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const spokeGeo = new THREE.BoxGeometry(0.035, 0.22, 0.04);
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.position.set(0.1, Math.cos(angle) * 0.11, Math.sin(angle) * 0.11);
      spoke.rotation.x = angle;
      wheelGroup.add(spoke);
    }
  }

  // Brake disc rotor inside
  const discGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.04, 16);
  discGeo.rotateZ(Math.PI / 2);
  const discMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.x = -0.02;
  wheelGroup.add(disc);

  // Red Brembo brake caliper
  const caliperGeo = new THREE.BoxGeometry(0.08, 0.09, 0.06);
  const caliperMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5, roughness: 0.3 });
  const caliper = new THREE.Mesh(caliperGeo, caliperMat);
  caliper.position.set(-0.02, 0.12, 0);
  wheelGroup.add(caliper);

  return wheelGroup;
}

// Build spoiler
function createSpoiler(style: SpoilerStyle): THREE.Group {
  const group = new THREE.Group();
  if (style === 'none') return group;

  const mat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4, metalness: 0.5 });

  if (style === 'lip') {
    // Subtle trunk lip spoiler
    const lipGeo = new THREE.BoxGeometry(1.4, 0.04, 0.12);
    const lip = new THREE.Mesh(lipGeo, mat);
    lip.position.set(0, 0.03, 0);
    lip.castShadow = true;
    group.add(lip);
  } else if (style === 'gt') {
    // Aggressive GT racing wing
    // Two vertical wing struts
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const strutLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.1), strutMat);
    strutLeft.position.set(-0.5, 0.12, 0);
    strutLeft.castShadow = true;
    group.add(strutLeft);

    const strutRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.1), strutMat);
    strutRight.position.set(0.5, 0.12, 0);
    strutRight.castShadow = true;
    group.add(strutRight);

    // Main airfoil wing
    const wingGeo = new THREE.BoxGeometry(1.6, 0.04, 0.28);
    const wing = new THREE.Mesh(wingGeo, mat);
    wing.position.set(0, 0.24, -0.02);
    wing.rotation.x = -0.08;
    wing.castShadow = true;
    group.add(wing);

    // Endplates
    const endL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.3), mat);
    endL.position.set(-0.8, 0.24, -0.02);
    group.add(endL);
    const endR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.3), mat);
    endR.position.set(0.8, 0.24, -0.02);
    group.add(endR);
  }

  return group;
}

// Master function to construct custom 3D car based on model ID & tuning
export function buildCar3D(carId: CarId, tuning: CarTuning): Car3DObject {
  const root = new THREE.Group();

  // Common materials
  const carPaintColor = new THREE.Color(tuning.paintColor);
  const roughness = tuning.finish === 'matte' ? 0.85 : tuning.finish === 'metallic' ? 0.2 : 0.4;
  const metalness = tuning.finish === 'metallic' ? 0.75 : tuning.finish === 'matte' ? 0.05 : 0.3;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: carPaintColor,
    roughness,
    metalness,
  });

  const blackTrimMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
    metalness: 0.2,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.15,
    metalness: 0.95,
  });

  // Windows glass with tint level
  const tintAlpha = tuning.tintLevel === 100 ? 0.95 : tuning.tintLevel === 50 ? 0.75 : 0.35;
  const tintColor = tuning.tintLevel === 0 ? 0x93c5fd : 0x09090b;
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: tintColor,
    transmission: 1 - tintAlpha * 0.8,
    opacity: 0.85,
    transparent: true,
    roughness: 0.1,
    metalness: 0.2,
    ior: 1.5,
  });

  // Headlights & taillights emissive
  const headlightsMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfef08a,
    emissiveIntensity: 0.4,
    roughness: 0.1,
    metalness: 0.2,
  });

  const taillightsMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.5,
    roughness: 0.2,
  });

  // Uzbek license plates
  const plateMat = new THREE.MeshBasicMaterial({ map: getPlateTexture() });
  const plateGeo = new THREE.PlaneGeometry(0.48, 0.12);

  const exhaustPositions: THREE.Vector3[] = [];
  const headlightLights: THREE.SpotLight[] = [];

  let wheelBaseX = 0.84; // Half-width between left/right wheels
  let frontWheelZ = 1.35; // Position of front axle
  let rearWheelZ = -1.35; // Position of rear axle
  let wheelRadius = 0.34;
  let trunkZ = -2.1;
  let steeringWheel: THREE.Mesh | undefined;

  // Assemble distinct 3D geometry based on specific car
  if (carId === 'damas') {
    // ----------------------------------------------------
    // AFSONAVIY DAMAS VAN
    // Boxy microvan, 1.4m wide, 1.85m high, cab-over flat front
    // ----------------------------------------------------
    wheelBaseX = 0.65;
    frontWheelZ = 0.95;
    rearWheelZ = -0.95;
    trunkZ = -1.55;

    // Main box body
    const bodyGeo = new THREE.BoxGeometry(1.36, 1.35, 3.1);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, 0.95, 0);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    root.add(bodyMesh);

    // Front curved cab-over nose
    const noseGeo = new THREE.BoxGeometry(1.34, 0.65, 0.35);
    const nose = new THREE.Mesh(noseGeo, bodyMat);
    nose.position.set(0, 0.55, 1.6);
    nose.castShadow = true;
    root.add(nose);

    // Front black bumper
    const bumperGeo = new THREE.BoxGeometry(1.4, 0.28, 0.22);
    const bumper = new THREE.Mesh(bumperGeo, blackTrimMat);
    bumper.position.set(0, 0.36, 1.68);
    bumper.castShadow = true;
    root.add(bumper);

    // Damas front windshield (steep upright glass)
    const wsGeo = new THREE.PlaneGeometry(1.24, 0.62);
    const ws = new THREE.Mesh(wsGeo, glassMat);
    ws.position.set(0, 1.15, 1.56);
    ws.rotation.x = -0.15;
    root.add(ws);

    // Side windows (sliding passenger van windows)
    const sideGlassGeo = new THREE.PlaneGeometry(2.3, 0.52);
    const sideGlassL = new THREE.Mesh(sideGlassGeo, glassMat);
    sideGlassL.position.set(-0.69, 1.18, -0.15);
    sideGlassL.rotation.y = -Math.PI / 2;
    root.add(sideGlassL);

    const sideGlassR = new THREE.Mesh(sideGlassGeo, glassMat);
    sideGlassR.position.set(0.69, 1.18, -0.15);
    sideGlassR.rotation.y = Math.PI / 2;
    root.add(sideGlassR);

    // Rear window
    const rearGlassGeo = new THREE.PlaneGeometry(1.18, 0.55);
    const rearGlass = new THREE.Mesh(rearGlassGeo, glassMat);
    rearGlass.position.set(0, 1.25, -1.56);
    rearGlass.rotation.y = Math.PI;
    root.add(rearGlass);

    // Headlights (rectangular Damas lights)
    const hlGeo = new THREE.BoxGeometry(0.24, 0.18, 0.05);
    const hlL = new THREE.Mesh(hlGeo, headlightsMat);
    hlL.position.set(-0.48, 0.68, 1.76);
    root.add(hlL);
    const hlR = new THREE.Mesh(hlGeo, headlightsMat);
    hlR.position.set(0.48, 0.68, 1.76);
    root.add(hlR);

    // Damas front center badge / Daewoo strip
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.04), chromeMat);
    badge.position.set(0, 0.68, 1.77);
    root.add(badge);

    // Vertical taillights on rear pillars
    const tlGeo = new THREE.BoxGeometry(0.12, 0.38, 0.05);
    const tlL = new THREE.Mesh(tlGeo, taillightsMat);
    tlL.position.set(-0.58, 0.85, -1.56);
    root.add(tlL);
    const tlR = new THREE.Mesh(tlGeo, taillightsMat);
    tlR.position.set(0.58, 0.85, -1.56);
    root.add(tlR);

    // Uzbek license plates
    const frontPlate = new THREE.Mesh(plateGeo, plateMat);
    frontPlate.position.set(0, 0.34, 1.8);
    root.add(frontPlate);

    const rearPlate = new THREE.Mesh(plateGeo, plateMat);
    rearPlate.position.set(0, 0.42, -1.565);
    rearPlate.rotation.y = Math.PI;
    root.add(rearPlate);

    // Single small exhaust
    exhaustPositions.push(new THREE.Vector3(-0.45, 0.22, -1.55));
  } else if (carId === 'cobalt') {
    // ----------------------------------------------------
    // COBALT 1.5 LTZ
    // Taller modern sedan, high beltline, distinctive split grille
    // ----------------------------------------------------
    wheelBaseX = 0.84;
    frontWheelZ = 1.32;
    rearWheelZ = -1.32;
    trunkZ = -2.15;

    // Lower chassis body
    const bodyGeo = new THREE.BoxGeometry(1.72, 0.58, 4.3);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, 0.52, 0);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    root.add(bodyMesh);

    // High rounded cabin
    const cabinGeo = new THREE.BoxGeometry(1.52, 0.68, 2.25);
    const cabin = new THREE.Mesh(cabinGeo, bodyMat);
    cabin.position.set(0, 1.05, -0.15);
    cabin.castShadow = true;
    root.add(cabin);

    // Sloped Cobalt hood
    const hoodGeo = new THREE.BoxGeometry(1.64, 0.22, 1.25);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(0, 0.68, 1.45);
    hood.rotation.x = 0.08;
    hood.castShadow = true;
    root.add(hood);

    // Front dual-port split grille (Cobalt trademark)
    const grilleUpper = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.16, 0.08), blackTrimMat);
    grilleUpper.position.set(0, 0.64, 2.16);
    root.add(grilleUpper);
    const grilleLower = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.18, 0.08), blackTrimMat);
    grilleLower.position.set(0, 0.4, 2.16);
    root.add(grilleLower);
    const chromeBar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.09), chromeMat);
    chromeBar.position.set(0, 0.54, 2.16);
    root.add(chromeBar);

    // Gold Chevrolet bowtie emblem
    const emblem = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.05), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 }));
    emblem.position.set(0, 0.54, 2.21);
    root.add(emblem);

    // Large swept Cobalt headlights
    const hlGeo = new THREE.BoxGeometry(0.32, 0.2, 0.28);
    const hlL = new THREE.Mesh(hlGeo, headlightsMat);
    hlL.position.set(-0.62, 0.65, 2.02);
    hlL.rotation.y = -0.22;
    root.add(hlL);
    const hlR = new THREE.Mesh(hlGeo, headlightsMat);
    hlR.position.set(0.62, 0.65, 2.02);
    hlR.rotation.y = 0.22;
    root.add(hlR);

    // High trunk decklid
    const trunkGeo = new THREE.BoxGeometry(1.6, 0.32, 0.85);
    const trunk = new THREE.Mesh(trunkGeo, bodyMat);
    trunk.position.set(0, 0.78, -1.7);
    trunk.castShadow = true;
    root.add(trunk);

    // Rear taillights
    const tlGeo = new THREE.BoxGeometry(0.24, 0.34, 0.1);
    const tlL = new THREE.Mesh(tlGeo, taillightsMat);
    tlL.position.set(-0.64, 0.78, -2.16);
    root.add(tlL);
    const tlR = new THREE.Mesh(tlGeo, taillightsMat);
    tlR.position.set(0.64, 0.78, -2.16);
    root.add(tlR);

    // Windows
    const wsGeo = new THREE.PlaneGeometry(1.4, 0.68);
    const ws = new THREE.Mesh(wsGeo, glassMat);
    ws.position.set(0, 1.05, 0.98);
    ws.rotation.x = -0.52;
    root.add(ws);

    const rwGeo = new THREE.PlaneGeometry(1.36, 0.62);
    const rw = new THREE.Mesh(rwGeo, glassMat);
    rw.position.set(0, 1.06, -1.28);
    rw.rotation.x = 0.54;
    rw.rotation.y = Math.PI;
    root.add(rw);

    // Side windows
    const sideGlassGeo = new THREE.PlaneGeometry(1.95, 0.48);
    const sideGlassL = new THREE.Mesh(sideGlassGeo, glassMat);
    sideGlassL.position.set(-0.765, 1.06, -0.15);
    sideGlassL.rotation.y = -Math.PI / 2;
    root.add(sideGlassL);

    const sideGlassR = new THREE.Mesh(sideGlassGeo, glassMat);
    sideGlassR.position.set(0.765, 1.06, -0.15);
    sideGlassR.rotation.y = Math.PI / 2;
    root.add(sideGlassR);

    // Plates
    const frontPlate = new THREE.Mesh(plateGeo, plateMat);
    frontPlate.position.set(0, 0.28, 2.16);
    root.add(frontPlate);

    const rearPlate = new THREE.Mesh(plateGeo, plateMat);
    rearPlate.position.set(0, 0.52, -2.16);
    rearPlate.rotation.y = Math.PI;
    root.add(rearPlate);

    exhaustPositions.push(new THREE.Vector3(0.55, 0.24, -2.15));
  } else {
    // ----------------------------------------------------
    // GENTRA (Lacetti sedan profile) & OTHER CARS
    // Sleek balanced sedan, almond headlights, chrome grille
    // ----------------------------------------------------
    wheelBaseX = carId === 'spark' || carId === 'matiz' ? 0.68 : carId === 'malibu' ? 0.92 : 0.84;
    frontWheelZ = carId === 'spark' || carId === 'matiz' ? 1.05 : carId === 'malibu' ? 1.48 : 1.35;
    rearWheelZ = carId === 'spark' || carId === 'matiz' ? -1.05 : carId === 'malibu' ? -1.48 : -1.35;
    trunkZ = carId === 'spark' || carId === 'matiz' ? -1.5 : carId === 'malibu' ? -2.35 : -2.15;

    const carLength = carId === 'spark' || carId === 'matiz' ? 3.4 : carId === 'malibu' ? 4.7 : 4.4;
    const carWidth = carId === 'spark' || carId === 'matiz' ? 1.45 : carId === 'malibu' ? 1.86 : 1.72;
    const cabinHeight = carId === 'spark' || carId === 'matiz' ? 0.65 : 0.58;

    // Lower body
    const bodyGeo = new THREE.BoxGeometry(carWidth, 0.54, carLength);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, 0.5, 0);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    root.add(bodyMesh);

    // Cabin
    const cabinLength = carId === 'spark' || carId === 'matiz' ? 1.9 : 2.2;
    const cabinGeo = new THREE.BoxGeometry(carWidth - 0.2, cabinHeight, cabinLength);
    const cabin = new THREE.Mesh(cabinGeo, bodyMat);
    cabin.position.set(0, 0.98, -0.15);
    cabin.castShadow = true;
    root.add(cabin);

    // Gentra / Lacetti Front hood
    const hoodZ = frontWheelZ + 0.3;
    const hoodGeo = new THREE.BoxGeometry(carWidth - 0.08, 0.16, 1.2);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(0, 0.65, hoodZ - 0.4);
    hood.rotation.x = 0.06;
    hood.castShadow = true;
    root.add(hood);

    // Gentra Front Grille (Iconic chrome horizontal bar with badge)
    const grilleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.14, 0.08), blackTrimMat);
    grilleMesh.position.set(0, 0.54, carLength / 2 + 0.02);
    root.add(grilleMesh);

    const chromeBar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.09), chromeMat);
    chromeBar.position.set(0, 0.56, carLength / 2 + 0.02);
    root.add(chromeBar);

    // Golden emblem
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.04), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.2 }));
    badge.position.set(0, 0.56, carLength / 2 + 0.07);
    root.add(badge);

    // Almond style elongated headlights (Gentra signature)
    const hlGeo = new THREE.BoxGeometry(0.32, 0.16, 0.25);
    const hlL = new THREE.Mesh(hlGeo, headlightsMat);
    hlL.position.set(-(carWidth / 2 - 0.24), 0.6, carLength / 2 - 0.05);
    hlL.rotation.y = -0.18;
    root.add(hlL);
    const hlR = new THREE.Mesh(hlGeo, headlightsMat);
    hlR.position.set(carWidth / 2 - 0.24, 0.6, carLength / 2 - 0.05);
    hlR.rotation.y = 0.18;
    root.add(hlR);

    // Rear trunk & taillights
    if (carId !== 'spark' && carId !== 'matiz') {
      const trunkGeo = new THREE.BoxGeometry(carWidth - 0.12, 0.26, 0.85);
      const trunk = new THREE.Mesh(trunkGeo, bodyMat);
      trunk.position.set(0, 0.72, trunkZ + 0.4);
      trunk.castShadow = true;
      root.add(trunk);

      // Taillights
      const tlGeo = new THREE.BoxGeometry(0.28, 0.22, 0.08);
      const tlL = new THREE.Mesh(tlGeo, taillightsMat);
      tlL.position.set(-(carWidth / 2 - 0.22), 0.72, trunkZ);
      root.add(tlL);
      const tlR = new THREE.Mesh(tlGeo, taillightsMat);
      tlR.position.set(carWidth / 2 - 0.22, 0.72, trunkZ);
      root.add(tlR);
    } else {
      // Hatchback rear
      const tlGeo = new THREE.BoxGeometry(0.16, 0.34, 0.08);
      const tlL = new THREE.Mesh(tlGeo, taillightsMat);
      tlL.position.set(-(carWidth / 2 - 0.16), 0.82, trunkZ);
      root.add(tlL);
      const tlR = new THREE.Mesh(tlGeo, taillightsMat);
      tlR.position.set(carWidth / 2 - 0.16, 0.82, trunkZ);
      root.add(tlR);
    }

    // Windows
    const wsGeo = new THREE.PlaneGeometry(carWidth - 0.3, 0.62);
    const ws = new THREE.Mesh(wsGeo, glassMat);
    ws.position.set(0, 0.98, 0.95);
    ws.rotation.x = -0.56;
    root.add(ws);

    const rwGeo = new THREE.PlaneGeometry(carWidth - 0.35, 0.58);
    const rw = new THREE.Mesh(rwGeo, glassMat);
    rw.position.set(0, 0.99, -1.25);
    rw.rotation.x = 0.56;
    rw.rotation.y = Math.PI;
    root.add(rw);

    // Side windows
    const sideGlassGeo = new THREE.PlaneGeometry(cabinLength - 0.3, 0.44);
    const sideGlassL = new THREE.Mesh(sideGlassGeo, glassMat);
    sideGlassL.position.set(-(carWidth - 0.19) / 2, 0.99, -0.15);
    sideGlassL.rotation.y = -Math.PI / 2;
    root.add(sideGlassL);

    const sideGlassR = new THREE.Mesh(sideGlassGeo, glassMat);
    sideGlassR.position.set((carWidth - 0.19) / 2, 0.99, -0.15);
    sideGlassR.rotation.y = Math.PI / 2;
    root.add(sideGlassR);

    // Plates
    const frontPlate = new THREE.Mesh(plateGeo, plateMat);
    frontPlate.position.set(0, 0.28, carLength / 2 + 0.02);
    root.add(frontPlate);

    const rearPlate = new THREE.Mesh(plateGeo, plateMat);
    rearPlate.position.set(0, 0.45, trunkZ - 0.02);
    rearPlate.rotation.y = Math.PI;
    root.add(rearPlate);

    // Malibu dual exhaust or Gentra single chrome exhaust
    if (carId === 'malibu') {
      exhaustPositions.push(new THREE.Vector3(-0.55, 0.22, trunkZ));
      exhaustPositions.push(new THREE.Vector3(0.55, 0.22, trunkZ));
      // Add chrome exhaust tips
      const tipL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 12), chromeMat);
      tipL.rotation.x = Math.PI / 2;
      tipL.position.set(-0.55, 0.22, trunkZ - 0.02);
      root.add(tipL);
      const tipR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 12), chromeMat);
      tipR.rotation.x = Math.PI / 2;
      tipR.position.set(0.55, 0.22, trunkZ - 0.02);
      root.add(tipR);
    } else {
      exhaustPositions.push(new THREE.Vector3(carWidth / 2 - 0.3, 0.22, trunkZ));
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.15, 12), chromeMat);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(carWidth / 2 - 0.3, 0.22, trunkZ - 0.02);
      root.add(tip);
    }
  }

  // Side mirrors
  const mirrorGeo = new THREE.BoxGeometry(0.18, 0.1, 0.12);
  const mirrorL = new THREE.Mesh(mirrorGeo, bodyMat);
  mirrorL.position.set(-wheelBaseX - 0.08, 0.88, 0.65);
  root.add(mirrorL);
  const mirrorR = new THREE.Mesh(mirrorGeo, bodyMat);
  mirrorR.position.set(wheelBaseX + 0.08, 0.88, 0.65);
  root.add(mirrorR);

  // Interior: Dashboard & Steering Wheel
  const dashGeo = new THREE.BoxGeometry(1.3, 0.28, 0.45);
  const dashMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
  const dashboard = new THREE.Mesh(dashGeo, dashMat);
  dashboard.position.set(0, 0.78, 0.55);
  root.add(dashboard);

  // Speedometer cluster glow
  const clusterGeo = new THREE.PlaneGeometry(0.24, 0.08);
  const clusterMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const cluster = new THREE.Mesh(clusterGeo, clusterMat);
  cluster.position.set(-0.35, 0.86, 0.38);
  cluster.rotation.x = -0.4;
  root.add(cluster);

  // Steering wheel (Torus)
  const steerGeo = new THREE.TorusGeometry(0.14, 0.024, 8, 20);
  const steerMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.5 });
  steeringWheel = new THREE.Mesh(steerGeo, steerMat);
  steeringWheel.position.set(-0.35, 0.84, 0.26);
  steeringWheel.rotation.x = -0.55;
  root.add(steeringWheel);

  // Spoiler mounting
  const spoilerGroup = createSpoiler(tuning.spoiler);
  spoilerGroup.position.set(0, 0.88, trunkZ + 0.25);
  root.add(spoilerGroup);

  // 4 Wheels
  const suspensionY = wheelRadius + tuning.suspensionOffset;

  const wheelFL = createWheelMesh(tuning.rimStyle, tuning.rimColor);
  wheelFL.position.set(-wheelBaseX, suspensionY, frontWheelZ);
  root.add(wheelFL);

  const wheelFR = createWheelMesh(tuning.rimStyle, tuning.rimColor);
  wheelFR.rotation.y = Math.PI;
  wheelFR.position.set(wheelBaseX, suspensionY, frontWheelZ);
  root.add(wheelFR);

  const wheelRL = createWheelMesh(tuning.rimStyle, tuning.rimColor);
  wheelRL.position.set(-wheelBaseX, suspensionY, rearWheelZ);
  root.add(wheelRL);

  const wheelRR = createWheelMesh(tuning.rimStyle, tuning.rimColor);
  wheelRR.rotation.y = Math.PI;
  wheelRR.position.set(wheelBaseX, suspensionY, rearWheelZ);
  root.add(wheelRR);

  // Headlight spot beams for night/fog
  const leftSpot = new THREE.SpotLight(0xffffff, 1.8, 45, Math.PI / 6, 0.4, 1.2);
  leftSpot.position.set(-0.5, 0.65, frontWheelZ + 0.8);
  leftSpot.target.position.set(-0.5, 0, frontWheelZ + 20);
  root.add(leftSpot);
  root.add(leftSpot.target);
  headlightLights.push(leftSpot);

  const rightSpot = new THREE.SpotLight(0xffffff, 1.8, 45, Math.PI / 6, 0.4, 1.2);
  rightSpot.position.set(0.5, 0.65, frontWheelZ + 0.8);
  rightSpot.target.position.set(0.5, 0, frontWheelZ + 20);
  root.add(rightSpot);
  root.add(rightSpot.target);
  headlightLights.push(rightSpot);

  return {
    group: root,
    bodyMesh: root.children[0] as THREE.Mesh,
    windowsMesh: root.children[3] as THREE.Mesh,
    wheels: {
      fl: wheelFL,
      fr: wheelFR,
      rl: wheelRL,
      rr: wheelRR,
    },
    headlightsMat,
    taillightsMat,
    headlightLights,
    spoilerGroup,
    exhaustPositions,
    steeringWheel,
  };
}
