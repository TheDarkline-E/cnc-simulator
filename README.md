# Digital CNC Machining Simulator & Production Digital Twin

A production-grade **CNC Machining Digital Twin** built around the user's authentic supplied CAD machine assembly (`main.STEP` / 40 solids).

Users can upload their own CAD design files (`.STEP`, `.STP`, `.STL`, `.OBJ`) or custom CNC programs (`.NC`, `.GCODE`, `.TAP`), watch the virtual machine physically execute the operations in real time with high fidelity kinematics, and inspect the machined results visually.

---

## 🚀 Key Production Capabilities

1. **CAD File Ingestion Pipeline (`CADImporter.js`)**:
   - Supports direct drag-and-drop of custom CAD design files: `.STEP`, `.STP`, `.STL`, and `.OBJ`.
   - Automated 3D bounding box calculation, volume estimation, and triangle count.
   - Built-in engineering sample parts:
     - **Pocket Block** (100 × 80 × 30 mm with central cavity)
     - **Stepped Mounting Bracket** (120 × 60 × 25 mm two-tier bracket)
     - **Flange Plate** (Ø90 × 20 mm bearing flange with center through-bore)
     - **Mold Cavity Block** (90 × 90 × 25 mm 3D hemisphere cavity)
   - One-click **Auto-Fit Raw Stock from CAD Bounds**: Automatically dimensions the raw billet with standard clamp and facing allowances.

2. **Full G-Code & M-Code Interpreter (`GCodeParser.js`)**:
   - Comprehensive CNC modal state machine supporting:
     - `G0` / `G00`: Rapid positioning
     - `G1` / `G01`: Linear cutting feed with variable feedrate `F`
     - `G2` / `G02` & `G3` / `G03`: Circular arc interpolation (both `IJK` center offset and `R` radius formats; supports `G17` XY, `G18` XZ, `G19` YZ planes)
     - `G20` (Inches auto-converted to mm) & `G21` (Metric)
     - `G90` (Absolute) & `G91` (Incremental) positioning
     - `G90.1` & `G91.1` Arc distance modes
     - `G54` - `G59`: Work Coordinate Systems
     - `G80`, `G81`, `G82`, `G83`: Canned drilling and peck drilling cycles
     - `M3` / `M4` / `M5`: Spindle start CW/CCW and stop
     - `M6`: Tool change command
     - `M8` / `M9`: Coolant flood control
     - `M0` / `M1` / `M2` / `M30`: Program end & rewind
   - Discretizes circular arcs with sub-millimeter chordal error tolerance for ultra-smooth 3D paths.
   - Computes total cutting distance, rapid traverse, cycle time, and bounding envelope.

3. **Intelligent CAM Toolpath Generator (`CAMEngine.js`)**:
   - Automatically converts uploaded CAD models or geometry specs into multi-operation CNC programs:
     - **Top Facing Pass**: Surfaces raw stock down to workpiece Z=0.
     - **3D Adaptive Roughing**: Multi-level Z-level area clearing.
     - **Cavity Pocketing**: Outward spiral clearing with perimeter finish.
     - **Profile Contouring**: Outer wall finishing with climb milling offset.
     - **3D Surface Scallop Finishing**: High-density parallel passes for complex topologies.
   - Emits clean, standardized G-Code with line numbers, comments, and feed/speed parameters.

4. **Dynamic 3D Material Removal Engine (`MaterialRemoval.js`)**:
   - High-resolution 160 × 120 heightfield grid with sub-millimeter precision.
   - Simulates tool swept volume subtraction for flat end mills and ball nose cutters.
   - Real-time excavated volume calculation (`mm³` and `cm³` of chips removed).
   - Material-specific PBR shading (Aluminum 6061, Brass 360, Delrin, Mild Steel, Stainless 304).

5. **Physically Grounded Kinematics & Realistic Machine Visuals**:
   - `X-Axis`: Gantry moves across transverse bridge (span: 300 mm, -150 to +150 mm).
   - `Y-Axis`: Precision table translates forward/backward (span: 200 mm, -100 to +100 mm).
   - `Z-Axis`: Spindle collet and cutting tool plunge vertically (span: 120 mm, -70 to +50 mm).
   - Live spindle rotation synchronized with active machining state.
   - **Dynamic Milling Swarf & Chip Spray Particles**: Emits hot chips/particles as the rotating tool cuts into raw stock.
   - Exact line-by-line synchronized G-Code highlighting during playback.

6. **Inspection & Reporting (`InspectionModal.jsx`)**:
   - Post-machining verification modal with toolpath metrics, pass counts, and cycle time.
   - Export downloadable `.nc` G-Code programs and text machining inspection reports.

---

## 🛠️ How to Run Locally

```bash
cd "c:\Users\ebee6\.gemini\antigravity-ide\scratch\cnc-simulator"
npm run dev
```

Open **`http://localhost:3000`** in your browser.
