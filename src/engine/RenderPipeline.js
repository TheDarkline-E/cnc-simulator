import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

/**
 * Custom Cinematic Grading & Subtle Vignette Shader
 */
const CinematicVignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    vignetteOffset: { value: 1.0 },
    vignetteDarkness: { value: 0.65 },
    contrast: { value: 1.05 },
    saturation: { value: 1.06 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float vignetteOffset;
    uniform float vignetteDarkness;
    uniform float contrast;
    uniform float saturation;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      
      // Industrial contrast curve
      color.rgb = (color.rgb - 0.5) * contrast + 0.5;

      // Vibrancy / saturation
      float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
      color.rgb = mix(vec3(luma), color.rgb, saturation);

      // Subtle spherical vignette
      vec2 uv = (vUv - vec2(0.5)) * vec2(vignetteOffset);
      float dist = length(uv);
      float vig = clamp(1.0 - dist * dist * vignetteDarkness * 0.45, 0.0, 1.0);
      color.rgb *= vig;

      gl_FragColor = color;
    }
  `
};

export class RenderPipeline {
  constructor(renderer, scene, camera, width, height) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.width = width;
    this.height = height;

    this.enabled = true;
    this.aoEnabled = true;
    this.bloomEnabled = true;
    this.vignetteEnabled = true;
    this.qualityTier = 'high';

    this.initComposer();
  }

  initComposer() {
    // High dynamic range render target for floating point precision bloom & specular
    const renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      samples: 4
    });

    this.composer = new EffectComposer(this.renderer, renderTarget);

    // 1. Base Render Pass
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // 2. GTAO (Ground Truth Ambient Occlusion) Pass
    try {
      this.gtaoPass = new GTAOPass(this.scene, this.camera, this.width, this.height);
      this.gtaoPass.blendIntensity = 1.35;
      this.gtaoPass.output = GTAOPass.OUTPUT.Default;
      this.composer.addPass(this.gtaoPass);
    } catch (err) {
      console.warn('GTAOPass initialization fallback:', err);
      this.gtaoPass = null;
    }

    // 3. Unreal Bloom Pass (selective specular bloom for metal gleams & LEDs)
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      0.18,   // strength (subtle refined specular glow)
      0.35,   // radius
      0.94    // threshold (only highlights above 0.94 bloom)
    );
    this.composer.addPass(this.bloomPass);

    // 4. Subtle Cinematic Contrast & Vignette
    this.vignettePass = new ShaderPass(CinematicVignetteShader);
    this.composer.addPass(this.vignettePass);

    // 5. FXAA Anti-Aliasing Pass
    this.fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = this.renderer.getPixelRatio();
    this.fxaaPass.material.uniforms['resolution'].value.x = 1 / (this.width * pixelRatio);
    this.fxaaPass.material.uniforms['resolution'].value.y = 1 / (this.height * pixelRatio);
    this.composer.addPass(this.fxaaPass);

    // 6. Output Pass (ACES Filmic tone mapping + correct sRGB color output)
    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
    if (this.composer) {
      this.composer.setSize(width, height);
    }
    const pixelRatio = this.renderer.getPixelRatio();
    if (this.fxaaPass && this.fxaaPass.material && this.fxaaPass.material.uniforms['resolution']) {
      this.fxaaPass.material.uniforms['resolution'].value.x = 1 / (width * pixelRatio);
      this.fxaaPass.material.uniforms['resolution'].value.y = 1 / (height * pixelRatio);
    }
    if (this.gtaoPass) {
      this.gtaoPass.setSize(width, height);
    }
    if (this.bloomPass) {
      this.bloomPass.setSize(width, height);
    }
  }

  setQuality(tier) {
    this.qualityTier = tier;
    if (tier === 'low') {
      this.enabled = false;
    } else if (tier === 'medium') {
      this.enabled = true;
      if (this.gtaoPass) this.gtaoPass.enabled = false;
      if (this.bloomPass) this.bloomPass.enabled = true;
      if (this.vignettePass) this.vignettePass.enabled = true;
    } else {
      // high or ultra
      this.enabled = true;
      if (this.gtaoPass) this.gtaoPass.enabled = true;
      if (this.bloomPass) this.bloomPass.enabled = true;
      if (this.vignettePass) this.vignettePass.enabled = true;
    }
  }

  setBloom(enabled, strength = 0.38) {
    this.bloomEnabled = enabled;
    if (this.bloomPass) {
      this.bloomPass.enabled = enabled;
      this.bloomPass.strength = strength;
    }
  }

  setAO(enabled, intensity = 1.35) {
    this.aoEnabled = enabled;
    if (this.gtaoPass) {
      this.gtaoPass.enabled = enabled;
      this.gtaoPass.blendIntensity = intensity;
    }
  }

  render(deltaTime) {
    if (this.enabled && this.composer) {
      try {
        this.composer.render(deltaTime);
        return;
      } catch (e) {
        console.warn('EffectComposer render fallback to standard renderer:', e);
        this.enabled = false;
      }
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.composer) {
      this.composer.renderTarget1.dispose();
      this.composer.renderTarget2.dispose();
    }
    if (this.gtaoPass) {
      this.gtaoPass.dispose();
    }
  }
}
