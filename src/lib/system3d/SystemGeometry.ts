/**
 * Geometría procedural del sistema operacional 3D (multisectorial).
 * Personajes estilizados con primitivas — sin modelos externos.
 */
import * as THREE from 'three';
import type { ForceId } from './SystemEducationalData.ts';
import {
  CENTER_PLATFORM_POSITION,
  FORCE_PLATFORM_POSITIONS,
} from './SystemInteraction.ts';

export interface SystemSharedMaterials {
  platformBody: THREE.MeshStandardMaterial;
  platformEdge: THREE.MeshStandardMaterial;
  platformGlow: THREE.MeshStandardMaterial;
  skin: THREE.MeshStandardMaterial;
  clothingA: THREE.MeshStandardMaterial;
  clothingB: THREE.MeshStandardMaterial;
  clothingLeader: THREE.MeshStandardMaterial;
  propDark: THREE.MeshStandardMaterial;
  propScreen: THREE.MeshStandardMaterial;
  accentEmissive: THREE.MeshStandardMaterial;
  warning: THREE.MeshStandardMaterial;
  connection: THREE.MeshStandardMaterial;
  domeGlass: THREE.MeshPhysicalMaterial;
}

export interface ForcePlatformBundle {
  id: ForceId | 'sistema';
  root: THREE.Group;
  platform: THREE.Group;
  actors: THREE.Group;
  props: THREE.Group;
  hitTarget: THREE.Mesh;
  glowRing: THREE.Mesh;
  underLight: THREE.PointLight;
  veil: THREE.Mesh;
  storyNodes: Record<string, THREE.Object3D>;
}

export interface SystemGeometryWorld {
  root: THREE.Group;
  center: ForcePlatformBundle;
  forces: Record<ForceId, ForcePlatformBundle>;
  connections: THREE.Group;
  connectionMeshes: THREE.Mesh[];
  ambientProps: THREE.Group;
}

/** Plataforma circular metálica con anillo neón (composición de referencia Imagen A). */
function circularPlatform(
  radius: number,
  height: number,
  bodyMat: THREE.Material,
  edgeMat: THREE.Material,
  glowMat: THREE.Material
): THREE.Group {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.02, height, 48),
    bodyMat
  );
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const topDisk = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.96, 48),
    bodyMat
  );
  topDisk.rotation.x = -Math.PI / 2;
  topDisk.position.y = height + 0.01;
  topDisk.receiveShadow = true;
  group.add(topDisk);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.98, 0.055, 10, 48), edgeMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = height + 0.03;
  group.add(rim);

  const underGlow = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.55, radius * 1.18, 48),
    glowMat
  );
  underGlow.rotation.x = -Math.PI / 2;
  underGlow.position.y = 0.02;
  group.add(underGlow);

  return group;
}

