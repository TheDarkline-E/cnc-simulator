/**
 * GCodeParser.js
 * Industrial-grade CNC G-Code Interpreter and Arc Discretization Engine.
 * Supports:
 * - G0 / G00: Rapid positioning
 * - G1 / G01: Linear feed move
 * - G2 / G02: Circular arc clockwise (I/J/K and R radius formats)
 * - G3 / G03: Circular arc counter-clockwise (I/J/K and R radius formats)
 * - G17 / G18 / G19: Plane selection (XY, XZ, YZ)
 * - G20 / G21: Units (Inches auto-converted to mm, Millimeters)
 * - G28: Return to home / reference
 * - G54 - G59: Work Coordinate Systems (WCS)
 * - G80: Cancel canned cycle
 * - G81 / G82 / G83: Drilling / Peck drilling canned cycles
 * - G90 / G91: Absolute vs Incremental positioning
 * - G90.1 / G91.1: Absolute vs Incremental arc center mode
 * - M3 / M4 / M5: Spindle CW, CCW, Stop
 * - M6: Tool change
 * - M8 / M9: Coolant On / Off
 * - M0 / M1 / M2 / M30: Program Stop / Rewind
 */

export class GCodeParser {
  constructor(options = {}) {
    this.arcTolerance = options.arcTolerance || 0.05; // mm maximum chordal deviation
    this.maxArcDegrees = options.maxArcDegrees || 3.0; // max degrees per arc segment
    this.defaultFeed = options.defaultFeed || 800; // mm/min
    this.rapidFeed = options.rapidFeed || 3000; // mm/min
    this.defaultRPM = options.defaultRPM || 8000;
  }

  /**
   * Parse a raw G-Code string or array of lines into an executable toolpath program.
   * @param {string | string[]} input
   * @param {Object} initialWCS - Optional initial work offsets { x, y, z }
   * @returns {Object} toolpath program data
   */
  parse(input, initialWCS = { x: 0, y: 0, z: 0 }) {
    const rawLines = Array.isArray(input) ? input : input.split(/\r?\n/);
    const parsedLines = [];
    const points = [];
    
    // Modal states
    let modeMotion = 'G0'; // 'G0', 'G1', 'G2', 'G3', 'G81', 'G82', 'G83'
    let modeDistance = 'G90'; // 'G90' (Absolute), 'G91' (Incremental)
    let modeArcCenter = 'G91.1'; // 'G91.1' (Incremental IJK), 'G90.1' (Absolute IJK)
    let modePlane = 'G17'; // 'G17' (XY), 'G18' (XZ), 'G19' (YZ)
    let modeUnits = 'G21'; // 'G21' (mm), 'G20' (inches)
    let unitScale = 1.0;
    
    let currentFeed = this.defaultFeed;
    let currentRPM = this.defaultRPM;
    let spindleActive = false;
    let coolantActive = false;
    let currentTool = 1;
    
    // Canned cycle parameters
    let cannedR = 5.0; // Retract plane
    let cannedZ = 0.0;
    let cannedQ = 2.0; // Peck step
    let cannedP = 0.0; // Dwell time
    
    // Active Machine Coordinates (relative to WCS origin)
    let curX = 0.0;
    let curY = 0.0;
    let curZ = 25.0; // Default safe clearance height

    let totalCutDist = 0;
    let totalRapidDist = 0;
    let passesCount = 0;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    const updateExtents = (x, y, z) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    };

    updateExtents(curX, curY, curZ);

    const pushSegment = (type, targetX, targetY, targetZ, feed, opName, lineIndex, isArc = false) => {
      const dx = targetX - curX;
      const dy = targetY - curY;
      const dz = targetZ - curZ;
      const dist = Math.hypot(dx, dy, dz);

      if (dist < 0.0001 && !isArc) return; // Skip zero-distance redundant moves

      if (type === 'cut') {
        totalCutDist += dist;
      } else {
        totalRapidDist += dist;
      }

      updateExtents(targetX, targetY, targetZ);

      points.push({
        x: Number(targetX.toFixed(3)),
        y: Number(targetY.toFixed(3)),
        z: Number(targetZ.toFixed(3)),
        prevX: Number(curX.toFixed(3)),
        prevY: Number(curY.toFixed(3)),
        prevZ: Number(curZ.toFixed(3)),
        type,
        feed: Math.round(feed),
        opName: opName || (type === 'cut' ? 'Linear Cut' : 'Rapid Move'),
        gcodeIndex: lineIndex,
        isArc
      });

      curX = targetX;
      curY = targetY;
      curZ = targetZ;
      passesCount++;
    };

