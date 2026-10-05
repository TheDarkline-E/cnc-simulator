import * as THREE from 'three';

/**
 * ProceduralTextures
 * Generates photorealistic procedural PBR textures (bump, normal, roughness, hazard maps)
 * at runtime with zero external downloads.
 */
class ProceduralTextureFactory {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Helper: create a 2D canvas with high-DPI context
   */
  createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    return { canvas, ctx };
  }

  /**
   * Simple 2D Pseudo-Random Noise generator (seeded / coherent)
   */
  noise2D(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  /**
   * Smooth Bilinear Noise
   */
  smoothNoise(x, y) {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;

    // Smoothstep
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);

    const s00 = this.noise2D(i, j);
    const s10 = this.noise2D(i + 1, j);
    const s01 = this.noise2D(i, j + 1);
    const s11 = this.noise2D(i + 1, j + 1);

    const nx0 = s00 * (1 - sx) + s10 * sx;
    const nx1 = s01 * (1 - sx) + s11 * sx;
    return nx0 * (1 - sy) + nx1 * sy;
  }

  /**
   * Fractal Brownian Motion (fBm) multi-octave noise
   */
  fbm(x, y, octaves = 4, persistence = 0.5) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.smoothNoise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    return total / maxValue;
  }

  /**
   * 1. Cast Iron Bump Map (granular sand-casting texture for heavy machine frame/base)
   */
  getCastIronBump(size = 512) {
    const key = `cast_iron_${size}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const { canvas, ctx } = this.createCanvas(size, size);
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    const scale = 24.0 / size;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Multi-scale granular noise
        const n1 = this.fbm(x * scale, y * scale, 5, 0.55);
        const n2 = this.noise2D(x * 0.4, y * 0.4) * 0.25;
        const val = Math.floor(Math.min(255, Math.max(0, (n1 * 0.8 + n2) * 255)));

        const idx = (y * size + x) * 4;
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * 2. Brushed Aluminum Normal Map (directional horizontal grain for gantry / rails)
   */
  getBrushedMetalNormal(size = 512) {
    const key = `brushed_metal_${size}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const { canvas, ctx } = this.createCanvas(size, size);
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    // Generate height buffer with high stretch in X (brush lines along X)
    const heights = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x * 0.008;
        const ny = y * 0.35; // Stretched along X
        const h = this.fbm(nx, ny, 3, 0.6) + this.noise2D(x * 0.02, y * 1.5) * 0.3;
        heights[y * size + x] = h;
      }
    }

    // Convert height to tangent-space normal map
    const bumpStrength = 2.5;
    for (let y = 0; y < size; y++) {
      const ym = (y - 1 + size) % size;
      const yp = (y + 1) % size;
      for (let x = 0; x < size; x++) {
        const xm = (x - 1 + size) % size;
        const xp = (x + 1) % size;

        const dX = (heights[y * size + xp] - heights[y * size + xm]) * bumpStrength;
        const dY = (heights[yp * size + x] - heights[ym * size + x]) * bumpStrength;

        // Normal = normalize(-dX, -dY, 1)
        const nz = 1.0;
        const len = Math.sqrt(dX * dX + dY * dY + nz * nz);
        const normX = -dX / len;
        const normY = -dY / len;
        const normZ = nz / len;

        const idx = (y * size + x) * 4;
        data[idx] = Math.floor((normX * 0.5 + 0.5) * 255);
        data[idx + 1] = Math.floor((normY * 0.5 + 0.5) * 255);
        data[idx + 2] = Math.floor((normZ * 0.5 + 0.5) * 255);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * 3. Powdercoat Bump Map (orange-peel dimpled paint finish for spindle and sheet metal)
   */
  getPowdercoatBump(size = 512) {
    const key = `powdercoat_${size}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const { canvas, ctx } = this.createCanvas(size, size);
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    const scale = 36.0 / size;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Soft orange peel noise
        const n1 = this.fbm(x * scale, y * scale, 3, 0.5);
        // Dimple modulation
        const val = Math.floor(n1 * 255);
        const idx = (y * size + x) * 4;
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * 4. Ground Steel Normal Map (ultra-fine parallel grinding passes on precision table)
   */
  getGroundSteelNormal(size = 512) {
    const key = `ground_steel_${size}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const { canvas, ctx } = this.createCanvas(size, size);
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Grinding cross-hatch at 45 degrees
        const line1 = Math.sin((x + y) * 0.8) * 0.5 + 0.5;
        const line2 = Math.sin((x - y) * 0.8) * 0.5 + 0.5;
        const micro = (this.noise2D(x * 0.2, y * 0.2) - 0.5) * 0.15;
        const blend = (line1 * 0.6 + line2 * 0.4 + micro) * 0.15;

        const nx = (line1 - line2) * 0.08;
        const ny = 0.04;
        const nz = 0.99;

        const idx = (y * size + x) * 4;
        data[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
        data[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
        data[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * 5. Polished Factory Epoxy Floor Texture
   * High-end industrial epoxy with subtle fleck specks and expansion lines
   */
  getEpoxyFloorTexture(size = 1024, isLight = false) {
    const key = `epoxy_floor_${size}_${isLight}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const { canvas, ctx } = this.createCanvas(size, size);

    // Base color
    ctx.fillStyle = isLight ? '#c8d1dc' : '#141a24';
    ctx.fillRect(0, 0, size, size);

    // Subtle concrete cloudiness
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    const baseR = isLight ? 200 : 20;
    const baseG = isLight ? 209 : 26;
    const baseB = isLight ? 220 : 36;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const noise = (this.fbm(x * 0.005, y * 0.005, 3) - 0.5) * 16;
        const speckle = Math.random() < 0.015 ? (Math.random() - 0.5) * 40 : 0;

        const r = Math.min(255, Math.max(0, baseR + noise + speckle));
        const g = Math.min(255, Math.max(0, baseG + noise + speckle));
        const b = Math.min(255, Math.max(0, baseB + noise + speckle));

        const idx = (y * size + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Expansion joint seams
    ctx.strokeStyle = isLight ? 'rgba(100, 116, 139, 0.4)' : 'rgba(15, 23, 42, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * 6. Safety Hazard Tape Texture (Yellow / Black diagonal stripes around CNC perimeter)
   */
  getHazardStripeTexture(width = 512, height = 64) {
    const key = `hazard_stripe_${width}_${height}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const { canvas, ctx } = this.createCanvas(width, height);

    // Fill safety yellow
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, width, height);

    // Diagonal black stripes
    ctx.fillStyle = '#0f172a';
    const stripeWidth = 24;
    for (let x = -height * 2; x < width + height * 2; x += stripeWidth * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth + height, height);
      ctx.lineTo(x + height, height);
      ctx.closePath();
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(4, 1);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * 7. Soft Contact Shadow Disc Texture (gives grounded machine contact with floor)
   */
  getContactShadowTexture(size = 512) {
    const key = `contact_shadow_${size}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const { canvas, ctx } = this.createCanvas(size, size);
    const center = size / 2;
    const radius = size * 0.45;

    const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.88)');
    grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.65)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * 8. Coolant Droplet Noise Map (for glass splatter in Phase 5)
   */
  getCoolantSplatterTexture(size = 512) {
    const { canvas, ctx } = this.createCanvas(size, size);
    ctx.clearRect(0, 0, size, size);

    // Draw random translucent droplets
    const count = 90;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 8 + 2;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      grad.addColorStop(0.6, 'rgba(210, 235, 255, 0.45)');
      grad.addColorStop(0.9, 'rgba(255, 255, 255, 0.9)');
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      // Drip tail for some droplets
      if (Math.random() < 0.3) {
        const dripLen = Math.random() * 25 + 10;
        ctx.strokeStyle = 'rgba(210, 235, 255, 0.35)';
        ctx.lineWidth = r * 0.35;
        ctx.beginPath();
        ctx.moveTo(x, y + r * 0.8);
        ctx.lineTo(x + (Math.random() - 0.5) * 3, y + r + dripLen);
        ctx.stroke();
      }
    }

    return new THREE.CanvasTexture(canvas);
  }
}

export const proceduralTextures = new ProceduralTextureFactory();