function createStylizedHuman(options: {
  materials: SystemSharedMaterials;
  clothing: THREE.MeshStandardMaterial;
  scale?: number;
  pose?: 'standing' | 'sitting' | 'leaning' | 'pointing';
  headgear?: 'none' | 'cap' | 'hardhat';
  vest?: boolean;
  hairColor?: number;
}): THREE.Group {
  const { materials, clothing } = options;
  const scale = options.scale ?? 1;
  const pose = options.pose ?? 'standing';
  const human = new THREE.Group();
  human.scale.setScalar(scale);

  const hairMat = new THREE.MeshStandardMaterial({
    color: options.hairColor ?? 0x1f2937,
    roughness: 0.82,
    metalness: 0.04,
  });

  // Cadena articula: pelvis → torso → cuello → cabeza; brazos en hombros.
  const pelvis = new THREE.Group();
  pelvis.position.y = 0.42;
  human.add(pelvis);

  const hips = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.16, 5, 12), materials.propDark);
  hips.castShadow = true;
  pelvis.add(hips);

  const torsoPivot = new THREE.Group();
  torsoPivot.position.y = 0.18;
  pelvis.add(torsoPivot);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.44, 6, 12), clothing);
  torso.position.y = 0.28;
  torso.castShadow = true;
  torsoPivot.add(torso);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 16), clothing);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.52;
  torsoPivot.add(collar);

  if (options.vest) {
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.22), materials.clothingB);
    vest.position.y = 0.3;
    vest.castShadow = true;
    torsoPivot.add(vest);
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.04, 0.24),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, emissive: 0xf8fafc, emissiveIntensity: 0.15 })
    );
    stripe.position.y = 0.38;
    torsoPivot.add(stripe);
  }

  const shoulderL = new THREE.Group();
  shoulderL.position.set(-0.26, 0.44, 0);
  torsoPivot.add(shoulderL);
  const shoulderR = new THREE.Group();
  shoulderR.position.set(0.26, 0.44, 0);
  torsoPivot.add(shoulderR);

  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.36, 5, 10), clothing);
  armL.position.set(0, -0.22, 0);
  armL.rotation.z = 0.22;
  armL.castShadow = true;
  shoulderL.add(armL);
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 10), materials.skin);
  handL.position.set(0, -0.42, 0);
  shoulderL.add(handL);

  const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.36, 5, 10), clothing);
  armR.position.set(0, -0.22, 0);
  armR.rotation.z = -0.22;
  armR.castShadow = true;
  shoulderR.add(armR);
  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 10), materials.skin);
  handR.position.set(0, -0.42, 0);
  shoulderR.add(handR);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.11, 10), materials.skin);
  neck.position.y = 0.58;
  torsoPivot.add(neck);

  const head = new THREE.Group();
  head.position.y = 0.74;
  torsoPivot.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.16, 22, 18), materials.skin);
  skull.castShadow = true;
  head.add(skull);

  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), materials.skin);
  jaw.scale.set(0.92, 0.72, 0.85);
  jaw.position.set(0, -0.08, 0.02);
  head.add(jaw);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.165, 18, 14, 0, Math.PI * 2, 0, Math.PI / 1.55), hairMat);
  hair.position.y = 0.04;
  head.add(hair);

  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const eyeIris = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.28 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), eyeWhite);
  eyeL.position.set(-0.052, 0.02, 0.135);
  const irisL = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), eyeIris);
  irisL.position.set(-0.052, 0.02, 0.155);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.052;
  const irisR = irisL.clone();
  irisR.position.x = 0.052;
  head.add(eyeL, irisL, eyeR, irisR);

  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.016, 0.02), hairMat);
  brow.position.set(0, 0.055, 0.14);
  head.add(brow);

  if (options.headgear === 'hardhat') {
    const hat = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      materials.warning
    );
    hat.position.y = 0.06;
    head.add(hat);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.03, 16), materials.warning);
    brim.position.y = 0.02;
    head.add(brim);
  } else if (options.headgear === 'cap') {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2.2),
      clothing
    );
    cap.position.y = 0.05;
    head.add(cap);
    const bill = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.1), clothing);
    bill.position.set(0, 0.02, 0.14);
    head.add(bill);
  }

  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.38, 5, 10), materials.propDark);
  legL.position.set(-0.1, 0.18, 0);
  legL.castShadow = true;
  human.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.1;
  human.add(legR);

  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.16), materials.propDark);
  shoeL.position.set(-0.1, 0.03, 0.03);
  human.add(shoeL);
  const shoeR = shoeL.clone();
  shoeR.position.x = 0.1;
  human.add(shoeR);

  if (pose === 'sitting') {
    pelvis.position.y = 0.34;
    legL.rotation.x = Math.PI / 2.1;
    legL.position.set(-0.1, 0.22, 0.18);
    legR.rotation.x = Math.PI / 2.1;
    legR.position.set(0.1, 0.22, 0.18);
    shoeL.position.set(-0.1, 0.14, 0.38);
    shoeR.position.set(0.1, 0.14, 0.38);
    shoulderL.rotation.x = -0.85;
    shoulderR.rotation.x = -0.75;
  } else if (pose === 'leaning') {
    torsoPivot.rotation.x = 0.32;
    head.rotation.x = -0.18;
    shoulderR.rotation.x = -1.05;
  } else if (pose === 'pointing') {
    shoulderR.rotation.set(-1.35, 0.15, -0.2);
  }

  human.userData.armL = shoulderL;
  human.userData.armR = shoulderR;
  human.userData.head = head;
  human.userData.torso = torsoPivot;
  human.userData.pelvis = pelvis;
  return human;
}

