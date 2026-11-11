/**
 * GearGeometry.ts
 * Parametric 3D mechanical gear builder using Three.js ExtrudeGeometry,
 * machined metallic collar, recessed high-contrast core, and luminous inner ring.
 */
import * as THREE from 'three';
import type { GearMechanicalSpec } from './GearTransmission.ts';

export interface GearSharedMaterials {
  centralBodyMaterial: THREE.MeshStandardMaterial;
  secondaryBodyMaterial: THREE.MeshStandardMaterial;
  collarMaterial: THREE.MeshStandardMaterial;
  recessedCoreMaterial: THREE.MeshStandardMaterial;
}

export interface GearMeshBundle {
  spec: GearMechanicalSpec;
  rootGroup: THREE.Group;
  rotatorGroup: THREE.Group;
  gearBodyMesh: THREE.Mesh;
  collarMesh: THREE.Mesh;
  recessedCoreMesh: THREE.Mesh;
  innerGlowRingMesh: THREE.Mesh;
  innerGlowMaterial: THREE.MeshBasicMaterial;
  selectionHaloMesh: THREE.Mesh;
  selectionHaloMaterial: THREE.MeshBasicMaterial;
  hitTargetMesh: THREE.Mesh;
}

/**
 * Generates the 2D closed profile (THREE.Shape) of an external involute-style spur gear
 * where tooth 0 is centered at local polar angle 0, and valley 0 is centered at PI / Z.
 */
export function createGearToothProfileShape(spec: GearMechanicalSpec): THREE.Shape {
  const { teeth, rootRadius, pitchRadius, tipRadius, hubRadius } = spec;
  const shape = new THREE.Shape();
  const pitchAngle = (Math.PI * 2) / teeth;

  // Angular half-widths at root, pitch, and tip circles for realistic involute taper:
  // At pitch circle, tooth thickness = valley width = pitchAngle / 2 (half-angle = pitchAngle / 4)
  const halfRoot = pitchAngle * 0.31;
  const halfPitch = pitchAngle * 0.245;
  const halfTip = pitchAngle * 0.145;
  const filletHalf = pitchAngle * 0.36;

  for (let i = 0; i < teeth; i++) {
    const centerAngle = i * pitchAngle;

    const aFilletStart = centerAngle - filletHalf;
    const aRootLeft = centerAngle - halfRoot;
    const aPitchLeft = centerAngle - halfPitch;
    const aTipLeft = centerAngle - halfTip;
    const aTipRight = centerAngle + halfTip;
    const aPitchRight = centerAngle + halfPitch;
    const aRootRight = centerAngle + halfRoot;
    const aFilletEnd = centerAngle + filletHalf;

    const pFilletStartX = Math.cos(aFilletStart) * rootRadius;
    const pFilletStartY = Math.sin(aFilletStart) * rootRadius;

    if (i === 0) {
      shape.moveTo(pFilletStartX, pFilletStartY);
    } else {
      shape.lineTo(pFilletStartX, pFilletStartY);
    }

    // Root fillet -> left flank (root -> pitch -> tip)
    shape.lineTo(Math.cos(aRootLeft) * (rootRadius + 0.015), Math.sin(aRootLeft) * (rootRadius + 0.015));
    shape.lineTo(Math.cos(aPitchLeft) * pitchRadius, Math.sin(aPitchLeft) * pitchRadius);
    shape.lineTo(Math.cos(aTipLeft) * tipRadius, Math.sin(aTipLeft) * tipRadius);

    // Tooth top land (addendum arc approximation)
    const aTipMid = centerAngle;
    shape.lineTo(Math.cos(aTipMid) * (tipRadius + 0.004), Math.sin(aTipMid) * (tipRadius + 0.004));
    shape.lineTo(Math.cos(aTipRight) * tipRadius, Math.sin(aTipRight) * tipRadius);

    // Right flank (tip -> pitch -> root)
    shape.lineTo(Math.cos(aPitchRight) * pitchRadius, Math.sin(aPitchRight) * pitchRadius);
    shape.lineTo(
      Math.cos(aRootRight) * (rootRadius + 0.015),
      Math.sin(aRootRight) * (rootRadius + 0.015)
    );
    shape.lineTo(Math.cos(aFilletEnd) * rootRadius, Math.sin(aFilletEnd) * rootRadius);
  }

  shape.closePath();

  // Inner circular bore hole where the recessed core sits
  const boreHole = new THREE.Path();
  const boreRadius = hubRadius * 0.94;
  boreHole.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
  shape.holes.push(boreHole);

  return shape;
}

/**
 * Creates the extruded 3D geometry for a gear body, centered along the Z axis.
 */
