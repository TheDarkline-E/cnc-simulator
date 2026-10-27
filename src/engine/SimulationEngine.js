/**
 * SimulationEngine.js
 * Controls playback timeline, tool interpolation, kinematics updates,
 * material removal triggers, and exact G-code synchronization.
 */

export class SimulationEngine {
  constructor({ kinematics, materialEngine, onUpdate, onComplete }) {
    this.kinematics = kinematics;
    this.materialEngine = materialEngine;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;

    this.toolpath = null;
    this.points = [];
    this.gcode = [];
    this.toolConfig = { diameter: 6.0, type: 'flat_end_mill' };
    this.coolantActive = true;

    this.state = 'idle'; // 'idle' | 'running' | 'paused' | 'complete'
    this.currentIndex = 0;
    this.segmentProgress = 0.0;
    this.playbackSpeed = 1.0;
    this.elapsedTimeSec = 0;

    this.lastFrameTime = performance.now();
    this.animFrameId = null;
  }

  setToolConfig(toolConfig) {
    if (toolConfig) {
      this.toolConfig = { ...this.toolConfig, ...toolConfig };
    }
  }

  setCoolant(active) {
    this.coolantActive = active;
    this.notifyUpdate();
  }

  loadToolpath(toolpathData) {
    this.toolpath = toolpathData;
    this.points = toolpathData.points || [];
    this.gcode = toolpathData.gcode || [];
    this.reset();
  }

  start() {
    if (!this.points.length) return;
    if (this.currentIndex >= this.points.length - 1 || this.state === 'complete') {
      this.reset();
    }
    this.state = 'running';
    const rpm = this.toolpath?.stats?.spindleRPM || 8000;
    this.kinematics.setSpindle(true, rpm);
    this.lastFrameTime = performance.now();
    this.tick();
  }

  pause() {
    this.state = 'paused';
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.kinematics.setSpindle(false);
    this.notifyUpdate();
  }

  resume() {
    if (this.state === 'paused') {
      this.state = 'running';
      const rpm = this.toolpath?.stats?.spindleRPM || 8000;
      this.kinematics.setSpindle(true, rpm);
      this.lastFrameTime = performance.now();
      this.tick();
    }
  }

  stop() {
    this.state = 'idle';
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.kinematics.setSpindle(false);
    this.notifyUpdate();
  }

  reset() {
    this.stop();
    this.currentIndex = 0;
    this.segmentProgress = 0.0;
    this.elapsedTimeSec = 0;
    if (this.materialEngine) {
      this.materialEngine.reset();
    }
    if (this.points.length > 0) {
      const p = this.points[0];
      this.kinematics.moveTo(p.x, p.y, p.z);
    } else {
      this.kinematics.home();
    }
    this.notifyUpdate();
  }

  setSpeed(speed) {
    this.playbackSpeed = speed;
  }

  seek(progressPercent) {
    if (!this.points.length) return;
    const targetIdx = Math.floor((progressPercent / 100) * (this.points.length - 1));
    this.currentIndex = targetIdx;
    this.segmentProgress = 0.0;

    // Fast-replay material removal up to seek point
    if (this.materialEngine) {
      this.materialEngine.reset();
      const dia = this.toolConfig?.diameter || 6.0;
      const type = this.toolConfig?.type || 'flat_end_mill';
      for (let i = 0; i <= targetIdx; i++) {
        const pt = this.points[i];
        if (pt.type === 'cut') {
          this.materialEngine.cut(pt.x, pt.y, pt.z, dia, type, pt.feed || 800);
        }
      }
    }

    const cur = this.points[this.currentIndex];
    this.kinematics.moveTo(cur.x, cur.y, cur.z);
    this.notifyUpdate();
  }