/** Engranaje central del hub SISTEMA OPERACIONAL. */
function createOperationalGear(mat: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.16, 24), mat);
  hub.castShadow = true;
  group.add(hub);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.07, 10, 28), mat);
  ring.rotation.x = Math.PI / 2;
  ring.castShadow = true;
  group.add(ring);

  const teeth = 10;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.18), mat);
    tooth.position.set(Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42);
    tooth.lookAt(0, 0, 0);
    tooth.castShadow = true;
    group.add(tooth);
  }

  const bore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.2, 16),
    new THREE.MeshStandardMaterial({ color: 0x0b1220, metalness: 0.4, roughness: 0.45 })
  );
  group.add(bore);
  return group;
}

function createVeil(radius: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.05, 2.05, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  mesh.position.y = 1.15;
  mesh.renderOrder = 3;
  mesh.name = 'force-veil';
  return mesh;
}

function uniqueGlow(materials: SystemSharedMaterials, radiusInner: number, radiusOuter: number): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radiusInner, radiusOuter, 40),
    materials.platformGlow.clone()
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;
  return ring;
}

function createTablet(matScreen: THREE.Material, matBody: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 0.2), matBody);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.01, 0.16), matScreen);
  screen.position.y = 0.015;
  g.add(body, screen);
  return g;
}

function createDesk(mat: THREE.Material): THREE.Mesh {
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 0.55), mat);
  desk.position.y = 0.42;
  desk.castShadow = true;
  desk.receiveShadow = true;
  return desk;
}

function createVerticalPanel(
  label: string,
  matBody: THREE.Material,
  matScreen: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  g.name = label;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.7, 0.06), matBody);
  frame.position.y = 0.55;
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.52, 0.03),
    (matScreen as THREE.Material).clone()
  );
  screen.position.set(0, 0.55, 0.04);
  g.add(frame, screen);
  g.userData.screen = screen;
  return g;
}

function createChartBoard(
  matBody: THREE.Material,
  matScreen: THREE.Material,
  accent: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.72, 0.05), matBody);
  board.position.y = 0.85;
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.02), matScreen);
  screen.position.set(0, 0.85, 0.04);
  const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.04), accent);
  bar1.position.set(-0.22, 0.72, 0.07);
  const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 0.04), accent);
  bar2.position.set(-0.05, 0.78, 0.07);
  const bar3 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.04), accent);
  bar3.position.set(0.12, 0.7, 0.07);
  g.add(board, screen, bar1, bar2, bar3);
  g.userData.bars = [bar1, bar2, bar3];
  return g;
}

export function createSystemSharedMaterials(accentHex: number): SystemSharedMaterials {
  return {
    platformBody: new THREE.MeshStandardMaterial({
      color: 0x1a2230,
      metalness: 0.55,
      roughness: 0.38,
    }),
    platformEdge: new THREE.MeshStandardMaterial({
      color: accentHex,
      metalness: 0.62,
      roughness: 0.28,
      emissive: accentHex,
      emissiveIntensity: 0.28,
    }),
    platformGlow: new THREE.MeshStandardMaterial({
      color: accentHex,
      emissive: accentHex,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.7,
      metalness: 0.2,
      roughness: 0.55,
    }),
    skin: new THREE.MeshStandardMaterial({
      color: 0xc68662,
      roughness: 0.72,
      metalness: 0.05,
    }),
    clothingA: new THREE.MeshStandardMaterial({
      color: 0x2f6fed,
      roughness: 0.55,
      metalness: 0.12,
    }),
    clothingB: new THREE.MeshStandardMaterial({
      color: 0xd4a017,
      roughness: 0.58,
      metalness: 0.1,
    }),
    clothingLeader: new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.18,
    }),
    propDark: new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.62,
      metalness: 0.2,
    }),
    propScreen: new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
      roughness: 0.35,
      metalness: 0.25,
    }),
    accentEmissive: new THREE.MeshStandardMaterial({
      color: accentHex,
      emissive: accentHex,
      emissiveIntensity: 0.7,
      roughness: 0.4,
      metalness: 0.25,
    }),
    warning: new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.85,
      roughness: 0.4,
      metalness: 0.15,
    }),
    connection: new THREE.MeshStandardMaterial({
      color: accentHex,
      emissive: accentHex,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.35,
      roughness: 0.4,
      metalness: 0.3,
    }),
    domeGlass: new THREE.MeshPhysicalMaterial({
      color: 0x9ae6ff,
      transmission: 0.55,
      transparent: true,
      opacity: 0.85,
      roughness: 0.12,
      metalness: 0.05,
      thickness: 0.35,
      emissive: accentHex,
      emissiveIntensity: 0.18,
    }),
  };
}

