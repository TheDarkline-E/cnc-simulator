/**
 * ToolpathGenerator.js
 * Generates CAM toolpaths and corresponding G-code for:
 * Facing, Pocketing, Contouring, Roughing, and Finishing operations.
 */

export class ToolpathGenerator {
  constructor() {
    this.safeZ = 5.0; // mm above stock
    this.rapidZ = 15.0; // mm retract height
  }

  /**
   * Generates toolpath based on stock, tool, and operation list
   */
  generate({ stock, tool, operations, parameters }) {
    const points = []; // Array of { x, y, z, type: 'rapid'|'cut'|'entry'|'retract', feed, opName }
    const gcode = [];
    let lineNum = 10;

    const addGCode = (cmd, comment = "") => {
      const lineStr = `N${lineNum} ${cmd}${comment ? ` ; ${comment}` : ''}`;
      gcode.push({
        line: lineNum,
        raw: lineStr,
        cmd: cmd.split(' ')[0],
        params: cmd,
        comment
      });
      lineNum += 10;
    };

    // Header G-code
    addGCode("G21", "Metric units (mm)");
    addGCode("G90", "Absolute programming");
    addGCode("G17", "XY plane selection");
    addGCode("G54", "Work coordinate system 1");
    addGCode(`M3 S${parameters.spindleRPM}`, "Spindle start clockwise");
    addGCode(`G0 Z${this.rapidZ.toFixed(2)}`, "Rapid to safe clearance");

    let currentPos = { x: 0, y: 0, z: this.rapidZ };
    let totalCutDist = 0;
    let totalRapidDist = 0;
    let passesCount = 0;
    let maxCutDepth = 0;

    const toolRadius = (tool.diameter || 6.0) / 2.0;
    const stockHalfX = (stock.width || 100) / 2.0;
    const stockHalfY = (stock.length || 80) / 2.0;
    const stepDown = parameters.stepDown || 2.0;
    const stepOver = (tool.diameter || 6.0) * (parameters.stepOverRatio || 0.6);
    const feedCut = parameters.feedRate || 800;
    const feedPlunge = parameters.plungeRate || 250;

    const pushMove = (type, x, y, z, feed, opName) => {
      const dist = Math.hypot(x - currentPos.x, y - currentPos.y, z - currentPos.z);
      if (type === 'cut') totalCutDist += dist;
      else totalRapidDist += dist;

      if (z < maxCutDepth) maxCutDepth = z;

      points.push({
        x, y, z,
        prevX: currentPos.x, prevY: currentPos.y, prevZ: currentPos.z,
        type,
        feed,
        opName
      });

      const gcmd = type === 'rapid' || type === 'retract' ? 'G0' : 'G1';
      const fParam = type === 'cut' ? ` F${feed}` : '';
      addGCode(`${gcmd} X${x.toFixed(2)} Y${y.toFixed(2)} Z${z.toFixed(2)}${fParam}`, opName);

      currentPos = { x, y, z };
    };

    // Execute active operations
    for (const op of operations) {
      if (!op.enabled) continue;
      addGCode(`(--- OPERATION: ${op.type.toUpperCase()} ---)`);

      if (op.type === 'facing') {
        // Facing: Zig-zag across stock top with slight overlap
        const targetZ = -(op.depth || 1.0);
        const yStart = -stockHalfY - toolRadius;
        const yEnd = stockHalfY + toolRadius;
        let direction = 1;

        // Plunge at corner
        pushMove('rapid', -stockHalfX - toolRadius, yStart, this.safeZ, feedCut, 'Facing Rapid');
        pushMove('cut', -stockHalfX - toolRadius, yStart, targetZ, feedPlunge, 'Facing Plunge');

        for (let y = yStart; y <= yEnd; y += stepOver) {
          passesCount++;
          const x1 = direction > 0 ? -stockHalfX - toolRadius : stockHalfX + toolRadius;
          const x2 = direction > 0 ? stockHalfX + toolRadius : -stockHalfX - toolRadius;

          pushMove('cut', x1, y, targetZ, feedCut, 'Facing');
          pushMove('cut', x2, y, targetZ, feedCut, 'Facing');
          direction *= -1;
        }
        pushMove('retract', currentPos.x, currentPos.y, this.safeZ, feedCut, 'Facing Retract');
      }

      else if (op.type === 'pocketing') {
        // Pocketing: Inward rectangular spiral or raster pocket
        const pocketWidth = Math.min(stock.width - 20, op.width || 60);
        const pocketLength = Math.min(stock.length - 20, op.length || 40);
        const totalDepth = op.depth || 10.0;
        const pHalfX = pocketWidth / 2.0 - toolRadius;
        const pHalfY = pocketLength / 2.0 - toolRadius;

        for (let depth = stepDown; depth <= totalDepth; depth += stepDown) {
          passesCount++;
          const zLevel = -depth;
          // Rapid to pocket center
          pushMove('rapid', 0, 0, this.safeZ, feedCut, 'Pocket Rapid');
          pushMove('cut', 0, 0, zLevel, feedPlunge, 'Pocket Plunge');

          // Outward concentric passes
          let curX = stepOver;
          let curY = stepOver * (pHalfY / pHalfX);
          while (curX <= pHalfX && curY <= pHalfY) {
            pushMove('cut', -curX, -curY, zLevel, feedCut, 'Pocket');
            pushMove('cut', curX, -curY, zLevel, feedCut, 'Pocket');
            pushMove('cut', curX, curY, zLevel, feedCut, 'Pocket');
            pushMove('cut', -curX, curY, zLevel, feedCut, 'Pocket');
            pushMove('cut', -curX, -curY, zLevel, feedCut, 'Pocket');
            curX += stepOver;
            curY += stepOver;
          }
          // Final boundary pass
          pushMove('cut', -pHalfX, -pHalfY, zLevel, feedCut, 'Pocket Wall');
          pushMove('cut', pHalfX, -pHalfY, zLevel, feedCut, 'Pocket Wall');
          pushMove('cut', pHalfX, pHalfY, zLevel, feedCut, 'Pocket Wall');
          pushMove('cut', -pHalfX, pHalfY, zLevel, feedCut, 'Pocket Wall');
          pushMove('cut', -pHalfX, -pHalfY, zLevel, feedCut, 'Pocket Wall');
          pushMove('retract', currentPos.x, currentPos.y, this.safeZ, feedCut, 'Pocket Retract');
        }
      }

      else if (op.type === 'contouring') {
        // Contouring: Outer profile pass around workpiece
        const cHalfX = stockHalfX + toolRadius + 1.0;
        const cHalfY = stockHalfY + toolRadius + 1.0;
        const totalDepth = op.depth || 15.0;

        for (let depth = stepDown; depth <= totalDepth; depth += stepDown) {
          passesCount++;
          const zLevel = -depth;
          pushMove('rapid', -cHalfX, -cHalfY, this.safeZ, feedCut, 'Contour Rapid');
          pushMove('cut', -cHalfX, -cHalfY, zLevel, feedPlunge, 'Contour Plunge');
          pushMove('cut', cHalfX, -cHalfY, zLevel, feedCut, 'Contour Profile');
          pushMove('cut', cHalfX, cHalfY, zLevel, feedCut, 'Contour Profile');
          pushMove('cut', -cHalfX, cHalfY, zLevel, feedCut, 'Contour Profile');
          pushMove('cut', -cHalfX, -cHalfY, zLevel, feedCut, 'Contour Profile');
          pushMove('retract', -cHalfX, -cHalfY, this.safeZ, feedCut, 'Contour Retract');
        }
      }

      else if (op.type === 'roughing') {
        // Multi-level 3D area clearing
        const totalDepth = op.depth || 12.0;
        for (let depth = stepDown; depth <= totalDepth; depth += stepDown) {
          passesCount++;
          const zLevel = -depth;
          pushMove('rapid', -stockHalfX, -stockHalfY, this.safeZ, feedCut, 'Roughing Rapid');
          pushMove('cut', -stockHalfX, -stockHalfY, zLevel, feedPlunge, 'Roughing Plunge');
          let dir = 1;
          for (let y = -stockHalfY; y <= stockHalfY; y += stepOver * 1.5) {
            pushMove('cut', dir > 0 ? stockHalfX : -stockHalfX, y, zLevel, feedCut, 'Roughing Pass');
            dir *= -1;
          }
          pushMove('retract', currentPos.x, currentPos.y, this.safeZ, feedCut, 'Roughing Retract');
        }
      }

      else if (op.type === 'finishing') {
        // Fine finishing pass at low feed rate and small stepover
        const zLevel = -(op.depth || 10.0);
        passesCount++;
        pushMove('rapid', -stockHalfX, -stockHalfY, this.safeZ, feedCut, 'Finishing Rapid');
        pushMove('cut', -stockHalfX, -stockHalfY, zLevel, feedPlunge, 'Finishing Plunge');
        pushMove('cut', stockHalfX, -stockHalfY, zLevel, feedCut * 0.7, 'Finishing');
        pushMove('cut', stockHalfX, stockHalfY, zLevel, feedCut * 0.7, 'Finishing');
        pushMove('cut', -stockHalfX, stockHalfY, zLevel, feedCut * 0.7, 'Finishing');
        pushMove('cut', -stockHalfX, -stockHalfY, zLevel, feedCut * 0.7, 'Finishing');
        pushMove('retract', currentPos.x, currentPos.y, this.safeZ, feedCut, 'Finishing Retract');
      }
    }

    // Retract and stop spindle
    pushMove('retract', currentPos.x, currentPos.y, this.rapidZ, feedCut, 'Program End Retract');
    addGCode("M5", "Spindle stop");
    addGCode("G0 X0 Y0", "Return to origin");
    addGCode("M30", "Program end and rewind");

    // Estimated machining time (minutes): cut time + rapid time + 10% acceleration margin
    const cutTimeMin = (totalCutDist / feedCut);
    const rapidTimeMin = (totalRapidDist / 2500);
    const estTimeMinutes = (cutTimeMin + rapidTimeMin) * 1.15;

    return {
      points,
      gcode,
      stats: {
        totalCutDist: Math.round(totalCutDist),
        totalRapidDist: Math.round(totalRapidDist),
        totalDist: Math.round(totalCutDist + totalRapidDist),
        passesCount,
        maxDepth: Math.abs(maxCutDepth),
        estimatedTimeMinutes: Math.max(0.1, Number(estTimeMinutes.toFixed(1))),
        estimatedTimeString: `${Math.floor(estTimeMinutes)}m ${Math.round((estTimeMinutes % 1) * 60)}s`,
        operationsCount: operations.filter(o => o.enabled).length
      }
    };
  }
}
