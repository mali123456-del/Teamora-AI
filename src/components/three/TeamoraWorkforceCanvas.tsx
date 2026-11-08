import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Eye, EyeOff, RotateCw, ZoomIn, ShieldCheck, Sparkles } from 'lucide-react';

interface ThreeSceneProps {
  activeAgentId?: string;
  onSelectAgent?: (agentId: string) => void;
  className?: string;
}

// Pre-allocated reusable math scratch variables outside loop (GC guard)
const _vec3 = new THREE.Vector3();
const _targetVec = new THREE.Vector3();

export const TeamoraWorkforceCanvas: React.FC<ThreeSceneProps> = ({
  activeAgentId,
  onSelectAgent,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState<number>(1);
  const [explodedView, setExplodedView] = useState<number>(0);
  const [activePreset, setActivePreset] = useState<'default' | 'core' | 'satellites' | 'top'>('default');
  const [selectedNodeName, setSelectedNodeName] = useState<string>('Neural Core Orchestrator');

  // Mutable refs to pass into the Three.js loop without re-triggering scene mount
  const paramsRef = useRef({
    rotationSpeed: 1,
    explodedView: 0,
    targetCameraPos: new THREE.Vector3(0, 7, 14),
    targetLookAt: new THREE.Vector3(0, 1.5, 0),
  });

  useEffect(() => {
    paramsRef.current.rotationSpeed = rotationSpeed;
    paramsRef.current.explodedView = explodedView;
  }, [rotationSpeed, explodedView]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Detect software WebGL guard
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // 3. Scene and Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x211b2c, 0.022);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 7, 14);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Stay above ground plane
    controls.minDistance = 4;
    controls.maxDistance = 26;
    controls.target.set(0, 1.5, 0);

    // 4. Studio Environment & Lighting
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio 3-point lighting
    // Warm directional key light
    const keyLight = new THREE.DirectionalLight(0xfff3e0, 2.4);
    keyLight.position.set(8, 14, 8);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    // Cool fill light
    const hemiLight = new THREE.HemisphereLight(0xa78bfa, 0x211b2c, 1.2);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    // Accent rim light (Electric Lime)
    const rimLight = new THREE.DirectionalLight(0xc7f36b, 1.6);
    rimLight.position.set(-8, 5, -8);
    scene.add(rimLight);

    // 5. Build Procedural Composite Models (Groups with 3-12 parts)
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // --- (A) Ground Pedestal & Contact Shadow ---
    const groundGroup = new THREE.Group();
    // Base platform (circular beveled stage)
    const stageGeo = new THREE.CylinderGeometry(6.5, 7.2, 0.35, 48);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x272033,
      metalness: 0.85,
      roughness: 0.25,
    });
    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.position.y = -0.175;
    stageMesh.receiveShadow = !isSoftwareGl;
    groundGroup.add(stageMesh);

    // Outer neon ring (Muted Lavender)
    const ringGeo = new THREE.TorusGeometry(6.6, 0.06, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.02;
    groundGroup.add(ringMesh);

    // Radial contact shadow
    const shadowGeo = new THREE.PlaneGeometry(16, 16);
    // Procedural shadow canvas texture
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext('2d')!;
    const grad = sctx.createRadialGradient(64, 64, 10, 64, 64, 64);
    grad.addColorStop(0, 'rgba(10, 6, 16, 0.7)');
    grad.addColorStop(0.6, 'rgba(15, 10, 25, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 128, 128);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.36;
    groundGroup.add(shadowMesh);
    masterGroup.add(groundGroup);

    // --- (B) Core Orchestrator (9 distinct parts) ---
    const coreGroup = new THREE.Group();
    coreGroup.position.set(0, 2.4, 0);

    // Part 1: Central Luminous Core (Glowing AI Mind)
    const innerCoreGeo = new THREE.IcosahedronGeometry(0.85, 2);
    const innerCoreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x8b5cf6,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9,
    });
    const innerCoreMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    coreGroup.add(innerCoreMesh);

    // Part 2: Gyro Ring Alpha (Electric Lime accent)
    const gyro1Geo = new THREE.TorusGeometry(1.35, 0.05, 16, 64);
    const gyro1Mat = new THREE.MeshStandardMaterial({
      color: 0xc7f36b,
      metalness: 0.9,
      roughness: 0.15,
    });
    const gyro1Mesh = new THREE.Mesh(gyro1Geo, gyro1Mat);
    coreGroup.add(gyro1Mesh);

    // Part 3: Gyro Ring Beta (Muted Lavender)
    const gyro2Geo = new THREE.TorusGeometry(1.6, 0.05, 16, 64);
    const gyro2Mat = new THREE.MeshStandardMaterial({
      color: 0xa78bfa,
      metalness: 0.85,
      roughness: 0.2,
    });
    const gyro2Mesh = new THREE.Mesh(gyro2Geo, gyro2Mat);
    gyro2Mesh.rotation.x = Math.PI / 3;
    coreGroup.add(gyro2Mesh);

    // Part 4: Gyro Ring Gamma (Deep Ink)
    const gyro3Geo = new THREE.TorusGeometry(1.85, 0.06, 16, 64);
    const gyro3Mat = new THREE.MeshStandardMaterial({
      color: 0x211b2c,
      metalness: 0.95,
      roughness: 0.1,
    });
    const gyro3Mesh = new THREE.Mesh(gyro3Geo, gyro3Mat);
    gyro3Mesh.rotation.y = Math.PI / 2.5;
    coreGroup.add(gyro3Mesh);

    // Parts 5-8: Core Flux Nodes (4 diamond satellites on cardinal axes)
    const diamondGeo = new THREE.OctahedronGeometry(0.18);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0xff806e,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xff806e,
      emissiveIntensity: 0.3,
    });
    const coreDiamonds: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const dMesh = new THREE.Mesh(diamondGeo, diamondMat);
      dMesh.position.set(Math.cos(angle) * 1.5, Math.sin(angle) * 0.3, Math.sin(angle) * 1.5);
      coreGroup.add(dMesh);
      coreDiamonds.push(dMesh);
    }

    // Part 9: Central Emitter Base Pillar
    const pillarGeo = new THREE.CylinderGeometry(0.3, 0.5, 2.4, 24);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x2c2438,
      metalness: 0.7,
      roughness: 0.3,
    });
    const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
    pillarMesh.position.y = -1.2;
    coreGroup.add(pillarMesh);

    masterGroup.add(coreGroup);

    // --- (C) Departmental Agent Satellites (5 nodes, 5 distinct parts each) ---
    interface SatelliteNode {
      group: THREE.Group;
      baseRadius: number;
      angle: number;
      speed: number;
      name: string;
      agentId: string;
      color: number;
    }

    const satelliteDefs = [
      { name: 'Leadership & Workforce (Atlas)', agentId: 'workforce-manager', color: 0x8b5cf6, radius: 4.2, speed: 0.5 },
      { name: 'Customer & Support (Echo)', agentId: 'support-agent', color: 0x38bdf8, radius: 4.5, speed: 0.4 },
      { name: 'Revenue & Sales (Vanguard)', agentId: 'sales-agent', color: 0xf59e0b, radius: 4.0, speed: 0.6 },
      { name: 'Intelligence & Research (Scout)', agentId: 'research-agent', color: 0x06b6d4, radius: 4.4, speed: 0.45 },
      { name: 'Finance & Compliance (Ledger)', agentId: 'finance-agent', color: 0x10b981, radius: 4.1, speed: 0.55 },
    ];

    const satellites: SatelliteNode[] = [];

    satelliteDefs.forEach((def, index) => {
      const satGroup = new THREE.Group();
      satGroup.name = def.agentId;

      // Part 1: Floating Base Pod (Lathe/Cylinder pod)
      const podGeo = new THREE.CylinderGeometry(0.4, 0.25, 0.2, 16);
      const podMat = new THREE.MeshStandardMaterial({
        color: 0x2c2438,
        metalness: 0.8,
        roughness: 0.2,
      });
      const podMesh = new THREE.Mesh(podGeo, podMat);
      satGroup.add(podMesh);

      // Part 2: Department Energy Orb
      const orbGeo = new THREE.SphereGeometry(0.32, 24, 24);
      const orbMat = new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.color,
        emissiveIntensity: 0.6,
        metalness: 0.6,
        roughness: 0.15,
      });
      const orbMesh = new THREE.Mesh(orbGeo, orbMat);
      orbMesh.position.y = 0.35;
      satGroup.add(orbMesh);

      // Part 3: Surrounding Antenna Halo
      const haloGeo = new THREE.TorusGeometry(0.48, 0.03, 12, 32);
      const haloMat = new THREE.MeshStandardMaterial({
        color: 0xc7f36b,
        metalness: 0.9,
        roughness: 0.2,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.rotation.x = Math.PI / 2;
      haloMesh.position.y = 0.35;
      satGroup.add(haloMesh);

      // Part 4: Communication Spire Antenna
      const spireGeo = new THREE.ConeGeometry(0.04, 0.5, 8);
      const spireMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.95,
        roughness: 0.1,
      });
      const spireMesh = new THREE.Mesh(spireGeo, spireMat);
      spireMesh.position.y = 0.75;
      satGroup.add(spireMesh);

      // Part 5: Contact Ground Pillar Shadow Pin
      const pinGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.8, 8);
      const pinMat = new THREE.MeshBasicMaterial({
        color: def.color,
        transparent: true,
        opacity: 0.35,
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.y = -0.9;
      satGroup.add(pinMesh);

      const angle = (index * (Math.PI * 2)) / satelliteDefs.length;
      satGroup.position.set(Math.cos(angle) * def.radius, 1.8, Math.sin(angle) * def.radius);

      masterGroup.add(satGroup);
      satellites.push({
        group: satGroup,
        baseRadius: def.radius,
        angle,
        speed: def.speed,
        name: def.name,
        agentId: def.agentId,
        color: def.color,
      });
    });

    // --- (D) Neural Laser Conduit Lines connecting core to satellites ---
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.45,
    });
    const lineGeometries: THREE.BufferGeometry[] = [];
    satellites.forEach((sat) => {
      const points = [coreGroup.position, sat.group.position];
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      lineGeometries.push(geom);
      const line = new THREE.Line(geom, lineMat);
      masterGroup.add(line);
    });

    // 6. Raycasting for Interactive Satellite Clicking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(masterGroup.children, true);

      if (intersects.length > 0) {
        let current: THREE.Object3D | null = intersects[0].object;
        while (current && current.parent && current.parent !== masterGroup) {
          current = current.parent;
        }
        if (current && current.name) {
          const match = satellites.find((s) => s.agentId === current!.name);
          if (match) {
            setSelectedNodeName(match.name);
            onSelectAgent?.(match.agentId);
          }
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // 7. Animation Loop with Software WebGL Guard & Lossless Timing
    let frameId = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();
      const speed = paramsRef.current.rotationSpeed;
      const explode = paramsRef.current.explodedView;

      // Smooth camera transition using damp
      camera.position.x = THREE.MathUtils.damp(camera.position.x, paramsRef.current.targetCameraPos.x, 3, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, paramsRef.current.targetCameraPos.y, 3, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, paramsRef.current.targetCameraPos.z, 3, delta);

      // Rotate core gyros
      innerCoreMesh.rotation.y += delta * 0.4 * speed;
      innerCoreMesh.rotation.x += delta * 0.2 * speed;
      gyro1Mesh.rotation.z += delta * 0.8 * speed;
      gyro2Mesh.rotation.x -= delta * 0.6 * speed;
      gyro3Mesh.rotation.y += delta * 0.5 * speed;

      // Hover pulse of core diamonds
      coreDiamonds.forEach((d, i) => {
        d.position.y = Math.sin(time * 2 + i) * 0.15;
      });

      // Orbit satellites and apply exploded-view separation
      satellites.forEach((sat, i) => {
        sat.angle += delta * 0.18 * sat.speed * speed;
        const currentR = sat.baseRadius + explode * 3;
        sat.group.position.x = Math.cos(sat.angle) * currentR;
        sat.group.position.z = Math.sin(sat.angle) * currentR;
        sat.group.position.y = 1.8 + Math.sin(time * 1.5 + i) * 0.15 + explode * 1.2;

        // Rotate individual satellite antennas
        sat.group.rotation.y += delta * 0.8 * speed;

        // Update connecting laser lines
        if (lineGeometries[i]) {
          lineGeometries[i].setFromPoints([coreGroup.position, sat.group.position]);
        }
      });

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    // Start loop
    tick();

    // 8. Handle Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      if (isSoftwareGl) {
        clearTimeout(frameId);
      } else {
        cancelAnimationFrame(frameId);
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Preset camera transition helper
  const handlePreset = (preset: 'default' | 'core' | 'satellites' | 'top') => {
    setActivePreset(preset);
    if (preset === 'default') {
      paramsRef.current.targetCameraPos.set(0, 7, 14);
    } else if (preset === 'core') {
      paramsRef.current.targetCameraPos.set(0, 3, 5.5);
    } else if (preset === 'satellites') {
      paramsRef.current.targetCameraPos.set(8, 5, 8);
    } else if (preset === 'top') {
      paramsRef.current.targetCameraPos.set(0, 16, 0.5);
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Minimal Top-Left Spec / Title Badge */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-lg bg-[#211B2C]/90 text-[#F5F1E9] border border-[#382F47] shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#C7F36B]" />
          <span className="text-xs font-semibold tracking-wide uppercase font-mono">
            3D Neural Workspace
          </span>
          <span className="text-xs text-[#A78BFA] font-mono">| {selectedNodeName}</span>
        </div>
      </div>

      {/* Unified Bottom Control Dock (<= 15% viewport footprint, solid background, zero side occlusion) */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center transition-all duration-300"
        style={{ maxWidth: 'min(920px, 94vw)' }}
      >
        {/* Cinema / Zen Mode Collapse Toggle */}
        <button
          onClick={() => setControlsCollapsed(!controlsCollapsed)}
          className="mb-1.5 px-3 py-1 text-[11px] font-medium text-[#AFA8B8] hover:text-[#F5F1E9] bg-[#211B2C] border border-[#382F47] rounded-full shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          {controlsCollapsed ? (
            <>
              <Eye className="w-3.5 h-3.5 text-[#C7F36B]" />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5 text-[#AFA8B8]" />
              <span>Hide Controls (Zen Mode)</span>
            </>
          )}
        </button>

        {/* Collapsible Control Dock Panel */}
        {!controlsCollapsed && (
          <div className="bg-[#211B2C] border border-[#382F47] rounded-xl px-4 py-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-4 w-full text-xs text-[#F5F1E9]">
            {/* View Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#AFA8B8] font-mono text-[11px] uppercase mr-1">Views:</span>
              <button
                onClick={() => handlePreset('default')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activePreset === 'default'
                    ? 'bg-[#8B5CF6] text-white font-semibold'
                    : 'bg-[#2C2438] text-[#AFA8B8] hover:text-[#F5F1E9]'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => handlePreset('core')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activePreset === 'core'
                    ? 'bg-[#8B5CF6] text-white font-semibold'
                    : 'bg-[#2C2438] text-[#AFA8B8] hover:text-[#F5F1E9]'
                }`}
              >
                Core Focus
              </button>
              <button
                onClick={() => handlePreset('satellites')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activePreset === 'satellites'
                    ? 'bg-[#8B5CF6] text-white font-semibold'
                    : 'bg-[#2C2438] text-[#AFA8B8] hover:text-[#F5F1E9]'
                }`}
              >
                Orbit
              </button>
              <button
                onClick={() => handlePreset('top')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activePreset === 'top'
                    ? 'bg-[#8B5CF6] text-white font-semibold'
                    : 'bg-[#2C2438] text-[#AFA8B8] hover:text-[#F5F1E9]'
                }`}
              >
                Top Grid
              </button>
            </div>

            {/* Exploded View Slider */}
            <div className="flex items-center gap-2">
              <ZoomIn className="w-3.5 h-3.5 text-[#C7F36B]" />
              <span className="text-[#AFA8B8] font-mono text-[11px]">Exploded:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={explodedView}
                onChange={(e) => setExplodedView(parseFloat(e.target.value))}
                className="w-20 accent-[#C7F36B] cursor-pointer"
              />
              <span className="font-mono text-[10px] text-[#C7F36B] w-6">
                {Math.round(explodedView * 100)}%
              </span>
            </div>

            {/* Rotation Speed Multiplier */}
            <div className="flex items-center gap-2">
              <RotateCw className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span className="text-[#AFA8B8] font-mono text-[11px]">Orbit:</span>
              <button
                onClick={() => setRotationSpeed(rotationSpeed === 0 ? 1 : rotationSpeed === 1 ? 2 : 0)}
                className="px-2 py-0.5 rounded bg-[#2C2438] text-[#F5F1E9] hover:bg-[#382F47] font-mono text-[11px] cursor-pointer"
              >
                {rotationSpeed === 0 ? 'Paused' : `${rotationSpeed}x`}
              </button>
            </div>

            {/* Active Security & PBR status */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#AFA8B8] border-l border-[#382F47] pl-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C7F36B]" />
              <span>Studio PBR</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