function createHitDisk(radius: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.08, 20),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  mesh.position.y = 0.04;
  return mesh;
}

function buildCenterBundle(materials: SystemSharedMaterials): ForcePlatformBundle {
  const root = new THREE.Group();
  root.name = 'sistema';
  root.position.set(
    CENTER_PLATFORM_POSITION.x,
    CENTER_PLATFORM_POSITION.y,
    CENTER_PLATFORM_POSITION.z
  );

  const platform = circularPlatform(1.2, 0.28, materials.platformBody, materials.platformEdge, materials.platformGlow);
  const actors = new THREE.Group();
  const props = new THREE.Group();

  const gear = createOperationalGear(materials.accentEmissive);
  gear.position.y = 0.55;
  gear.rotation.x = 0.18;
  props.add(gear);

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), materials.accentEmissive);
  core.position.y = 0.55;
  props.add(core);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    materials.domeGlass
  );
  dome.position.y = 0.32;
  props.add(dome);

  const glowRing = uniqueGlow(materials, 1.05, 1.28);
  props.add(glowRing);

  const underLight = new THREE.PointLight(0x38bdf8, 1.8, 5.2, 2);
  underLight.position.y = 0.4;

  const veil = createVeil(1.35);
  root.add(platform, actors, props, underLight, veil);
  const hitTarget = createHitDisk(1.25);
  hitTarget.userData.forceId = 'sistema';
  root.add(hitTarget);

  return {
    id: 'sistema',
    root,
    platform,
    actors,
    props,
    hitTarget,
    glowRing,
    underLight,
    veil,
    storyNodes: { dome, core, gear },
  };
}

function buildPersonasBundle(materials: SystemSharedMaterials): ForcePlatformBundle {
  const id: ForceId = 'personas';
  const root = new THREE.Group();
  root.name = id;
  const pos = FORCE_PLATFORM_POSITIONS[id];
  root.position.set(pos.x, pos.y, pos.z);

  const platform = circularPlatform(1.48, 0.3, materials.platformBody, materials.platformEdge, materials.platformGlow);
  const actors = new THREE.Group();
  const props = new THREE.Group();
  const storyNodes: Record<string, THREE.Object3D> = {};

  const desk = createDesk(materials.propDark);
  desk.position.set(0.05, 0, 0.05);
  props.add(desk);

  const observer = createStylizedHuman({
    materials,
    clothing: materials.clothingA,
    pose: 'sitting',
    scale: 1.18,
    headgear: 'hardhat',
  });
  observer.position.set(-0.28, 0.28, 0.05);
  observer.rotation.y = 0.35;
  actors.add(observer);
  storyNodes.observer = observer;

  const partner = createStylizedHuman({
    materials,
    clothing: materials.clothingLeader,
    pose: 'sitting',
    scale: 1.14,
    vest: true,
    headgear: 'cap',
  });
  partner.position.set(0.38, 0.28, 0.08);
  partner.rotation.y = -0.55;
  actors.add(partner);
  storyNodes.partner = partner;

  const standby = createStylizedHuman({
    materials,
    clothing: materials.clothingB,
    pose: 'standing',
    scale: 1.12,
    headgear: 'hardhat',
    vest: true,
  });
  standby.position.set(-0.75, 0.28, -0.35);
  standby.rotation.y = 0.8;
  actors.add(standby);
  storyNodes.standby = standby;

  const request = createTablet(materials.propScreen, materials.propDark);
  request.position.set(-0.05, 0.48, 0.12);
  request.rotation.x = -0.55;
  props.add(request);
  storyNodes.request = request;

  const warning = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 3), materials.warning);
  warning.position.set(-0.05, 1.15, 0.05);
  warning.rotation.y = Math.PI;
  warning.visible = false;
  warning.scale.setScalar(0.001);
  props.add(warning);
  storyNodes.warning = warning;

  const commBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.7, 8),
    materials.accentEmissive
  );
  commBeam.position.set(0.05, 0.95, 0.05);
  commBeam.rotation.z = Math.PI / 2.4;
  commBeam.visible = false;
  commBeam.scale.set(1, 0.001, 1);
  props.add(commBeam);
  storyNodes.commBeam = commBeam;

  const glowRing = uniqueGlow(materials, 1.3, 1.55);
  props.add(glowRing);

  const underLight = new THREE.PointLight(0x38bdf8, 1.1, 4.2, 2);
  underLight.position.y = 0.4;
  const veil = createVeil(1.55);
  root.add(platform, actors, props, underLight, veil);

  const hitTarget = createHitDisk(1.5);
  hitTarget.userData.forceId = id;
  root.add(hitTarget);

  return { id, root, platform, actors, props, hitTarget, glowRing, underLight, veil, storyNodes };
}

