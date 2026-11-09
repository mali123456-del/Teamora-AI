# TEAMORA NEURAL CORE — 3D Architecture & Design Specification

## 1. Design Overview
The **TEAMORA NEURAL CORE** is an industrial-futuristic, precision-engineered AI computing machine. Replacing conventional floating spheres, it physically visualizes the coordination between TEAMORA's centralized neural orchestrator and its 15 autonomous workforce employees.

### Visual Identity Tokens
- **Graphite Titanium Outer Shell:** `#211B2C` / `#2C2438` (metalness: `0.90`, roughness: `0.22`)
- **Illuminated Core & Emitters:** Muted Lavender (`#8B5CF6`), Electric Lime (`#C7F36B`), and Soft Coral (`#FF806E`)
- **Smoked-Glass Containment:** Semi-transparent tinted cylinder (opacity: `0.28`, double-sided transmission)
- **Pedestal & Ground Plane:** Heavy circular beveled titanium platform with radial contact shadow

---

## 2. Layered Physical Construction

### Layer A: Titanium Base Pedestal
- Heavy beveled base platform (radius: `7.2`, height: `0.45`, 48 radial segments)
- Outer Electric-Lime status track (`#C7F36B`) and inner Lavender calibration collar (`#8B5CF6`)
- Contact shadow plane with smooth radial alpha falloff to eliminate hard ground clipping

### Layer B: Central Containment Chamber & Perimeter Columns
- Smoked-glass containment cylinder (radius: `2.2`, height: `3.6`)
- 4 precision graphite columns (`#312740`) anchored at cardinal axes
- Precision-machined top and bottom crown collar collars

### Layer C: Concentric Precision Gimbal Rings
- **Alpha Ring (Electric Lime):** Outer gimbal rotating on X and Y axes
- **Beta Ring (Muted Lavender):** Middle gimbal angled at 60 degrees, counter-rotating on Y and Z axes
- **Gamma Ring (Chrome Titanium):** High-speed internal ring stabilizing core magnetic flux

### Layer D: Central Neural Processing Core
- Faceted icosahedron glowing core with procedural breathing pulse: `scale = 1 + sin(t * 2.5) * 0.045`
- 6 orbital diamond flux nodes circulating around the central emitter

### Layer E: 15 Interconnected AI Employee Nodes
Two concentric tiers to prevent visual clutter:
- **Inner Tier (Radius 4.3):** 6 Strategic Leadership & Revenue Directors:
  - Atlas (Workforce Orchestrator)
  - Echo (Customer Support Lead)
  - Vanguard (Enterprise Sales)
  - Pulse (Growth Marketing)
  - Ledger (Finance & Compliance)
  - Prism (Business Intelligence)
- **Outer Tier (Radius 6.2):** 9 Execution Specialists & Intelligence Agents:
  - Stockwell (Supply Chain & Inventory)
  - Nexus (Operations & Logistics)
  - Scout (Research & Intel)
  - Harmony (People & HR)
  - Quill (Content & Copywriting)
  - Courier (Communications & Outreach)
  - Chronos (Agile Project Management)
  - Scribe (Knowledge Vault)
  - Synapse (Event Automation)

Each node features a titanium pod platform, glowing departmental energy orb, surrounding antenna halo, vertical beacon pin, and active laser conduit connecting to the central core.

---

## 3. Hardware Optimization & Quality Modes

Optimized for **Intel HD Integrated Graphics / Core i5-4200U (8 GB RAM)**:

| Feature | ECO Mode | STANDARD Mode | HIGH Mode |
|---|---|---|---|
| **Pixel Ratio** | `1.0` (Fixed) | `Math.min(devicePixelRatio, 1.25)` | `Math.min(devicePixelRatio, 1.5)` |
| **Shadow Maps** | Disabled | 512x512 Soft PCF | 1024x1024 Soft PCF |
| **Antialiasing** | Disabled | Enabled | Enabled |
| **Power Preference** | `low-power` | `default` | `high-performance` |
| **FPS Target** | 30 FPS throttled | 60 FPS smooth | 60 FPS unconstrained |
| **Software Fallback** | Auto-detected | Manual toggle | Manual toggle |

### Resource Protection Rules
1. **Software WebGL Guard:** Automatically detects SwiftShader/llvmpipe/software renderers and locks quality mode to `ECO`.
2. **Page Visibility API:** Automatically pauses the render loop when the browser tab is hidden or minimized.
3. **Context Recovery:** Listens for `webglcontextlost` and `webglcontextrestored` to gracefully suspend and resume GPU buffers.
4. **2D Telemetry Grid Fallback:** Rendered automatically if WebGL is unsupported or encounters fatal hardware limits.

---

## 4. Interactive View Controls & HUD
- **Camera Orbit & Damping:** Smooth inertial panning and zooming bounded between `4.5` and `28` units.
- **Raycasting Target Selection:** Direct click on any agent node focuses the camera, highlights the node, and reveals the agent telemetry card.
- **Deep Navigation:** One-click "Open Workspace" button directs the user into the selected employee's interactive workspace.
