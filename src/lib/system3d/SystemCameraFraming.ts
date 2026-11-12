/**
 * Encuadre de cámara por volumen real (Box3).
 * Evita poses fijas que recortan plataformas al cambiar el aspect del contenedor.
 */
import * as THREE from 'three';
import type { CameraFocusPose } from './SystemInteraction.ts';

export interface FramingOptions {
  /** Margen de seguridad sobre el área útil (0.06–0.08 recomendado). */
  padding?: number;
  /** Multiplicador de distancia (< 1 acerca la cámara). */
  distanceScale?: number;
  /** Dirección de la cámara hacia el objetivo (normalizada internamente). */
  viewDirection?: THREE.Vector3;
  fovDeg?: number;
  minDistance?: number;
  maxDistance?: number;
}

const DEFAULT_VIEW = new THREE.Vector3(0.18, 0.72, 0.68).normalize();

/**
 * Calcula una pose que contiene el Box3 completo dentro del frustum,
 * con margen de seguridad y respetando el aspect actual de la cámara.
 */
export function computePoseForBox3(
  box: THREE.Box3,
  aspect: number,
  options: FramingOptions = {}
): CameraFocusPose {
  const padding = options.padding ?? 0.07;
  const distanceScale = options.distanceScale ?? 1;
  const fovDeg = options.fovDeg ?? 36;
  const viewDir = (options.viewDirection ?? DEFAULT_VIEW).clone().normalize();
  const minDistance = options.minDistance ?? 4.5;
  const maxDistance = options.maxDistance ?? 28;

  if (box.isEmpty()) {
    return {
      positionX: viewDir.x * 12,
      positionY: viewDir.y * 12,
      positionZ: viewDir.z * 12,
      lookAtX: 0,
      lookAtY: 0.4,
      lookAtZ: 0,
      fov: fovDeg,
    };
  }

  const center = new THREE.Vector3();
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);
  box.getCenter(center);

  // Distancia por tan(fov/2): acerca la cámara respecto a la fórmula por seno.
  const radius = Math.max(sphere.radius, 0.8) * (1 + padding);
  const safeAspect = Math.max(0.35, aspect || 1);
  const vFov = THREE.MathUtils.degToRad(fovDeg);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * safeAspect);
  const distV = radius / Math.tan(vFov / 2);
  const distH = radius / Math.tan(hFov / 2);
  const distance = THREE.MathUtils.clamp(
    Math.max(distV, distH) * distanceScale,
    minDistance,
    maxDistance
  );

  const position = center.clone().add(viewDir.clone().multiplyScalar(distance));

  return {
    positionX: position.x,
    positionY: position.y,
    positionZ: position.z,
    lookAtX: center.x,
    lookAtY: center.y,
    lookAtZ: center.z,
    fov: fovDeg,
  };
}

export function expandBoxFromObject(
  object: THREE.Object3D,
  target = new THREE.Box3()
): THREE.Box3 {
  target.setFromObject(object);
  return target;
}

export function unionBoxes(boxes: THREE.Box3[]): THREE.Box3 {
  const out = new THREE.Box3();
  boxes.forEach((box) => {
    if (!box.isEmpty()) out.union(box);
  });
  return out;
}
