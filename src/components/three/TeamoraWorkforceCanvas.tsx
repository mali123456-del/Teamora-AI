/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TEAMORA AI — 3D NEURAL CORE WORKFORCE EXPERIENCE
 * Precision-engineered industrial-futuristic computing core with 15 real-time agent nodes,
 * transparent smoked-glass chamber, concentric gimbal rings, studio PBR lighting,
 * and adaptive ECO / STANDARD / HIGH quality modes (optimized for Intel HD Graphics & Core i5).
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { TEAMORA_AGENTS } from '../../data/agents.ts';
import { useApp } from '../../context/AppContext.tsx';
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Layers,
  Activity,
  Cpu,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Target,
  Zap,
} from 'lucide-react';

interface ThreeSceneProps {
  activeAgentId?: string;
  onSelectAgent?: (agentId: string) => void;
  className?: string;
}

export type QualityMode = 'eco' | 'standard' | 'high';

// Pre-allocated reusable math scratch variables outside loop (GC guard)
const _vec3 = new THREE.Vector3();
const _targetVec = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();

export const TeamoraWorkforceCanvas: React.FC<ThreeSceneProps> = ({
  activeAgentId,
  onSelectAgent,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setActiveTab, setSelectedAgentId, tasks } = useApp();

  // View & Simulation State
  const [qualityMode, setQualityMode] = useState<QualityMode>('standard');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [showNetwork, setShowNetwork] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [selectedAgentKey, setSelectedAgentKey] = useState<string>(activeAgentId || 'workforce-manager');
  const [controlsCollapsed, setControlsCollapsed] = useState<boolean>(false);
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);
  const [currentFps, setCurrentFps] = useState<number>(60);

  // Compute selected agent object
  const selectedAgent = useMemo(() => {
    return TEAMORA_AGENTS.find((a) => a.id === selectedAgentKey) || TEAMORA_AGENTS[0];
  }, [selectedAgentKey]);

  // Compute active task count for selected agent
  const selectedAgentActiveTasks = useMemo(() => {
    return tasks.filter((t) => t.agentId === selectedAgent.id && t.status === 'running').length;
  }, [tasks, selectedAgent.id]);

  // Mutable refs to pass into the Three.js loop without re-triggering scene mount
  const loopParamsRef = useRef({
    autoRotate: true,
    showNetwork: true,
    qualityMode: 'standard' as QualityMode,
    targetCameraPos: new THREE.Vector3(0, 7.5, 15),
    targetLookAt: new THREE.Vector3(0, 1.8, 0),
    activeNodeId: selectedAgentKey,
  });

  useEffect(() => {
    loopParamsRef.current.autoRotate = autoRotate;
    loopParamsRef.current.showNetwork = showNetwork;
    loopParamsRef.current.qualityMode = qualityMode;
    loopParamsRef.current.activeNodeId = selectedAgentKey;
  }, [autoRotate, showNetwork, qualityMode, selectedAgentKey]);

  useEffect(() => {
    if (activeAgentId) {
      setSelectedAgentKey(activeAgentId);
    }
  }, [activeAgentId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Detect software WebGL guard
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    if (isSoftwareGl) {
      setQualityMode('eco');
    }

    // 2. Renderer setup with hardware-adaptive fallbacks
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: qualityMode !== 'eco' && !isSoftwareGl,
        powerPreference: qualityMode === 'eco' ? 'low-power' : 'default',
        alpha: true,
      });
    } catch {
      setWebGlSupported(false);
      return;
    }

    const onContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('WebGL context lost. Pausing 3D Neural Core.');
    };
    const onContextRestored = () => {
      console.log('WebGL context restored.');
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    let isTabVisible = !document.hidden;
    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // Quality-based pixel ratios
    const pixelRatio = qualityMode === 'eco' ? 1.0 : qualityMode === 'standard' ? Math.min(window.devicePixelRatio, 1.25) : Math.min(window.devicePixelRatio, 1.5);
    renderer.setPixelRatio(pixelRatio);
    renderer.shadowMap.enabled = qualityMode !== 'eco' && !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Scene and Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x211b2c, 0.02);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 7.5, 15);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.04; // Keep camera above platform
    controls.minDistance = 4.5;
    controls.maxDistance = 28;
    controls.target.set(0, 1.8, 0);

    // 4. Studio Environment & Lighting (Studio PBR)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio 3-point lighting setup
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    keyLight.position.set(9, 15, 9);
    keyLight.castShadow = renderer.shadowMap.enabled;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = qualityMode === 'high' ? 1024 : 512;
      keyLight.shadow.mapSize.height = qualityMode === 'high' ? 1024 : 512;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0xa78bfa, 0x211b2c, 1.1);
    fillLight.position.set(0, 20, 0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xc7f36b, 1.5);
    rimLight.position.set(-9, 6, -9);
    scene.add(rimLight);

    // 5. Construct TEAMORA NEURAL CORE (Layered precision-machined model)
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // ==========================================
    // LAYER A: Heavy Titanium Base Pedestal
    // ==========================================
    const baseGroup = new THREE.Group();
    // Beveled main pedestal
    const pedestalGeo = new THREE.CylinderGeometry(7.2, 7.8, 0.45, 48);
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x241d2f,
      metalness: 0.9,
      roughness: 0.22,
    });
    const pedestalMesh = new THREE.Mesh(pedestalGeo, titaniumMat);
    pedestalMesh.position.y = -0.225;
    pedestalMesh.receiveShadow = renderer.shadowMap.enabled;
    baseGroup.add(pedestalMesh);

    // Concentric neon status track ring (Electric Lime)
    const trackGeo = new THREE.TorusGeometry(7.1, 0.05, 16, 64);
    const trackMat = new THREE.MeshBasicMaterial({ color: 0xc7f36b });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.rotation.x = Math.PI / 2;
    trackMesh.position.y = 0.02;
    baseGroup.add(trackMesh);

    // Inner bevel collar (Muted Lavender)
    const innerTrackGeo = new THREE.TorusGeometry(3.6, 0.04, 16, 64);
    const innerTrackMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6 });
    const innerTrackMesh = new THREE.Mesh(innerTrackGeo, innerTrackMat);
    innerTrackMesh.rotation.x = Math.PI / 2;
    innerTrackMesh.position.y = 0.02;
    baseGroup.add(innerTrackMesh);

    // Soft contact shadow plane
    const shadowGeo = new THREE.PlaneGeometry(18, 18);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext('2d')!;
    const grad = sctx.createRadialGradient(64, 64, 12, 64, 64, 64);
    grad.addColorStop(0, 'rgba(10, 6, 16, 0.75)');
    grad.addColorStop(0.5, 'rgba(15, 10, 25, 0.35)');
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
    shadowMesh.position.y = -0.46;
    baseGroup.add(shadowMesh);
    masterGroup.add(baseGroup);

    // ==========================================
    // LAYER B: Central Chamber & Mechanical Pillars
    // ==========================================
    const coreGroup = new THREE.Group();
    coreGroup.position.set(0, 2.4, 0);

    // Smoked-glass containment chamber
    const glassGeo = new THREE.CylinderGeometry(2.2, 2.2, 3.6, 32, 1, true);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x2c2438,
      transparent: true,
      opacity: 0.28,
      roughness: 0.1,
      metalness: 0.2,
      side: THREE.DoubleSide,
    });
    const glassChamber = new THREE.Mesh(glassGeo, glassMat);
    coreGroup.add(glassChamber);

    // 4 Graphite Titanium Perimeter Columns
    const colGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.8, 16);
    const colMat = new THREE.MeshStandardMaterial({
      color: 0x312740,
      metalness: 0.95,
      roughness: 0.18,
    });
    for (let c = 0; c < 4; c++) {
      const angle = (c * Math.PI) / 2;
      const colMesh = new THREE.Mesh(colGeo, colMat);
      colMesh.position.set(Math.cos(angle) * 2.25, 0, Math.sin(angle) * 2.25);
      coreGroup.add(colMesh);
    }

    // Top and Bottom Titanium Crown Rings
    const crownGeo = new THREE.TorusGeometry(2.25, 0.1, 16, 48);
    const crownTop = new THREE.Mesh(crownGeo, colMat);
    crownTop.rotation.x = Math.PI / 2;
    crownTop.position.y = 1.9;
    coreGroup.add(crownTop);

    const crownBottom = new THREE.Mesh(crownGeo, colMat);
    crownBottom.rotation.x = Math.PI / 2;
    crownBottom.position.y = -1.9;
    coreGroup.add(crownBottom);

    // ==========================================
    // LAYER C: Concentric Precision Gimbal Rings
    // ==========================================
    const gimbalAlphaGeo = new THREE.TorusGeometry(1.65, 0.045, 16, 64);
    const gimbalAlphaMat = new THREE.MeshStandardMaterial({
      color: 0xc7f36b, // Electric Lime
      metalness: 0.9,
      roughness: 0.15,
    });
    const gimbalAlpha = new THREE.Mesh(gimbalAlphaGeo, gimbalAlphaMat);
    coreGroup.add(gimbalAlpha);

    const gimbalBetaGeo = new THREE.TorusGeometry(1.4, 0.045, 16, 64);
    const gimbalBetaMat = new THREE.MeshStandardMaterial({
      color: 0xa78bfa, // Muted Lavender
      metalness: 0.85,
      roughness: 0.2,
    });
    const gimbalBeta = new THREE.Mesh(gimbalBetaGeo, gimbalBetaMat);
    gimbalBeta.rotation.x = Math.PI / 3;
    coreGroup.add(gimbalBeta);

    const gimbalGammaGeo = new THREE.TorusGeometry(1.15, 0.04, 16, 64);
    const gimbalGammaMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.95,
      roughness: 0.1,
    });
    const gimbalGamma = new THREE.Mesh(gimbalGammaGeo, gimbalGammaMat);
    gimbalGamma.rotation.y = Math.PI / 4;
    coreGroup.add(gimbalGamma);

    // ==========================================
    // LAYER D: Central Neural Processing Core
    // ==========================================
    const innerCoreGeo = new THREE.IcosahedronGeometry(0.72, 2);
    const innerCoreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x8b5cf6,
      emissiveIntensity: 0.95,
      roughness: 0.1,
      metalness: 0.9,
    });
    const innerCoreMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    coreGroup.add(innerCoreMesh);

    // Floating orbital diamond flux nodes around the core
    const fluxGeo = new THREE.OctahedronGeometry(0.14);
    const fluxMat = new THREE.MeshStandardMaterial({
      color: 0xff806e, // Soft Coral
      emissive: 0xff806e,
      emissiveIntensity: 0.4,
      metalness: 0.9,
      roughness: 0.15,
    });
    const fluxNodes: THREE.Mesh[] = [];
    for (let f = 0; f < 6; f++) {
      const fAngle = (f * Math.PI) / 3;
      const fMesh = new THREE.Mesh(fluxGeo, fluxMat);
      fMesh.position.set(Math.cos(fAngle) * 0.95, Math.sin(f * 1.5) * 0.35, Math.sin(fAngle) * 0.95);
      coreGroup.add(fMesh);
      fluxNodes.push(fMesh);
    }

    masterGroup.add(coreGroup);

    // ==========================================
    // LAYER E: 15 Interconnected Employee Nodes
    // Two Concentric Tiers:
    // Inner Tier (Radius 4.3): 6 Strategic Leadership & Revenue Directors
    // Outer Tier (Radius 6.2): 9 Execution Specialists & Intelligence Agents
    // ==========================================
    interface AgentNode3D {
      group: THREE.Group;
      agentId: string;
      agentName: string;
      role: string;
      tier: 'inner' | 'outer';
      baseRadius: number;
      angle: number;
      speed: number;
      baseY: number;
      color: number;
      haloMesh: THREE.Mesh;
      orbMesh: THREE.Mesh;
      lineGeom: THREE.BufferGeometry;
    }

    const agentNodes3D: AgentNode3D[] = [];
    const interactiveMeshes: THREE.Mesh[] = [];

    // Helper color palette mapping
    const getHexColor = (accent: string): number => {
      if (accent.startsWith('#')) return parseInt(accent.slice(1), 16);
      return 0x8b5cf6;
    };

    TEAMORA_AGENTS.forEach((agent, index) => {
      const isInner = index < 6;
      const radius = isInner ? 4.3 : 6.2;
      const tierCount = isInner ? 6 : 9;
      const tierIndex = isInner ? index : index - 6;
      const angle = (tierIndex * (Math.PI * 2)) / tierCount;
      const baseY = isInner ? 2.1 : 1.35;
      const colorHex = getHexColor(agent.accentColor);

      const nodeGroup = new THREE.Group();
      nodeGroup.name = agent.id;

      // Part 1: Floating Pod Platform
      const podGeo = new THREE.CylinderGeometry(0.32, 0.22, 0.16, 16);
      const podMat = new THREE.MeshStandardMaterial({
        color: 0x241d2f,
        metalness: 0.85,
        roughness: 0.25,
      });
      const podMesh = new THREE.Mesh(podGeo, podMat);
      nodeGroup.add(podMesh);

      // Part 2: Department Energy Orb (Interactive Hit Target)
      const orbGeo = new THREE.SphereGeometry(0.24, 20, 20);
      const orbMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.5,
        metalness: 0.6,
        roughness: 0.2,
      });
      const orbMesh = new THREE.Mesh(orbGeo, orbMat);
      orbMesh.position.y = 0.26;
      orbMesh.userData = { agentId: agent.id, agentName: agent.name };
      nodeGroup.add(orbMesh);
      interactiveMeshes.push(orbMesh);

      // Part 3: Surrounding Precision Halo
      const haloGeo = new THREE.TorusGeometry(0.38, 0.024, 12, 32);
      const haloMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        metalness: 0.9,
        roughness: 0.2,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.rotation.x = Math.PI / 2;
      haloMesh.position.y = 0.26;
      nodeGroup.add(haloMesh);

      // Part 4: Vertical Communication Beacon Pin
      const pinGeo = new THREE.CylinderGeometry(0.012, 0.012, baseY + 0.2, 8);
      const pinMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.3,
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.y = -(baseY / 2) - 0.05;
      nodeGroup.add(pinMesh);

      // Position Node Group
      nodeGroup.position.set(Math.cos(angle) * radius, baseY, Math.sin(angle) * radius);
      masterGroup.add(nodeGroup);

      // Laser conduit line connecting core to agent
      const points = [coreGroup.position.clone(), nodeGroup.position.clone()];
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.35,
      });
      const laserLine = new THREE.Line(lineGeom, lineMat);
      masterGroup.add(laserLine);

      agentNodes3D.push({
        group: nodeGroup,
        agentId: agent.id,
        agentName: agent.name,
        role: agent.role,
        tier: isInner ? 'inner' : 'outer',
        baseRadius: radius,
        angle,
        speed: isInner ? 0.35 : 0.22,
        baseY,
        color: colorHex,
        haloMesh,
        orbMesh,
        lineGeom,
      });
    });

    // ==========================================
    // Raycasting for Direct Node Selection
    // ==========================================
    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      _raycaster.setFromCamera(_mouse, camera);
      const intersects = _raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const targetId = hit.userData.agentId;
        if (targetId) {
          setSelectedAgentKey(targetId);
          onSelectAgent?.(targetId);
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // ==========================================
    // Animation Loop
    // ==========================================
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = 0;

    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Skip render if tab is hidden (battery & CPU saving)
      if (!isTabVisible) return;

      const now = performance.now();
      const delta = clock.getDelta();

      // FPS Measurement
      frameCount++;
      fpsTimer += now - lastTime;
      lastTime = now;
      if (fpsTimer >= 1000) {
        setCurrentFps(Math.round((frameCount * 1000) / fpsTimer));
        frameCount = 0;
        fpsTimer = 0;
      }

      const params = loopParamsRef.current;
      const elapsedTime = clock.getElapsedTime();

      // 1. Core gimbal rotations (Precision counter-rotation)
      const rotSpeed = params.autoRotate ? 1 : 0.2;
      gimbalAlpha.rotation.x += delta * 0.45 * rotSpeed;
      gimbalAlpha.rotation.y += delta * 0.3 * rotSpeed;

      gimbalBeta.rotation.y -= delta * 0.55 * rotSpeed;
      gimbalBeta.rotation.z += delta * 0.25 * rotSpeed;

      gimbalGamma.rotation.z += delta * 0.65 * rotSpeed;
      gimbalGamma.rotation.x -= delta * 0.35 * rotSpeed;

      // 2. Core neural breathing pulse
      const pulseScale = 1 + Math.sin(elapsedTime * 2.5) * 0.045;
      innerCoreMesh.scale.set(pulseScale, pulseScale, pulseScale);

      // 3. Floating flux diamond nodes
      fluxNodes.forEach((fn, i) => {
        const orbitAngle = elapsedTime * 0.8 + (i * Math.PI) / 3;
        fn.position.x = Math.cos(orbitAngle) * 0.95;
        fn.position.z = Math.sin(orbitAngle) * 0.95;
        fn.position.y = Math.sin(elapsedTime * 2 + i) * 0.35;
      });

      // 4. Update 15 Agent Nodes
      agentNodes3D.forEach((node) => {
        // Slow mechanical orbital drifting
        if (params.autoRotate) {
          node.angle += delta * 0.08 * node.speed;
          node.group.position.x = Math.cos(node.angle) * node.baseRadius;
          node.group.position.z = Math.sin(node.angle) * node.baseRadius;
        }

        // Floating hover bobbing
        const isSelected = node.agentId === params.activeNodeId;
        const bob = Math.sin(elapsedTime * 1.8 + node.angle) * 0.08;
        node.group.position.y = node.baseY + bob + (isSelected ? 0.35 : 0);

        // Highlight active or selected node
        if (isSelected) {
          node.orbMesh.scale.lerp(_vec3.set(1.35, 1.35, 1.35), 0.1);
          node.haloMesh.rotation.z += delta * 2.5;
        } else {
          node.orbMesh.scale.lerp(_vec3.set(1, 1, 1), 0.1);
        }

        // Update neural laser lines
        const posArray = node.lineGeom.attributes.position.array as Float32Array;
        posArray[3] = node.group.position.x;
        posArray[4] = node.group.position.y;
        posArray[5] = node.group.position.z;
        node.lineGeom.attributes.position.needsUpdate = true;
      });

      // Smooth camera interpolation towards selected agent or core
      camera.position.lerp(params.targetCameraPos, 0.04);
      controls.target.lerp(params.targetLookAt, 0.04);
      controls.update();

      renderer.render(scene, camera);
    };

    animate();

    // Resize handling
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 800;
      const newH = container.clientHeight || 520;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      renderer.dispose();
      controls.dispose();
      scene.clear();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [qualityMode]);

  // View focus presets
  const focusOnAgent = (agentId: string) => {
    setSelectedAgentKey(agentId);
    onSelectAgent?.(agentId);
    const agent = TEAMORA_AGENTS.find((a) => a.id === agentId);
    if (!agent) return;

    const idx = TEAMORA_AGENTS.findIndex((a) => a.id === agentId);
    const isInner = idx < 6;
    const radius = isInner ? 4.3 : 6.2;
    const tierCount = isInner ? 6 : 9;
    const tierIndex = isInner ? idx : idx - 6;
    const angle = (tierIndex * (Math.PI * 2)) / tierCount;

    loopParamsRef.current.targetCameraPos.set(
      Math.cos(angle) * (radius + 3.8),
      3.8,
      Math.sin(angle) * (radius + 3.8)
    );
    loopParamsRef.current.targetLookAt.set(Math.cos(angle) * radius, isInner ? 2.1 : 1.35, Math.sin(angle) * radius);
  };

  const focusOnCore = () => {
    loopParamsRef.current.targetCameraPos.set(0, 5.5, 11);
    loopParamsRef.current.targetLookAt.set(0, 2.4, 0);
  };

  const resetCamera = () => {
    loopParamsRef.current.targetCameraPos.set(0, 7.5, 15);
    loopParamsRef.current.targetLookAt.set(0, 1.8, 0);
  };

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden bg-[#211B2C] text-[#F5F1E9] border border-[#382F47] shadow-2xl select-none ${className}`}>
      {/* 2D Fallback if WebGL unavailable */}
      {!webGlSupported ? (
        <div className="h-[480px] p-8 flex flex-col items-center justify-center text-center space-y-4 bg-[#211B2C]">
          <Cpu className="w-12 h-12 text-[#A78BFA] animate-pulse" />
          <div className="max-w-md space-y-2">
            <h3 className="text-base font-bold">2D Neural Core Fallback Active</h3>
            <p className="text-xs text-[#AFA8B8]">
              Hardware-accelerated WebGL is unavailable on this device. TEAMORA AI has automatically engaged the high-efficiency 2D telemetry grid to conserve resources.
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-w-xl pt-2">
            {TEAMORA_AGENTS.map((agent) => (
              <button
                key={agent.id}
                onClick={() => {
                  setSelectedAgentId(agent.id);
                  setActiveTab('workspace');
                }}
                className="p-2.5 rounded-xl bg-[#2C2438] hover:bg-[#382F47] border border-[#382F47] text-left transition-all cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: agent.accentColor }} />
                <div className="text-[11px] font-bold truncate">{agent.name}</div>
                <div className="text-[9px] text-[#AFA8B8] truncate">{agent.department}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Main Three.js WebGL Container */}
          <div ref={containerRef} className="w-full h-[520px] cursor-grab active:cursor-grabbing" />

          {/* Top HUD: Hardware Quality & Performance Metrics */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              <div className="px-3 py-1.5 rounded-xl bg-[#2C2438]/90 backdrop-blur-md border border-[#382F47] flex items-center gap-2 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-[#C7F36B]" />
                <span className="text-xs font-extrabold tracking-wide text-[#F5F1E9]">
                  TEAMORA NEURAL CORE
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#C7F36B] text-[#162700] font-bold">
                  15 NODES ACTIVE
                </span>
              </div>

              {/* Quality Switcher */}
              <div className="hidden sm:flex items-center p-0.5 rounded-xl bg-[#2C2438]/90 backdrop-blur-md border border-[#382F47] text-[10px] font-mono">
                {(['eco', 'standard', 'high'] as QualityMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setQualityMode(mode)}
                    className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer ${
                      qualityMode === mode
                        ? 'bg-[#8B5CF6] text-white shadow-sm'
                        : 'text-[#AFA8B8] hover:text-[#F5F1E9]'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Performance telemetry pill */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <div className="px-2.5 py-1 rounded-xl bg-[#2C2438]/90 backdrop-blur-md border border-[#382F47] text-[10px] font-mono text-[#AFA8B8] flex items-center gap-1.5 shadow-lg">
                <Activity className="w-3 h-3 text-[#10B981]" />
                <span>{currentFps} FPS</span>
              </div>
            </div>
          </div>

          {/* Bottom Interactive HUD Dock: Agent Telemetry & Navigation */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col md:flex-row items-end md:items-center justify-between gap-3 pointer-events-none">
            {/* Selected Agent Telemetry Card */}
            <div className="w-full md:w-auto max-w-md p-3.5 rounded-2xl bg-[#2C2438]/95 backdrop-blur-md border border-[#382F47] shadow-xl pointer-events-auto space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: selectedAgent.accentColor }}
                  />
                  <div>
                    <div className="text-xs font-bold text-[#F5F1E9] flex items-center gap-1.5">
                      {selectedAgent.name}
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#382F47] text-[#AFA8B8]">
                        {selectedAgent.department}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#AFA8B8] truncate max-w-[220px]">
                      {selectedAgent.role}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedAgentId(selectedAgent.id);
                    setActiveTab('workspace');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all shrink-0"
                >
                  <span>Open Workspace</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="pt-2 border-t border-[#382F47] flex items-center justify-between text-[10px] font-mono text-[#AFA8B8]">
                <span>Status: <strong className="text-[#10B981]">Available</strong></span>
                <span>Active Tasks: <strong className="text-[#F5F1E9]">{selectedAgentActiveTasks}</strong></span>
                <span>Uptime: <strong className="text-[#F5F1E9]">{selectedAgent.uptime}</strong></span>
              </div>
            </div>

            {/* Quick 3D View Controls Toolbar */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#2C2438]/95 backdrop-blur-md border border-[#382F47] shadow-xl pointer-events-auto">
              <button
                onClick={focusOnCore}
                title="Focus Core"
                className="p-2 rounded-xl text-[#AFA8B8] hover:text-[#F5F1E9] hover:bg-[#382F47] cursor-pointer transition-all"
              >
                <Target className="w-4 h-4 text-[#A78BFA]" />
              </button>

              <button
                onClick={() => focusOnAgent(selectedAgentKey)}
                title="Focus Selected Agent"
                className="p-2 rounded-xl text-[#AFA8B8] hover:text-[#F5F1E9] hover:bg-[#382F47] cursor-pointer transition-all"
              >
                <Maximize2 className="w-4 h-4 text-[#C7F36B]" />
              </button>

              <button
                onClick={() => setAutoRotate(!autoRotate)}
                title={autoRotate ? 'Pause Rotation' : 'Auto Rotate'}
                className={`p-2 rounded-xl cursor-pointer transition-all ${
                  autoRotate ? 'bg-[#8B5CF6] text-white' : 'text-[#AFA8B8] hover:text-[#F5F1E9] hover:bg-[#382F47]'
                }`}
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                onClick={resetCamera}
                title="Reset Camera"
                className="p-2 rounded-xl text-[#AFA8B8] hover:text-[#F5F1E9] hover:bg-[#382F47] cursor-pointer transition-all"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
