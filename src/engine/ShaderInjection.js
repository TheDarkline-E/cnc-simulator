import * as THREE from 'three';

/**
 * ShaderInjection
 * Extends Three.js MeshPhysicalMaterial shaders using onBeforeCompile to inject
 * custom vertex attributes (per-vertex roughness, metalness, AO) and anisotropic micro-machining tool mark reflections.
 */
export function injectBilletPBRShader(material) {
  material.onBeforeCompile = (shader) => {
    // 1. Inject custom vertex attributes and varyings into vertex shader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
      #include <common>
      attribute float aRoughness;
      attribute float aMetalness;
      attribute float aAO;
      attribute vec2 aCutDir;
      
      varying float vRoughness;
      varying float vMetalness;
      varying float vAO;
      varying vec2 vCutDir;
      varying vec3 vWorldPosition;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vRoughness = aRoughness;
      vMetalness = aMetalness;
      vAO = aAO;
      vCutDir = aCutDir;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      `
    );

    // 2. Inject into fragment shader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `
      #include <common>
      varying float vRoughness;
      varying float vMetalness;
      varying float vAO;
      varying vec2 vCutDir;
      varying vec3 vWorldPosition;
      `
    );

    // Modulate roughness & metalness with per-vertex attributes
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `
      #include <roughnessmap_fragment>
      // Blend base roughness with per-vertex custom cut roughness
      roughnessFactor = mix(roughnessFactor, vRoughness, step(0.001, vRoughness));
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <metalnessmap_fragment>',
      `
      #include <metalnessmap_fragment>
      metalnessFactor = mix(metalnessFactor, vMetalness, step(0.001, vMetalness));
      `
    );

    // Modulate AO and add micro-machining anisotropic specular swirl
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <aomap_fragment>',
      `
      #include <aomap_fragment>
      // Apply per-vertex pocket edge ambient occlusion
      float pocketAO = clamp(vAO, 0.25, 1.0);
      reflectedLight.indirectDiffuse *= pocketAO;
      reflectedLight.indirectSpecular *= (pocketAO * 0.5 + 0.5);

      // Micro-machining tool mark specular anisotropic shimmer
      if (length(vCutDir) > 0.05) {
        vec2 dir = normalize(vCutDir);
        vec2 perp = vec2(-dir.y, dir.x);
        float toolMark = sin(dot(vWorldPosition.xz, perp) * 35.0) * 0.04;
        roughnessFactor = clamp(roughnessFactor + toolMark, 0.04, 0.95);
      }
      `
    );
  };

  material.needsUpdate = true;
  return material;
}
