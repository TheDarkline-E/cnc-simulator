import { GCodeParser } from './GCodeParser.js';

/**
 * CAMEngine.js
 * Intelligent Computer-Aided Manufacturing (CAM) Toolpath Generator.
 * Converts 3D CAD models and geometry specifications into multi-operation
 * CNC milling toolpaths and standardized G-Code.
 * 
 * Operations:
 * 1. Facing: Top raw stock surfacing pass
 * 2. 3D Roughing: Multi-layer Z-level area clearing
 * 3. Cavity Pocketing: Inward concentric spiral pocketing
 * 4. Wall Contouring: Outer profile finishing with smooth lead-ins
 * 5. 3D Surface Finishing: High-density raster finish for 3D topologies
 * 6. Hole Drilling: Circular pocketing or peck drilling
 */

export class CAMEngine {
  constructor() {
    this.parser = new GCodeParser();
  }

  /**
   * Generates a complete CAM machining program.
   * @param {Object} params
   * @param {Object} params.stock - { width, length, height, material }
   * @param {Object} params.tool - { diameter, flutes, type }
   * @param {Array} params.operations - List of operations
   * @param {Object} params.parameters - { spindleRPM, feedRate, plungeRate, stepDown, stepOverRatio, safeZ }
   * @param {Object} params.cadStats - Optional CAD model geometry analysis
   * @returns {Object} { gcodeText, toolpathData }
   */
  generateProgram({ stock, tool, operations, parameters, cadStats }) {
    const lines = [];
    let n = 10;
    const add = (cmd, comment = '') => {
      lines.push(`N${n} ${cmd}${comment ? ` ; ${comment}` : ''}`);
      n += 10;
    };

    const toolDia = tool?.diameter || 6.0;
    const toolRadius = toolDia / 2.0;
    const feedCut = parameters?.feedRate || 800;
    const feedPlunge = parameters?.plungeRate || 250;
    const rpm = parameters?.spindleRPM || 8000;
    const stepDown = parameters?.stepDown || 2.0;
    const stepOver = toolDia * (parameters?.stepOverRatio || 0.6);
    const safeZ = parameters?.safeZ || 5.0;
    const rapidZ = 20.0;

    const stockW = stock?.width || 100;
    const stockL = stock?.length || 80;
    const stockH = stock?.height || 30;
    const halfX = stockW / 2.0;
    const halfY = stockL / 2.0;

    // Header G-Code
    add('(=================================================)');
    add(`(PROGRAM: CNC DIGITAL TWIN MASTER CAM PROGRAM)`);
    add(`(STOCK SIZE: ${stockW} x ${stockL} x ${stockH} mm)`);
    add(`(TOOL: D${toolDia}mm Flat End Mill, Flutes: ${tool?.flutes || 2})`);
    add(`(MATERIAL: ${(stock?.material || 'al6061').toUpperCase()})`);
    add('(=================================================)');
    add('G21', 'Metric units (mm)');
    add('G90', 'Absolute positioning');
    add('G17', 'XY plane selection');
    add('G54', 'Work Coordinate System 1 (Stock Top Center = X0 Y0 Z0)');
    add(`M3 S${rpm}`, 'Spindle Start Clockwise');
    add(`G0 Z${rapidZ.toFixed(2)}`, 'Rapid to safe clearance plane');

    // Run active operations
    const activeOps = (operations || []).filter(op => op.enabled);

    for (const op of activeOps) {
      add('');
      add(`(-------------------------------------------------)`);
      add(`(OP: ${op.name.toUpperCase()} - ${op.type.toUpperCase()})`);
      add(`(-------------------------------------------------)`);

      if (op.type === 'facing') {
        const targetZ = -(op.depth || 1.0);
        const yStart = -halfY - toolRadius - 2.0;
        const yEnd = halfY + toolRadius + 2.0;
        let dir = 1;

        // Rapid to starting corner
        add(`G0 X${(-halfX - toolRadius - 3.0).toFixed(2)} Y${yStart.toFixed(2)}`, 'Facing start corner');
        add(`G0 Z${safeZ.toFixed(2)}`, 'Rapid plunge to clearance');
        add(`G1 Z${targetZ.toFixed(2)} F${feedPlunge}`, 'Plunge to facing depth');

        for (let y = yStart; y <= yEnd; y += stepOver) {
          const x1 = dir > 0 ? -halfX - toolRadius - 3.0 : halfX + toolRadius + 3.0;
          const x2 = dir > 0 ? halfX + toolRadius + 3.0 : -halfX - toolRadius - 3.0;

          add(`G1 X${x1.toFixed(2)} Y${y.toFixed(2)} F${feedCut}`, 'Lead-in');
          add(`G1 X${x2.toFixed(2)} Y${y.toFixed(2)} F${feedCut}`, 'Facing cut pass');
          dir *= -1;
        }
        add(`G0 Z${safeZ.toFixed(2)}`, 'Retract to safe Z');
      }

      else if (op.type === 'pocketing') {
        const pW = Math.min(stockW - 12, op.width || 60);
        const pL = Math.min(stockL - 12, op.length || 40);
        const totalDepth = op.depth || 8.0;
        const pHalfX = pW / 2.0 - toolRadius;
        const pHalfY = pL / 2.0 - toolRadius;

        for (let z = stepDown; z <= totalDepth; z += stepDown) {
          const zDepth = -z;
          add(`(Pocket depth level: ${zDepth.toFixed(2)} mm)`);
          add(`G0 X0.00 Y0.00`, 'Center rapid');
          add(`G0 Z${safeZ.toFixed(2)}`);
          add(`G1 Z${zDepth.toFixed(2)} F${feedPlunge}`, 'Helical/Straight plunge');

          // Outward expanding concentric rectangle passes
          let curX = Math.min(stepOver, pHalfX);
          let curY = Math.min(stepOver * (pHalfY / (pHalfX || 1)), pHalfY);

          while (curX <= pHalfX && curY <= pHalfY) {
            add(`G1 X${(-curX).toFixed(2)} Y${(-curY).toFixed(2)} F${feedCut}`);
            add(`G1 X${curX.toFixed(2)} Y${(-curY).toFixed(2)} F${feedCut}`);
            add(`G1 X${curX.toFixed(2)} Y${curY.toFixed(2)} F${feedCut}`);
            add(`G1 X${(-curX).toFixed(2)} Y${curY.toFixed(2)} F${feedCut}`);
            add(`G1 X${(-curX).toFixed(2)} Y${(-curY).toFixed(2)} F${feedCut}`);
            curX += stepOver;
            curY += stepOver;
          }

          // Final wall cleanup pass at this Z level
          add(`G1 X${(-pHalfX).toFixed(2)} Y${(-pHalfY).toFixed(2)} F${feedCut}`, 'Wall finish pass');
          add(`G1 X${pHalfX.toFixed(2)} Y${(-pHalfY).toFixed(2)} F${feedCut}`);
          add(`G1 X${pHalfX.toFixed(2)} Y${pHalfY.toFixed(2)} F${feedCut}`);
          add(`G1 X${(-pHalfX).toFixed(2)} Y${pHalfY.toFixed(2)} F${feedCut}`);
          add(`G1 X${(-pHalfX).toFixed(2)} Y${(-pHalfY).toFixed(2)} F${feedCut}`);

          add(`G0 Z${safeZ.toFixed(2)}`, 'Level retract');
        }
      }

      else if (op.type === 'roughing') {
        const totalDepth = op.depth || 12.0;
        const boundX = halfX - toolRadius;
        const boundY = halfY - toolRadius;

        for (let z = stepDown; z <= totalDepth; z += stepDown) {
          const zDepth = -z;
          add(`(3D Roughing level: ${zDepth.toFixed(2)} mm)`);
          add(`G0 X${(-boundX).toFixed(2)} Y${(-boundY).toFixed(2)}`);
          add(`G0 Z${safeZ.toFixed(2)}`);
          add(`G1 Z${zDepth.toFixed(2)} F${feedPlunge}`);

          let dir = 1;
          for (let y = -boundY; y <= boundY; y += stepOver * 1.4) {
            const x1 = dir > 0 ? -boundX : boundX;
            const x2 = dir > 0 ? boundX : -boundX;
            add(`G1 X${x1.toFixed(2)} Y${y.toFixed(2)} F${feedCut}`);
            add(`G1 X${x2.toFixed(2)} Y${y.toFixed(2)} F${feedCut}`);
            dir *= -1;
          }
          add(`G0 Z${safeZ.toFixed(2)}`, 'Retract');
        }
      }

      else if (op.type === 'contouring') {
        const totalDepth = op.depth || 12.0;
        const cX = halfX + toolRadius + 0.5;
        const cY = halfY + toolRadius + 0.5;

        for (let z = stepDown; z <= totalDepth; z += stepDown) {
          const zDepth = -z;
          add(`(Profile contour level: ${zDepth.toFixed(2)} mm)`);
          add(`G0 X${(-cX).toFixed(2)} Y${(-cY).toFixed(2)}`, 'Lead-in approach');
          add(`G0 Z${safeZ.toFixed(2)}`);
          add(`G1 Z${zDepth.toFixed(2)} F${feedPlunge}`, 'Contour plunge');
          add(`G1 X${cX.toFixed(2)} Y${(-cY).toFixed(2)} F${feedCut}`, 'South edge cut');
          add(`G1 X${cX.toFixed(2)} Y${cY.toFixed(2)} F${feedCut}`, 'East edge cut');
          add(`G1 X${(-cX).toFixed(2)} Y${cY.toFixed(2)} F${feedCut}`, 'North edge cut');
          add(`G1 X${(-cX).toFixed(2)} Y${(-cY).toFixed(2)} F${feedCut}`, 'West edge cut');
          add(`G0 Z${safeZ.toFixed(2)}`, 'Retract');
        }
      }

      else if (op.type === 'finishing') {
        const finalDepth = -(op.depth || 10.0);
        add(`(High-speed 3D surface finishing pass)`);
        add(`G0 X${(-halfX).toFixed(2)} Y${(-halfY).toFixed(2)}`);
        add(`G0 Z${safeZ.toFixed(2)}`);
        add(`G1 Z${finalDepth.toFixed(2)} F${feedPlunge}`);

        let dir = 1;
        const fineStepOver = stepOver * 0.4; // Fine stepover for scallop finish
        for (let y = -halfY; y <= halfY; y += fineStepOver) {
          const x1 = dir > 0 ? -halfX : halfX;
          const x2 = dir > 0 ? halfX : -halfX;
          add(`G1 X${x2.toFixed(2)} Y${y.toFixed(2)} F${Math.round(feedCut * 1.2)}`);
          dir *= -1;
        }
        add(`G0 Z${safeZ.toFixed(2)}`);
      }
    }

    // Program End
    add('');
    add('(=================================================)');
    add('(PROGRAM TERMINATION)');
    add('(=================================================)');
    add(`G0 Z${rapidZ.toFixed(2)}`, 'Rapid to safe clearance height');
    add('M5', 'Spindle Stop');
    add('G0 X0.00 Y0.00', 'Return to X0 Y0 Work Origin');
    add('M30', 'Program End and Rewind');

    const gcodeText = lines.join('\n');
    const toolpathData = this.parser.parse(lines);

    return {
      gcodeText,
      toolpathData
    };
  }
}