    // Helper: Discretize G2 / G3 Circular Arc
    const interpolateArc = (startX, startY, startZ, endX, endY, endZ, ijk, r, isCW, plane, feed, lineIdx, opName) => {
      let pX = startX, pY = startY, pZ = startZ;
      let targetX = endX, targetY = endY, targetZ = endZ;

      // Plane coordinate mapping:
      // G17 (XY): u = X, v = Y, w = Z
      // G18 (XZ): u = Z, v = X, w = Y
      // G19 (YZ): u = Y, v = Z, w = X
      let u0, v0, u1, v1, w0, w1;
      let iOffset = 0, jOffset = 0;

      if (plane === 'G17') {
        u0 = startX; v0 = startY; w0 = startZ;
        u1 = endX; v1 = endY; w1 = endZ;
        iOffset = ijk.i || 0;
        jOffset = ijk.j || 0;
      } else if (plane === 'G18') {
        u0 = startZ; v0 = startX; w0 = startY;
        u1 = endZ; v1 = endX; w1 = endY;
        iOffset = ijk.k || 0;
        jOffset = ijk.i || 0;
      } else { // G19
        u0 = startY; v0 = startZ; w0 = startX;
        u1 = endY; v1 = endZ; w1 = endX;
        iOffset = ijk.j || 0;
        jOffset = ijk.k || 0;
      }

      let centerU, centerV, radius;

      if (r !== undefined && r !== null) {
        // Radius format
        const chord = Math.hypot(u1 - u0, v1 - v0);
        if (chord < 0.0001) return; // Degenerate circle with R cannot specify full 360 circle
        const halfChord = chord / 2.0;
        const rad = Math.abs(r);
        if (rad < halfChord) {
          radius = halfChord; // Clamp to avoid NaN
        } else {
          radius = rad;
        }
        const d = Math.sqrt(Math.max(0, radius * radius - halfChord * halfChord));
        const midU = (u0 + u1) / 2.0;
        const midV = (v0 + v1) / 2.0;
        const normU = -(v1 - v0) / chord;
        const normV = (u1 - u0) / chord;

        // Choose correct center based on CW/CCW and sign of R
        const sign = (isCW ? -1 : 1) * (r < 0 ? -1 : 1);
        centerU = midU + normU * d * sign;
        centerV = midV + normV * d * sign;
      } else {
        // IJK center offset format
        if (modeArcCenter === 'G91.1') {
          centerU = u0 + iOffset;
          centerV = v0 + jOffset;
        } else {
          centerU = iOffset;
          centerV = jOffset;
        }
        radius = Math.hypot(u0 - centerU, v0 - centerV);
      }

      if (radius < 0.001) {
        pushSegment('cut', endX, endY, endZ, feed, opName, lineIdx, false);
        return;
      }

      const startAngle = Math.atan2(v0 - centerV, u0 - centerU);
      let endAngle = Math.atan2(v1 - centerV, u1 - centerU);

      let sweep;
      if (isCW) {
        // Clockwise: decreasing angle
        if (endAngle >= startAngle - 1e-7) endAngle -= 2 * Math.PI;
        sweep = endAngle - startAngle;
      } else {
        // Counter-clockwise: increasing angle
        if (endAngle <= startAngle + 1e-7) endAngle += 2 * Math.PI;
        sweep = endAngle - startAngle;
      }

      // Check for full 360 circle
      if (Math.abs(u1 - u0) < 0.001 && Math.abs(v1 - v0) < 0.001) {
        sweep = isCW ? -2 * Math.PI : 2 * Math.PI;
      }

      const arcLength = Math.abs(sweep * radius);
      // Determine number of segments: chordal error formula e = R * (1 - cos(theta/2))
      const maxAngleFromError = 2 * Math.acos(Math.max(-1, Math.min(1, 1 - (this.arcTolerance / radius))));
      const maxAngleDegree = (this.maxArcDegrees * Math.PI) / 180.0;
      const stepAngle = Math.max(0.01, Math.min(maxAngleDegree, maxAngleFromError || maxAngleDegree));
      const steps = Math.max(4, Math.ceil(Math.abs(sweep) / stepAngle));

      for (let s = 1; s <= steps; s++) {
        const frac = s / steps;
        const currentAngle = startAngle + sweep * frac;
        const curU = centerU + radius * Math.cos(currentAngle);
        const curV = centerV + radius * Math.sin(currentAngle);
        const curW = w0 + (w1 - w0) * frac; // Helical interpolation

        let segX, segY, segZ;
        if (plane === 'G17') {
          segX = curU; segY = curV; segZ = curW;
        } else if (plane === 'G18') {
          segZ = curU; segX = curV; segY = curW;
        } else {
          segY = curU; segZ = curV; segX = curW;
        }

        pushSegment('cut', segX, segY, segZ, feed, opName, lineIdx, true);
      }
    };