function buildProcesosBundle(materials: SystemSharedMaterials): ForcePlatformBundle {
  const id: ForceId = 'procesos';
  const root = new THREE.Group();
  root.name = id;
  const pos = FORCE_PLATFORM_POSITIONS[id];
  root.position.set(pos.x, pos.y, pos.z);

  const platform = circularPlatform(1.48, 0.3, materials.platformBody, materials.platformEdge, materials.platformGlow);
  const actors = new THREE.Group();
  const props = new THREE.Group();
  const storyNodes: Record<string, THREE.Object3D> = {};

  const operator = createStylizedHuman({
    materials,
    clothing: materials.clothingA,
    pose: 'leaning',
    scale: 1.18,
    headgear: 'hardhat',
    vest: true,
  });
  operator.position.set(-0.7, 0.28, 0.15);
  operator.rotation.y = 0.9;
  actors.add(operator);
  storyNodes.operator = operator;

  const stations = ['Recibir', 'Ejecutar', 'Verificar'].map((label, i) => {
    const panel = createVerticalPanel(label, materials.propDark, materials.propScreen);
    panel.position.set(-0.15 + i * 0.48, 0.28, -0.25);
    panel.rotation.y = -0.25;
    props.add(panel);
    storyNodes[`station${i}`] = panel;
    return panel;
  });
  void stations;

  const token = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.08, 0.14),
    materials.accentEmissive
  );
  token.position.set(-0.15, 0.55, 0.15);
  token.visible = false;
  token.scale.setScalar(0.001);
  props.add(token);
  storyNodes.token = token;

  const reviewFlag = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.1, 0),
    materials.warning
  );
  reviewFlag.position.set(0.33, 1.05, -0.05);
  reviewFlag.visible = false;
  reviewFlag.scale.setScalar(0.001);
  props.add(reviewFlag);
  storyNodes.reviewFlag = reviewFlag;

  const binders = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.12), materials.clothingB);
  binders.position.set(0.85, 0.55, -0.45);
  props.add(binders);

  const glowRing = uniqueGlow(materials, 1.3, 1.55);
  props.add(glowRing);

  const underLight = new THREE.PointLight(0x38bdf8, 1.1, 4.2, 2);
  underLight.position.y = 0.4;
  const veil = createVeil(1.55);
  root.add(platform, actors, props, underLight, veil);

  const hitTarget = createHitDisk(1.5);
  hitTarget.userData.forceId = id;
  root.add(hitTarget);

  return { id, root, platform, actors, props, hitTarget, glowRing, underLight, veil, storyNodes };
}

