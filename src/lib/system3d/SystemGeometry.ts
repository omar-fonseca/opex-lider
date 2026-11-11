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

function hexRoundedPlatform(
  radius: number,
  height: number,
  bodyMat: THREE.Material,
  edgeMat: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  const sides = 6;
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.07,
    bevelSegments: 2,
  });
  geom.rotateX(-Math.PI / 2);
  geom.translate(0, height / 2, 0);

  const body = new THREE.Mesh(geom, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.92, 0.045, 8, 6),
    edgeMat
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = height + 0.02;
  group.add(rim);

  return group;
}

function createStylizedHuman(options: {
  materials: SystemSharedMaterials;
  clothing: THREE.MeshStandardMaterial;
  scale?: number;
  pose?: 'standing' | 'sitting' | 'leaning' | 'pointing';
  headgear?: 'none' | 'cap' | 'hardhat';
  vest?: boolean;
}): THREE.Group {
  const { materials, clothing } = options;
  const scale = options.scale ?? 1;
  const pose = options.pose ?? 'standing';
  const human = new THREE.Group();
  human.scale.setScalar(scale);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.36, 4, 8), clothing);
  torso.position.y = 0.74;
  torso.castShadow = true;
  human.add(torso);

  if (options.vest) {
    const vest = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.28, 0.16),
      materials.clothingB
    );
    vest.position.y = 0.78;
    human.add(vest);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 12), materials.skin);
  head.position.y = 1.16;
  head.castShadow = true;
  human.add(head);

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), eyeMat);
  eyeL.position.set(-0.045, 0.02, 0.125);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.045;
  head.add(eyeL, eyeR);

  if (options.headgear === 'hardhat') {
    const hat = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      materials.warning
    );
    hat.position.y = 0.04;
    head.add(hat);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.025, 12), materials.warning);
    brim.position.y = 0.02;
    head.add(brim);
  } else if (options.headgear === 'cap') {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.2),
      clothing
    );
    cap.position.y = 0.05;
    head.add(cap);
  }

  const hips = new THREE.Mesh(new THREE.CapsuleGeometry(0.145, 0.12, 3, 8), materials.propDark);
  hips.position.y = 0.42;
  human.add(hips);

  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.3, 3, 6), materials.propDark);
  legL.position.set(-0.08, 0.18, 0);
  human.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.08;
  human.add(legR);

  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.28, 3, 6), clothing);
  armL.position.set(-0.26, 0.8, 0);
  armL.rotation.z = 0.28;
  human.add(armL);
  const armR = armL.clone();
  armR.position.x = 0.26;
  armR.rotation.z = -0.28;
  human.add(armR);

  if (pose === 'sitting') {
    torso.position.y = 0.58;
    head.position.y = 1.0;
    hips.position.y = 0.34;
    legL.rotation.x = Math.PI / 2.15;
    legL.position.set(-0.08, 0.24, 0.16);
    legR.rotation.x = Math.PI / 2.15;
    legR.position.set(0.08, 0.24, 0.16);
    armL.rotation.x = -0.7;
    armR.rotation.x = -0.65;
  } else if (pose === 'leaning') {
    torso.rotation.x = 0.28;
    head.position.z = 0.08;
    head.rotation.x = -0.2;
    armR.rotation.x = -1.05;
    armR.rotation.z = -0.05;
  } else if (pose === 'pointing') {
    armR.rotation.x = -1.25;
    armR.rotation.z = -0.15;
    armR.position.set(0.24, 0.9, 0.1);
  }

  human.userData.armL = armL;
  human.userData.armR = armR;
  human.userData.head = head;
  human.userData.torso = torso;
  return human;
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
      color: 0x1c2433,
      metalness: 0.42,
      roughness: 0.48,
    }),
    platformEdge: new THREE.MeshStandardMaterial({
      color: accentHex,
      metalness: 0.55,
      roughness: 0.32,
      emissive: accentHex,
      emissiveIntensity: 0.22,
    }),
    platformGlow: new THREE.MeshStandardMaterial({
      color: accentHex,
      emissive: accentHex,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.55,
      metalness: 0.2,
      roughness: 0.6,
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

  const platform = hexRoundedPlatform(1.15, 0.28, materials.platformBody, materials.platformEdge);
  const actors = new THREE.Group();
  const props = new THREE.Group();

  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), materials.domeGlass);
  dome.position.y = 0.35;
  props.add(dome);

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), materials.accentEmissive);
  core.position.y = 0.55;
  props.add(core);

  const glowRing = uniqueGlow(materials, 1.05, 1.28);
  props.add(glowRing);

  const underLight = new THREE.PointLight(0x38bdf8, 1.4, 4.5, 2);
  underLight.position.y = 0.35;

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
    storyNodes: { dome, core },
  };
}

function buildPersonasBundle(materials: SystemSharedMaterials): ForcePlatformBundle {
  const id: ForceId = 'personas';
  const root = new THREE.Group();
  root.name = id;
  const pos = FORCE_PLATFORM_POSITIONS[id];
  root.position.set(pos.x, pos.y, pos.z);

  const platform = hexRoundedPlatform(1.45, 0.32, materials.platformBody, materials.platformEdge);
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
    scale: 1.05,
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
    scale: 1.02,
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
    scale: 1,
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

  const platform = hexRoundedPlatform(1.45, 0.32, materials.platformBody, materials.platformEdge);
  const actors = new THREE.Group();
  const props = new THREE.Group();
  const storyNodes: Record<string, THREE.Object3D> = {};

  const operator = createStylizedHuman({
    materials,
    clothing: materials.clothingA,
    pose: 'leaning',
    scale: 1.05,
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

  const platform = hexRoundedPlatform(1.45, 0.32, materials.platformBody, materials.platformEdge);
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
    scale: 1.08,
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
    scale: 1.02,
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

  const platform = hexRoundedPlatform(1.45, 0.32, materials.platformBody, materials.platformEdge);
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
    scale: 1.02,
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
    scale: 1.05,
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

function createConnectionBeam(
  from: THREE.Vector3,
  to: THREE.Vector3,
  material: THREE.MeshStandardMaterial
): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(to, from);
  const length = dir.length();
  const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, length, 10),
    material.clone()
  );
  mesh.position.copy(mid);
  mesh.position.y += 0.45;
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  mesh.userData.baseOpacity = 0.28;
  (mesh.material as THREE.MeshStandardMaterial).opacity = 0.28;
  (mesh.material as THREE.MeshStandardMaterial).transparent = true;
  return mesh;
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

  const pairs: Array<[ForceId | 'sistema', ForceId | 'sistema', string]> = [
    ['personas', 'procesos', 'personas-procesos'],
    ['procesos', 'liderazgo', 'procesos-liderazgo'],
    ['liderazgo', 'mejora', 'liderazgo-mejora'],
    ['mejora', 'personas', 'mejora-personas'],
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

  pairs.forEach(([a, b, key]) => {
    const mesh = createConnectionBeam(posOf(a), posOf(b), materials.connection);
    mesh.name = key;
    mesh.userData.pair = [a, b];
    connections.add(mesh);
    connectionMeshes.push(mesh);
  });
  root.add(connections);

  const ambientProps = new THREE.Group();
  // Suelo atmosférico discreto (multisectorial, no fábrica especializada)
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(8.5, 48),
    new THREE.MeshStandardMaterial({
      color: 0x0b1220,
      roughness: 0.92,
      metalness: 0.08,
      transparent: true,
      opacity: 0.55,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  ambientProps.add(floor);
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
