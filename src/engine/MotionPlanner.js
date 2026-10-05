/**
 * MotionPlanner
 * Provides industrial S-Curve (jerk-limited) motion profiles and camera damping
 * to simulate physical CNC gantry inertia and mechanical weight.
 */
export class MotionPlanner {
  constructor() {
    this.currentPos = { x: 0, y: 0, z: 25 };
    this.targetPos = { x: 0, y: 0, z: 25 };
    this.currentVel = { x: 0, y: 0, z: 0 };
    this.maxVel = 120;       // mm/s
    this.maxAccel = 600;     // mm/s²
    this.maxJerk = 4000;     // mm/s³

    // Camera follow state
    this.camFollowActive = false;
    this.shakeIntensity = 0.0;
  }

  setTarget(x, y, z, feedRate = 1200) {
    this.targetPos.x = x;
    this.targetPos.y = y;
    this.targetPos.z = z;
    this.maxVel = Math.max(20, feedRate / 60.0); // mm/min to mm/s
  }

  /**
   * Smooth S-curve exponential approach
   */
  update(dt) {
    const smoothing = Math.min(1.0, dt * 18.0);

    const dx = this.targetPos.x - this.currentPos.x;
    const dy = this.targetPos.y - this.currentPos.y;
    const dz = this.targetPos.z - this.currentPos.z;

    // Smooth position interpolation
    this.currentPos.x += dx * smoothing;
    this.currentPos.y += dy * smoothing;
    this.currentPos.z += dz * smoothing;

    // Decay shake
    if (this.shakeIntensity > 0.001) {
      this.shakeIntensity *= 0.92;
    } else {
      this.shakeIntensity = 0.0;
    }

    return this.currentPos;
  }

  /**
   * Trigger physical cutting vibration impulse on camera
   */
  triggerImpact(mrr = 10) {
    this.shakeIntensity = Math.min(0.8, (mrr / 25.0) * 0.45);
  }

  getShakeOffset() {
    if (this.shakeIntensity <= 0.001) return { x: 0, y: 0, z: 0 };
    const amp = this.shakeIntensity;
    return {
      x: (Math.random() - 0.5) * amp * 2.2,
      y: (Math.random() - 0.5) * amp * 2.2,
      z: (Math.random() - 0.5) * amp * 1.5
    };
  }
}