function buildLiderazgoBundle(materials: SystemSharedMaterials): ForcePlatformBundle {
  const id: ForceId = 'liderazgo';
  const root = new THREE.Group();
  root.name = id;
  const pos = FORCE_PLATFORM_POSITIONS[id];
  root.position.set(pos.x, pos.y, pos.z);

  const platform = circularPlatform(1.48, 0.3, materials.platformBody, materials.platformEdge, materials.platformGlow);
  const actors = new THREE.Group();
  const props = new THREE.Group();
  const storyNodes: Record<string, THREE.Object3D> = {};

  const desk = createDesk(materials.propDark);
  desk.position.set(0, 0, 0.1);
  props.add(desk);

  const leader = createStylizedHuman({
    materials,
    clothing: materials.clothingLeader,
    pose: 'sitting',
    scale: 1.2,
    headgear: 'none',
  });
  leader.position.set(0.35, 0.28, 0.15);
  leader.rotation.y = -0.7;
  actors.add(leader);
  storyNodes.leader = leader;

  const teammate = createStylizedHuman({
    materials,
    clothing: materials.clothingA,
    pose: 'sitting',
    scale: 1.14,
    vest: true,
    headgear: 'cap',
  });
  teammate.position.set(-0.35, 0.28, 0.12);
  teammate.rotation.y = 0.55;
  actors.add(teammate);
  storyNodes.teammate = teammate;

  const priorities = createTablet(materials.propScreen, materials.propDark);
  priorities.position.set(0.05, 0.5, 0.2);
  priorities.rotation.x = -0.7;
  priorities.scale.set(1.2, 1, 1.1);
  props.add(priorities);
  storyNodes.priorities = priorities;

  const checkA = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), materials.accentEmissive);
  checkA.position.set(0.18, 0.72, 0.35);
  checkA.visible = false;
  checkA.scale.setScalar(0.001);
  const checkB = checkA.clone();
  checkB.position.x = 0.3;
  props.add(checkA, checkB);
  storyNodes.checkA = checkA;
  storyNodes.checkB = checkB;

  const glowRing = uniqueGlow(materials, 1.3, 1.55);
  props.add(glowRing);

  const underLight = new THREE.PointLight(0x38bdf8, 1.1, 4.2, 2);
  underLight.position.y = 0.4;
  const veil = createVeil(1.55);
  root.add(platform, actors, props, underLight, veil);

  const hitTarget = createHitDisk(1.5);
  hitTarget.userData.forceId = id;
  root.add(hitTarget);

  return { id, root, platform, actors, props, hitTarget, glowRing, underLight, veil, storyNodes };
}

function buildMejoraBundle(materials: SystemSharedMaterials): ForcePlatformBundle {
  const id: ForceId = 'mejora';
  const root = new THREE.Group();
  root.name = id;
  const pos = FORCE_PLATFORM_POSITIONS[id];
  root.position.set(pos.x, pos.y, pos.z);

  const platform = circularPlatform(1.48, 0.3, materials.platformBody, materials.platformEdge, materials.platformGlow);
  const actors = new THREE.Group();
  const props = new THREE.Group();
  const storyNodes: Record<string, THREE.Object3D> = {};

  const board = createChartBoard(materials.propDark, materials.propScreen, materials.accentEmissive);
  board.position.set(0.15, 0.28, -0.35);
  props.add(board);
  storyNodes.board = board;

  const analyst = createStylizedHuman({
    materials,
    clothing: materials.clothingA,
    pose: 'sitting',
    scale: 1.14,
    headgear: 'none',
  });
  analyst.position.set(-0.35, 0.28, 0.2);
  analyst.rotation.y = 0.4;
  actors.add(analyst);
  storyNodes.analyst = analyst;

  const collaborator = createStylizedHuman({
    materials,
    clothing: materials.clothingB,
    pose: 'pointing',
    scale: 1.18,
    vest: true,
    headgear: 'hardhat',
  });
  collaborator.position.set(0.45, 0.28, 0.25);
  collaborator.rotation.y = -0.85;
  actors.add(collaborator);
  storyNodes.collaborator = collaborator;

  const deviation = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), materials.warning);
  deviation.position.set(0.35, 1.15, -0.2);
  deviation.visible = false;
  deviation.scale.setScalar(0.001);
  props.add(deviation);
  storyNodes.deviation = deviation;

  const hypothesis = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.03, 8, 16),
    materials.accentEmissive
  );
  hypothesis.position.set(-0.1, 1.25, 0.05);
  hypothesis.rotation.x = Math.PI / 2;
  hypothesis.visible = false;
  hypothesis.scale.setScalar(0.001);
  props.add(hypothesis);
  storyNodes.hypothesis = hypothesis;

  const proposal = new THREE.Mesh(
    new THREE.ConeGeometry(0.09, 0.22, 8),
    materials.accentEmissive
  );
  proposal.position.set(0.55, 0.95, 0.15);
  proposal.rotation.z = -Math.PI / 2;
  proposal.visible = false;
  proposal.scale.setScalar(0.001);
  props.add(proposal);
  storyNodes.proposal = proposal;

  const glowRing = uniqueGlow(materials, 1.3, 1.55);
  props.add(glowRing);

  const underLight = new THREE.PointLight(0x38bdf8, 1.1, 4.2, 2);
  underLight.position.y = 0.4;
  const veil = createVeil(1.55);
  root.add(platform, actors, props, underLight, veil);

  const hitTarget = createHitDisk(1.5);
  hitTarget.userData.forceId = id;
  root.add(hitTarget);

  return { id, root, platform, actors, props, hitTarget, glowRing, underLight, veil, storyNodes };
}

