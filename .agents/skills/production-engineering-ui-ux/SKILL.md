---
name: production-engineering-ui-ux
description: >-
  Strict Figma-grade design standard for creating world-class, production-grade
  modern CAD/CAM and digital twin web applications. Combines elite Figma product design
  principles (Linear, Spline, Shapr3D, Apple Pro Apps) with authentic CNC and engineering
  controls. Enforces elegant multi-pane card layouts, refined typography, harmonious palettes,
  smooth micro-animations, and domain-accurate telemetry.
---

# Figma-Grade Production Software UI/UX Standard

> **Core Philosophy:** World-class production software balances high visual elegance
> (proportional whitespace, refined typography, subtle shadows, cohesive color tokens)
> with authentic engineering depth and domain precision. It never looks like an ugly,
> boxy 1990s retro terminal, nor like a generic, unpolished AI mockup.

---

## 1. Design System & Figma Token Principles

### 1.1 Architecture & Canvas Structure
- **Master Application Frame:** Floating, proportional application workspace (`max-width: 1440px`, `max-height: 940px`, or responsive full-screen container) resting on an ambient designer surface (`#f0f2f6` light / `#0c0e14` dark).
- **Proportional 3-Column Layout:**
  1. **Left (260px):** Brand identity, segmented navigation, workpiece alloy badges, and digital CAM pipeline.
  2. **Center (Flex 1):** Hero 3D CAD/CAM Viewport Card with floating frosted-glass toolbars, camera capsule switchers, and unobtrusive controls.
  3. **Right (340px):** Precision CNC Telemetry, Machine Profile, live DRO ($X, Y, Z$ coordinates), Cutter velocity & torque dynamics, and Machining Passes Gantt timeline.

### 1.2 Color & Contrast System
- **Signature Accent:** Refined Indigo / Royal Violet (`#6d4be2` / `#7c5cfc`) paired with crisp white text and subtle alpha glows (`rgba(109, 75, 226, 0.25)`).
- **Light Studio Palette:**
  - Background Desktop: `#f1f3f6`
  - Background App Canvas: `#ffffff`
  - Inner Card Background: `#f8f9fc`
  - Hairline Borders: `#eef1f6` / `#e2e8f0`
  - Text: Deep Charcoal `#14171a` (main), Slate `#657786` (sub), Ash `#94a3b8` (muted).
- **Dark Studio Palette:**
  - Background Desktop: `#0a0c10`
  - Background App Canvas: `#12151f`
  - Inner Card Background: `#181c2b`
  - Hairline Borders: `#222738`
  - Text: Pristine `#f8fafc` (main), Silver `#94a3b8` (sub).

### 1.3 Typography Hierarchy
- **Primary Interface Font:** `Inter` / `-apple-system` with strict optical kerning:
  - Display / Title: 16–17px, Weight 600, letter-spacing: `-0.3px`
  - Section Headings: 13–14px, Weight 600, letter-spacing: `-0.1px`
  - Body & Labels: 11–12px, Weight 500, letter-spacing: `0`
  - Micro-metadata: 10px, Weight 400–500, letter-spacing: `0.02em`
- **Numerical & Coordinates Font:** `JetBrains Mono` with `font-variant-numeric: tabular-nums; font-feature-settings: 'tnum' 1;`. Zero jitter during 60 FPS animation.

### 1.4 Interactive Elements & Micro-Animations
- **Capsule Switchers:** Segmented pill groups (`border-radius: 9999px`) with smooth sliding active pill highlights.
- **Floating Glass Widgets:** Frosted glass badges (`backdrop-filter: blur(20px)`, `border: 1px solid rgba(255, 255, 255, 0.6)`).
- **Tactile Hover/Active Feedback:** Buttons scale smoothly to `0.98` on active press with soft elevation shadows.