export function createExtrudedGearGeometry(spec: GearMechanicalSpec): THREE.ExtrudeGeometry {
  const shape = createGearToothProfileShape(spec);
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: spec.thickness,
    bevelEnabled: true,
    bevelThickness: spec.bevelSize,
    bevelSize: spec.bevelSize * 0.9,
    bevelOffset: 0,
    bevelSegments: 2,
    curveSegments: 16,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Creates the raised metallic collar geometry that frames the recessed center hub.
 */
export function createMachinedCollarGeometry(spec: GearMechanicalSpec): THREE.ExtrudeGeometry {
  const outerRadius = spec.rootRadius * 0.93;
  const innerRadius = spec.hubRadius * 0.98;

  const collarShape = new THREE.Shape();
  collarShape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);

  const hole = new THREE.Path();
  hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  collarShape.holes.push(hole);

  const collarGeo = new THREE.ExtrudeGeometry(collarShape, {
    steps: 1,
    depth: spec.thickness + 0.05,
    bevelEnabled: true,
    bevelThickness: 0.024,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments: 48,
  });
  collarGeo.center();
  collarGeo.computeVertexNormals();
  return collarGeo;
}

/**
 * Assembles a complete 3D gear node (rotating toothed body + machined collar +
 * recessed core + luminous inner ring + invisible raycast cylinder).
 */
export function createGearMeshBundle(
  spec: GearMechanicalSpec,
  sharedMaterials: GearSharedMaterials,
  accentColorHex: number
): GearMeshBundle {
  const rootGroup = new THREE.Group();
  rootGroup.name = `gear-node-${spec.id}`;
  rootGroup.position.set(spec.centerX, spec.centerY, spec.centerZ);

  const rotatorGroup = new THREE.Group();
  rotatorGroup.name = `gear-rotator-${spec.id}`;
  rotatorGroup.rotation.z = spec.initialPhaseRad;
  rootGroup.add(rotatorGroup);

  // 1. Extruded toothed body
  const gearBodyGeo = createExtrudedGearGeometry(spec);
  const bodyMaterial = spec.isCentral
    ? sharedMaterials.centralBodyMaterial
    : sharedMaterials.secondaryBodyMaterial;
  const gearBodyMesh = new THREE.Mesh(gearBodyGeo, bodyMaterial);
  gearBodyMesh.castShadow = false;
  gearBodyMesh.receiveShadow = false;
  rotatorGroup.add(gearBodyMesh);

  // 2. Machined metallic collar around hub
  const collarGeo = createMachinedCollarGeometry(spec);
  const collarMesh = new THREE.Mesh(collarGeo, sharedMaterials.collarMaterial);
  rotatorGroup.add(collarMesh);

  // 3. Recessed dark circular hub (stationary in Z, provides high contrast for text)
  const coreGeo = new THREE.CylinderGeometry(
    spec.hubRadius * 0.97,
    spec.hubRadius * 0.97,
    spec.thickness * 0.72,
    48
  );
  coreGeo.rotateX(Math.PI / 2);
  const recessedCoreMesh = new THREE.Mesh(coreGeo, sharedMaterials.recessedCoreMaterial);
  recessedCoreMesh.position.z = -0.02;
  rootGroup.add(recessedCoreMesh);

  // 4. Luminous inner ring inside the collar wall (matching the reference image's blue glow ring)
  const torusTube = spec.isCentral ? 0.032 : 0.024;
  const innerGlowGeo = new THREE.TorusGeometry(spec.innerRingRadius, torusTube, 16, 64);
  const innerGlowMaterial = new THREE.MeshBasicMaterial({
    color: accentColorHex,
    transparent: true,
    opacity: spec.isCentral ? 0.92 : 0.78,
  });
  const innerGlowRingMesh = new THREE.Mesh(innerGlowGeo, innerGlowMaterial);
  innerGlowRingMesh.position.z = spec.thickness * 0.44;
  rootGroup.add(innerGlowRingMesh);

  // 5. Subtle outer halo ring behind the gear for hover / active / connected feedback
  const haloInner = spec.innerRingRadius * 0.88;
  const haloOuter = spec.tipRadius * 1.05;
  const haloGeo = new THREE.RingGeometry(haloInner, haloOuter, 48);
  const selectionHaloMaterial = new THREE.MeshBasicMaterial({
    color: accentColorHex,
    transparent: true,
    opacity: spec.isCentral ? 0.16 : 0.08,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const selectionHaloMesh = new THREE.Mesh(haloGeo, selectionHaloMaterial);
  selectionHaloMesh.position.z = -spec.thickness * 0.56;
  rootGroup.add(selectionHaloMesh);

  // 6. Invisible cylindrical hit target covering the full gear radius for reliable Raycasting
  const hitGeo = new THREE.CylinderGeometry(
    spec.tipRadius * 0.98,
    spec.tipRadius * 0.98,
    spec.thickness + 0.14,
    32
  );
  hitGeo.rotateX(Math.PI / 2);
  const hitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const hitTargetMesh = new THREE.Mesh(hitGeo, hitMat);
  hitTargetMesh.name = `gear-hit-${spec.id}`;
  hitTargetMesh.userData = {
    gearId: spec.id,
    gearIndex: spec.index,
    isCentral: spec.isCentral,
    label: spec.label,
  };
  rootGroup.add(hitTargetMesh);

  return {
    spec,
    rootGroup,
    rotatorGroup,
    gearBodyMesh,
    collarMesh,
    recessedCoreMesh,
    innerGlowRingMesh,
    innerGlowMaterial,
    selectionHaloMesh,
    selectionHaloMaterial,
    hitTargetMesh,
  };
}