/** Flecha neón entre hubs (ciclo horario) o radio fino hacia el centro. */
function createConnectionBeam(
  from: THREE.Vector3,
  to: THREE.Vector3,
  material: THREE.MeshStandardMaterial,
  style: 'arrow' | 'spoke' = 'spoke'
): THREE.Mesh {
  const start = from.clone().lerp(to, style === 'arrow' ? 0.18 : 0.12);
  const end = from.clone().lerp(to, style === 'arrow' ? 0.82 : 0.88);
  if (style === 'arrow') {
    const bulge = start.clone().add(end).multiplyScalar(0.5);
    bulge.y = 0;
    if (bulge.lengthSq() > 0.01) bulge.setLength(0.35);
    start.add(bulge);
    end.add(bulge);
  }

  const dir = new THREE.Vector3().subVectors(end, start);
  const length = Math.max(dir.length(), 0.2);
  const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const mat = material.clone();
  mat.transparent = true;
  mat.opacity = style === 'arrow' ? 0.72 : 0.22;
  mat.emissiveIntensity = style === 'arrow' ? 0.85 : 0.28;

  const radius = style === 'arrow' ? 0.055 : 0.028;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 12), mat);
  shaft.position.copy(midPoint);
  shaft.position.y += 0.48;
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  shaft.userData.baseOpacity = mat.opacity;
  shaft.userData.connectionStyle = style;

  if (style === 'arrow') {
    const tipMat = mat.clone();
    tipMat.opacity = 0.92;
    tipMat.emissiveIntensity = 1.05;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 12), tipMat);
    tip.position.y = length * 0.5;
    tip.userData.syncOpacity = true;
    shaft.add(tip);
  }

  return shaft;
}