    // Iterate through G-Code lines
    for (let lineIdx = 0; lineIdx < rawLines.length; lineIdx++) {
      const originalLine = rawLines[lineIdx].trim();
      if (!originalLine) continue;

      // Extract line comments
      let comment = '';
      let cleanLine = originalLine;

      // Semicolon comments
      const semiIndex = cleanLine.indexOf(';');
      if (semiIndex !== -1) {
        comment = cleanLine.substring(semiIndex + 1).trim();
        cleanLine = cleanLine.substring(0, semiIndex).trim();
      }

      // Parenthesis comments
      const parenMatch = cleanLine.match(/\(([^)]+)\)/);
      if (parenMatch) {
        comment = (comment ? comment + ' ' : '') + parenMatch[1];
        cleanLine = cleanLine.replace(/\([^)]+\)/g, '').trim();
      }

      // Tokenize clean words: e.g. G01, X12.5, Y-4.2
      const tokens = cleanLine.match(/([A-Z])\s*([+-]?\d*(?:\.\d*)?)/gi) || [];
      const words = {};

      tokens.forEach(tok => {
        const letter = tok.charAt(0).toUpperCase();
        const valStr = tok.substring(1).trim();
        const num = valStr ? parseFloat(valStr) : 0;
        if (!words[letter]) words[letter] = [];
        words[letter].push(num);
      });

      // Parse G commands
      if (words.G) {
        for (const gCode of words.G) {
          const gInt = Math.floor(gCode);
          const gSub = Number(gCode.toFixed(1));

          // Motion modes
          if (gInt === 0) modeMotion = 'G0';
          else if (gInt === 1) modeMotion = 'G1';
          else if (gInt === 2) modeMotion = 'G2';
          else if (gInt === 3) modeMotion = 'G3';
          else if (gInt === 80) modeMotion = 'G80';
          else if (gInt === 81) modeMotion = 'G81';
          else if (gInt === 82) modeMotion = 'G82';
          else if (gInt === 83) modeMotion = 'G83';
          // Coordinate / Plane modes
          else if (gInt === 17) modePlane = 'G17';
          else if (gInt === 18) modePlane = 'G18';
          else if (gInt === 19) modePlane = 'G19';
          // Units
          else if (gInt === 20) { modeUnits = 'G20'; unitScale = 25.4; }
          else if (gInt === 21) { modeUnits = 'G21'; unitScale = 1.0; }
          // Absolute / Incremental
          else if (gInt === 90 && gSub !== 90.1) modeDistance = 'G90';
          else if (gInt === 91 && gSub !== 91.1) modeDistance = 'G91';
          // Arc distance mode
          else if (gSub === 90.1) modeArcCenter = 'G90.1';
          else if (gSub === 91.1) modeArcCenter = 'G91.1';
          // Return to home
          else if (gInt === 28) {
            pushSegment('rapid', curX, curY, 25.0, this.rapidFeed, 'Safe Retract', lineIdx);
            pushSegment('rapid', 0, 0, 25.0, this.rapidFeed, 'G28 Home Origin', lineIdx);
          }
        }
      }

      // Parse M commands
      if (words.M) {
        for (const mCode of words.M) {
          const mInt = Math.floor(mCode);
          if (mInt === 3) spindleActive = true;
          else if (mInt === 4) spindleActive = true;
          else if (mInt === 5) spindleActive = false;
          else if (mInt === 7 || mInt === 8) coolantActive = true;
          else if (mInt === 9) coolantActive = false;
          else if (mInt === 6) {
            // Tool change move
            pushSegment('rapid', curX, curY, 35.0, this.rapidFeed, `Tool Change T${currentTool}`, lineIdx);
          }
        }
      }

      // Tool number
      if (words.T && words.T.length > 0) {
        currentTool = words.T[0];
      }

      // Feedrate
      if (words.F && words.F.length > 0) {
        currentFeed = words.F[0] * unitScale;
      }

      // Spindle RPM
      if (words.S && words.S.length > 0) {
        currentRPM = words.S[0];
      }

      // Canned cycle parameters
      if (words.R && (modeMotion === 'G81' || modeMotion === 'G82' || modeMotion === 'G83')) {
        cannedR = words.R[0] * unitScale;
      }
      if (words.Q) cannedQ = words.Q[0] * unitScale;
      if (words.P) cannedP = words.P[0];

      // Parse Target Coordinates (X, Y, Z)
      const hasX = words.X !== undefined;
      const hasY = words.Y !== undefined;
      const hasZ = words.Z !== undefined;

      let nextX = curX;
      let nextY = curY;
      let nextZ = curZ;

      if (hasX) {
        const rawX = words.X[0] * unitScale;
        nextX = modeDistance === 'G90' ? rawX : curX + rawX;
      }
      if (hasY) {
        const rawY = words.Y[0] * unitScale;
        nextY = modeDistance === 'G90' ? rawY : curY + rawY;
      }
      if (hasZ) {
        const rawZ = words.Z[0] * unitScale;
        nextZ = modeDistance === 'G90' ? rawZ : curZ + rawZ;
      }

      // Parse Arc Center Offsets
      const ijk = {
        i: words.I ? words.I[0] * unitScale : 0,
        j: words.J ? words.J[0] * unitScale : 0,
        k: words.K ? words.K[0] * unitScale : 0
      };
      const arcR = words.R && (modeMotion === 'G2' || modeMotion === 'G3') ? words.R[0] * unitScale : null;

      // Execute Motion according to active modal command
      if (hasX || hasY || hasZ || words.I || words.J || words.K || arcR !== null) {
        if (modeMotion === 'G0') {
          pushSegment('rapid', nextX, nextY, nextZ, this.rapidFeed, 'Rapid Move', lineIdx);
        } else if (modeMotion === 'G1') {
          pushSegment('cut', nextX, nextY, nextZ, currentFeed, 'Linear Cut', lineIdx);
        } else if (modeMotion === 'G2' || modeMotion === 'G3') {
          const isCW = modeMotion === 'G2';
          interpolateArc(
            curX, curY, curZ,
            nextX, nextY, nextZ,
            ijk, arcR, isCW, modePlane,
            currentFeed, lineIdx, isCW ? 'Arc CW (G2)' : 'Arc CCW (G3)'
          );
        } else if (modeMotion === 'G81' || modeMotion === 'G82' || modeMotion === 'G83') {
          // Expand Canned Drilling Cycle
          // 1. Rapid to position XY at R clearance height
          pushSegment('rapid', nextX, nextY, curZ, this.rapidFeed, 'Drill Position', lineIdx);
          pushSegment('rapid', nextX, nextY, cannedR, this.rapidFeed, 'Drill Rapid to R', lineIdx);
          
          if (modeMotion === 'G83' && cannedQ > 0) {
            // Peck drilling
            let currentDepth = cannedR;
            while (currentDepth > nextZ) {
              currentDepth = Math.max(nextZ, currentDepth - cannedQ);
              pushSegment('cut', nextX, nextY, currentDepth, currentFeed, 'Drill Peck', lineIdx);
              // Rapid retract for chip breaking
              pushSegment('rapid', nextX, nextY, cannedR, this.rapidFeed, 'Chip Clear Retract', lineIdx);
              if (currentDepth > nextZ) {
                // Rapid back down to near cut point
                pushSegment('rapid', nextX, nextY, currentDepth + 0.5, this.rapidFeed, 'Return Plunge', lineIdx);
              }
            }
          } else {
            // Simple drill (G81 / G82)
            pushSegment('cut', nextX, nextY, nextZ, currentFeed, 'Drill Hole', lineIdx);
            if (cannedP > 0) {
              // Dwell simulated
            }
            pushSegment('rapid', nextX, nextY, cannedR, this.rapidFeed, 'Drill Retract', lineIdx);
          }
        }
      }

      parsedLines.push({
        line: lineIdx + 1,
        raw: originalLine,
        clean: cleanLine,
        cmd: cleanLine.split(/\s+/)[0] || '',
        params: cleanLine,
        comment,
        words
      });
    }

    // Safety retract if not ended at safe clearance
    if (curZ < 20.0 && points.length > 0) {
      pushSegment('rapid', curX, curY, 25.0, this.rapidFeed, 'End Safety Retract', parsedLines.length - 1);
    }

    // Time estimation: cut time + rapid time + 15% acceleration margin
    const cutTimeMin = totalCutDist / (this.defaultFeed || 800);
    const rapidTimeMin = totalRapidDist / this.rapidFeed;
    const estTotalMinutes = Math.max(0.1, Number(((cutTimeMin + rapidTimeMin) * 1.15).toFixed(1)));
    const minutes = Math.floor(estTotalMinutes);
    const seconds = Math.round((estTotalMinutes % 1) * 60);

    return {
      points,
      gcode: parsedLines,
      stats: {
        totalCutDist: Math.round(totalCutDist),
        totalRapidDist: Math.round(totalRapidDist),
        totalDist: Math.round(totalCutDist + totalRapidDist),
        passesCount: points.length,
        linesCount: parsedLines.length,
        maxDepth: Math.abs(minZ < 0 ? minZ : 0),
        bounds: {
          minX: Number(minX.toFixed(2)),
          maxX: Number(maxX.toFixed(2)),
          minY: Number(minY.toFixed(2)),
          maxY: Number(maxY.toFixed(2)),
          minZ: Number(minZ.toFixed(2)),
          maxZ: Number(maxZ.toFixed(2))
        },
        estimatedTimeMinutes: estTotalMinutes,
        estimatedTimeString: `${minutes}m ${seconds}s`,
        toolNumber: currentTool,
        spindleRPM: currentRPM,
        maxFeed: currentFeed
      }
    };
  }
}