  tick = () => {
    if (this.state !== 'running') return;

    const now = performance.now();
    const dt = (now - this.lastFrameTime) / 1000.0;
    this.lastFrameTime = now;

    if (this.currentIndex >= this.points.length - 1) {
      this.state = 'complete';
      this.kinematics.setSpindle(false);
      this.notifyUpdate();
      if (this.onComplete) this.onComplete();
      return;
    }

    // Smooth continuous motion interpolation (fixes jitter/shaking)
    let remainingTime = dt;
    while (remainingTime > 0 && this.currentIndex < this.points.length - 1) {
      const curP = this.points[this.currentIndex];
      const nxtP = this.points[this.currentIndex + 1];
      const dist = Math.hypot(
        nxtP.x - curP.x,
        nxtP.y - curP.y,
        nxtP.z - curP.z
      );

      const feed = nxtP.type === 'cut' ? (nxtP.feed || 800) : 2500;
      const speedMmPerSec = Math.max(10.0, (feed / 60.0) * this.playbackSpeed * 3.0);
      const segmentDuration = dist > 0 ? (dist / speedMmPerSec) : 0.001;

      const timeLeftInSegment = (1.0 - this.segmentProgress) * segmentDuration;
      if (remainingTime >= timeLeftInSegment) {
        remainingTime -= timeLeftInSegment;
        this.currentIndex++;
        this.segmentProgress = 0.0;
        this.elapsedTimeSec += timeLeftInSegment;
      } else {
        this.segmentProgress += remainingTime / segmentDuration;
        this.elapsedTimeSec += remainingTime;
        remainingTime = 0;
      }
    }

    // Interpolate current machine coordinates smoothly
    const curP = this.points[this.currentIndex];
    const nxtP = this.points[Math.min(this.points.length - 1, this.currentIndex + 1)];
    const t = Math.max(0.0, Math.min(1.0, this.segmentProgress));

    const interpX = curP.x + (nxtP.x - curP.x) * t;
    const interpY = curP.y + (nxtP.y - curP.y) * t;
    const interpZ = curP.z + (nxtP.z - curP.z) * t;

    this.kinematics.moveTo(interpX, interpY, interpZ);

    // Perform material cutting if in a cutting move
    if (curP.type === 'cut' || nxtP.type === 'cut') {
      if (this.materialEngine) {
        const dia = this.toolConfig?.diameter || 6.0;
        const type = this.toolConfig?.type || 'flat_end_mill';
        this.materialEngine.cut(interpX, interpY, interpZ, dia, type, curP.feed || 800);
      }
    }

    this.notifyUpdate();
    this.animFrameId = requestAnimationFrame(this.tick);
  };

  notifyUpdate() {
    if (!this.onUpdate) return;
    const totalPts = Math.max(1, this.points.length);
    const progressPct = Math.round((this.currentIndex / totalPts) * 100);

    const curPt = this.points[this.currentIndex];
    // Exact G-code line synchronization
    let currentGCodeIndex = 0;
    if (curPt && curPt.gcodeIndex !== undefined) {
      currentGCodeIndex = curPt.gcodeIndex;
    } else {
      currentGCodeIndex = Math.min(
        this.gcode.length - 1,
        Math.floor((this.currentIndex / totalPts) * this.gcode.length)
      );
    }

    const activeGCodeLine = this.gcode[currentGCodeIndex] || '';
    if (typeof activeGCodeLine === 'string') {
      if (activeGCodeLine.includes('M8') || activeGCodeLine.includes('M08')) {
        this.coolantActive = true;
      } else if (activeGCodeLine.includes('M9') || activeGCodeLine.includes('M09')) {
        this.coolantActive = false;
      }
    }

    const matStats = this.materialEngine ? this.materialEngine.getProgress() : { removedPercent: 0, mrrCm3PerMin: 0 };

    this.onUpdate({
      state: this.state,
      currentIndex: this.currentIndex,
      totalPoints: totalPts,
      progressPercent: progressPct,
      currentGCodeIndex,
      activeGCode: this.gcode[currentGCodeIndex] || null,
      elapsedTimeSec: Math.floor(this.elapsedTimeSec),
      removedPercent: matStats.removedPercent,
      mrr: matStats.mrrCm3PerMin || 0,
      chipVolumeCm3: matStats.chipVolumeCm3 || 0,
      chipMassGrams: matStats.chipMassGrams || 0,
      coolantActive: this.coolantActive,
      surfaceRoughness: matStats.surfaceRoughness || { Ra: 1.6, Rz: 6.3, isoGrade: 'N7 (Standard Milled)' },
      dro: {
        ...this.kinematics.getDRO(),
        coolantActive: this.coolantActive,
        mrr: matStats.mrrCm3PerMin || 0,
        surfaceRoughness: matStats.surfaceRoughness || { Ra: 1.6, Rz: 6.3, isoGrade: 'N7 (Standard Milled)' }
      },
      currentOperation: this.points[this.currentIndex]?.opName || 'Idle'
    });
  }
}