function buildWarehouseAtmosphere(accentHex: number): THREE.Group {
  const ambientProps = new THREE.Group();
  ambientProps.name = 'warehouse-atmosphere';

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(9.2, 64),
    new THREE.MeshStandardMaterial({
      color: 0x0a0f18,
      roughness: 0.94,
      metalness: 0.06,
      transparent: true,
      opacity: 0.68,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  ambientProps.add(floor);

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 12),
    new THREE.MeshStandardMaterial({
      color: 0x1c140f,
      roughness: 1,
      metalness: 0,
      emissive: 0x3a2212,
      emissiveIntensity: 0.28,
    })
  );
  backdrop.position.set(0, 4.8, -12);
  ambientProps.add(backdrop);

  const sideL = backdrop.clone();
  sideL.position.set(-14, 4.5, -4);
  sideL.rotation.y = Math.PI / 2.4;
  ambientProps.add(sideL);
  const sideR = backdrop.clone();
  sideR.position.set(14, 4.5, -4);
  sideR.rotation.y = -Math.PI / 2.4;
  ambientProps.add(sideR);

  const warmMat = new THREE.MeshBasicMaterial({ color: 0xff8a3c });
  for (let i = 0; i < 7; i++) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), warmMat);
    lamp.position.set(-9 + i * 3, 7.2, -11.5);
    ambientProps.add(lamp);
    const glow = new THREE.PointLight(0xff7a2e, 0.55, 14, 2);
    glow.position.copy(lamp.position);
    ambientProps.add(glow);
  }

  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x243044,
    metalness: 0.35,
    roughness: 0.7,
  });
  // Pilares solo al fondo para no tapar las plataformas del ciclo.
  for (let i = 0; i < 4; i++) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 7.2, 0.28), pillarMat);
    pillar.position.set(-7.5 + i * 5, 3.5, -9.5);
    ambientProps.add(pillar);
  }

  const haze = new THREE.Mesh(
    new THREE.RingGeometry(5.8, 9.5, 64),
    new THREE.MeshBasicMaterial({
      color: accentHex,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  haze.rotation.x = -Math.PI / 2;
  haze.position.y = 0.04;
  ambientProps.add(haze);

  return ambientProps;
}

export function buildSystemGeometryWorld(accentHex: number): {
  world: SystemGeometryWorld;
  materials: SystemSharedMaterials;
} {
  const materials = createSystemSharedMaterials(accentHex);
  const root = new THREE.Group();
  root.name = 'system3d-world';

  const center = buildCenterBundle(materials);
  const forces: Record<ForceId, ForcePlatformBundle> = {
    personas: buildPersonasBundle(materials),
    procesos: buildProcesosBundle(materials),
    liderazgo: buildLiderazgoBundle(materials),
    mejora: buildMejoraBundle(materials),
  };

  root.add(center.root);
  (Object.keys(forces) as ForceId[]).forEach((id) => root.add(forces[id].root));

  const connections = new THREE.Group();
  connections.name = 'connections';
  const connectionMeshes: THREE.Mesh[] = [];

  const cyclePairs: Array<[ForceId, ForceId, string]> = [
    ['personas', 'procesos', 'personas-procesos'],
    ['procesos', 'liderazgo', 'procesos-liderazgo'],
    ['liderazgo', 'mejora', 'liderazgo-mejora'],
    ['mejora', 'personas', 'mejora-personas'],
  ];
  const spokePairs: Array<['sistema', ForceId, string]> = [
    ['sistema', 'personas', 'nexus-personas'],
    ['sistema', 'procesos', 'nexus-procesos'],
    ['sistema', 'liderazgo', 'nexus-liderazgo'],
    ['sistema', 'mejora', 'nexus-mejora'],
  ];

  const posOf = (id: ForceId | 'sistema') => {
    if (id === 'sistema') return new THREE.Vector3(0, 0.35, 0);
    const p = FORCE_PLATFORM_POSITIONS[id];
    return new THREE.Vector3(p.x, 0.35, p.z);
  };

  cyclePairs.forEach(([a, b, key]) => {
    const mesh = createConnectionBeam(posOf(a), posOf(b), materials.connection, 'arrow');
    mesh.name = key;
    mesh.userData.pair = [a, b];
    connections.add(mesh);
    connectionMeshes.push(mesh);
  });
  spokePairs.forEach(([a, b, key]) => {
    const mesh = createConnectionBeam(posOf(a), posOf(b), materials.connection, 'spoke');
    mesh.name = key;
    mesh.userData.pair = [a, b];
    connections.add(mesh);
    connectionMeshes.push(mesh);
  });
  root.add(connections);

  const ambientProps = buildWarehouseAtmosphere(accentHex);
  root.add(ambientProps);

  return {
    materials,
    world: {
      root,
      center,
      forces,
      connections,
      connectionMeshes,
      ambientProps,
    },
  };
}

export function disposeSystemMaterials(materials: SystemSharedMaterials): void {
  Object.values(materials).forEach((mat) => mat.dispose());
}

export function disposeObject3D(root: THREE.Object3D, shared?: SystemSharedMaterials): void {
  const sharedSet = shared ? new Set(Object.values(shared)) : null;
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const mat = mesh.material;
    const disposeMat = (m: THREE.Material) => {
      if (sharedSet?.has(m as never)) return;
      m.dispose();
    };
    if (Array.isArray(mat)) mat.forEach(disposeMat);
    else if (mat) disposeMat(mat);
  });
}
