import * as THREE from 'three';

/** Uniforms every outdoor material shares; the scene writes them each frame. */
export const WORLD = {
  uSnow: { value: 0 }, // 0..1 snow cover
  uWet: { value: 0 }, // 0..1 rain on surfaces
  uTime: { value: 0 },
  uWind: { value: 0.3 },
};

/**
 * Outdoor surfaces: snow settles on faces that look up, rain darkens and
 * shines them. `snow` scales how much snow this surface holds.
 */
export function weathered(material, { snow = 1, wet = 1 } = {}) {
  const local = { uSnowScale: { value: snow }, uWetScale: { value: wet } };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSnow = WORLD.uSnow;
    shader.uniforms.uWet = WORLD.uWet;
    shader.uniforms.uSnowScale = local.uSnowScale;
