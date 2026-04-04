import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Space } from './Layers/Space.js';
import { Clouds } from './Layers/Clouds.js';
import { Ocean } from './Layers/Ocean.js';
import { Surface } from './Layers/Surface.js';
import { Core } from './Layers/Core.js';
import { WORLD_HEIGHT } from '../constants.js';
import { normToAltKm } from '../altitude.js';

export { WORLD_HEIGHT };
const H = WORLD_HEIGHT;

export class Environment {
  constructor(container) {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.fog = new THREE.FogExp2(0x000000, 0);
    this.scene.fog = this.fog;

    // Camera
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);
    const startY = H * 0.68;
    this.camera.position.set(0, startY, 100);
    this.camera.lookAt(0, startY, 0);

    // Lights
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(30, 100, 80);
    this.scene.add(dir);

    // Post-processing
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0, 0.4, 0.85);
    this.composer.addPass(this.bloomPass);

    // State
    this.targetY = startY;
    this.currentY = startY;

    // Layers — symmetric world
    this.layers = [
      this.spaceTop   = new Space(this.scene, 'top'),
      this.cloudsTop   = new Clouds(this.scene, 'top'),
      this.surfaceTop  = new Surface(this.scene, 'top'),
      this.oceanTop    = new Ocean(this.scene, 'top'),
      this.core        = new Core(this.scene),
      this.oceanBot    = new Ocean(this.scene, 'bottom'),
      this.surfaceBot  = new Surface(this.scene, 'bottom'),
      this.cloudsBot   = new Clouds(this.scene, 'bottom'),
      this.spaceBot    = new Space(this.scene, 'bottom'),
    ];

    // DOM refs
    this.dvNum = document.getElementById('dv-num');
    this.dvZone = document.getElementById('dv-zone');
    this.surfaceBtn = document.getElementById('btn-surface');
    this.transitionFog = document.getElementById('transition-fog');
    this.scrollHint = document.getElementById('scroll-hint');
    this.clickHint = document.getElementById('click-hint');
    this.factPanel = document.getElementById('fact-panel');
    this.fpTitle = document.getElementById('fp-title');
    this.fpDepth = document.getElementById('fp-depth');
    this.fpDesc = document.getElementById('fp-desc');

    // Close panel
    document.getElementById('fp-close')?.addEventListener('click', () => this.factPanel?.classList.remove('visible'));

    // Click detection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clickables = []; // cached list, rebuilt once
    this.clickablesDirty = true;
    window.addEventListener('click', (e) => this.onClick(e));
    window.addEventListener('resize', () => this.onResize());
  }

  onClick(e) {
    // Rebuild clickable list once
    if (this.clickablesDirty) {
      this.clickables = [];
      this.scene.traverse(c => { if (c.userData?.factId) this.clickables.push(c); });
      this.clickablesDirty = false;
    }
    this.mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.clickables, true);
    if (hits.length === 0) return;
    // Walk up to find the group with factId
    let obj = hits[0].object;
    while (obj && !obj.userData?.factId) obj = obj.parent;
    if (!obj?.userData?.factId) return;
    const el = document.getElementById(obj.userData.factId);
    if (!el || !this.factPanel) return;
    this.fpTitle.textContent = el.dataset.title || '';
    this.fpDepth.textContent = el.dataset.depth || '';
    this.fpDesc.textContent = el.dataset.desc || '';
    this.factPanel.classList.add('visible');
    // Hide click hint after first use
    if (this.clickHint) this.clickHint.style.opacity = '0';
  }

  update() {
    // Wrap-aware lerp
    let diff = this.targetY - this.currentY;
    if (diff > H / 2) diff -= H;
    if (diff < -H / 2) diff += H;
    this.currentY += diff * 0.07;
    this.currentY = ((this.currentY % H) + H) % H;

    this.camera.position.set(0, this.currentY, 100);
    this.camera.lookAt(0, this.currentY, 0);

    const norm = this.currentY / H;
    const altKm = normToAltKm(norm);
    const isTop = norm >= 0.5;
    const sym = Math.abs(norm - 0.5); // 0=core, 0.5=space

    // Biome
    this.updateBiome(sym);

    // LOD
    const sSpace = sym > 0.35, sClouds = sym > 0.15 && sym < 0.45;
    const sSurf = sym > 0.10 && sym < 0.30, sOcean = sym > 0.02 && sym < 0.22;
    const sCore = sym < 0.12;
    this.spaceTop.group.visible   = isTop && sSpace;
    this.cloudsTop.group.visible  = isTop && sClouds;
    this.surfaceTop.group.visible = isTop && sSurf;
    this.oceanTop.group.visible   = isTop && sOcean;
    this.core.group.visible       = sCore;
    this.oceanBot.group.visible   = !isTop && sOcean;
    this.surfaceBot.group.visible = !isTop && sSurf;
    this.cloudsBot.group.visible  = !isTop && sClouds;
    this.spaceBot.group.visible   = !isTop && sSpace;

    // Bloom near core
    this.bloomPass.strength = sym < 0.05 ? THREE.MathUtils.lerp(2.5, 0, sym / 0.05) : 0;

    // Animate visible layers only
    for (const l of this.layers) if (l.group.visible) l.update(this.currentY);

    // HUD
    this.updateHud(altKm, isTop);

    // Surface button
    this.surfaceBtn.classList.toggle('visible', sym > 0.05 && sym < 0.45);

    // Scroll hint fade
    if (this.scrollHint && sym > 0.02) this.scrollHint.style.opacity = '0';

    // Wrap fog
    const edge = Math.min(norm, 1 - norm);
    this.transitionFog.style.opacity = edge < 0.02 ? String(1 - edge / 0.02) : '0';

    this.composer.render();
  }

  updateBiome(sym) {
    const bg = this.scene.background;
    if (sym > 0.4) { bg.setHex(0x000000); this.fog.density = 0; }
    else if (sym > 0.18) {
      const t = (sym - 0.18) / 0.22;
      bg.copy(new THREE.Color(0x87ceeb)).lerp(new THREE.Color(0x050520), Math.min(t, 1));
      this.fog.color.copy(bg); this.fog.density = 0.0004 * Math.min(t, 1);
    } else if (sym > 0.10) {
      const t = (0.18 - sym) / 0.08;
      bg.copy(new THREE.Color(0x1a8fcc)).lerp(new THREE.Color(0x021828), Math.min(t, 1));
      this.fog.color.copy(bg); this.fog.density = 0.001 * Math.min(t, 1);
    } else if (sym > 0.03) {
      const t = (0.10 - sym) / 0.07;
      bg.copy(new THREE.Color(0x021828)).lerp(new THREE.Color(0x3b1f0a), Math.min(t, 1));
      this.fog.color.copy(bg); this.fog.density = 0.002 * Math.min(t, 1);
    } else {
      const t = sym / 0.03;
      bg.copy(new THREE.Color(0x330000)).lerp(new THREE.Color(0x3b1f0a), t);
      this.fog.color.copy(bg); this.fog.density = 0.002 * (1 - t);
    }
  }

  updateHud(altKm, isTop) {
    const abs = Math.abs(altKm);
    this.dvNum.textContent = abs >= 1
      ? `${altKm >= 0 ? '+' : ''}${altKm.toFixed(1)} km`
      : `${Math.round(altKm * 1000)} m`;

    const zones = [
      [500,'Deep Space'],[100,'Exosphere'],[80,'Thermosphere'],[50,'Mesosphere'],
      [12,'Stratosphere'],[0.01,'Troposphere'],[-0.2,'Sea Level'],[-1,'Sunlight Zone'],
      [-4,'Twilight Zone'],[-11,'Abyssal Zone'],[-35,'Hadal Zone'],
      [-2891,'Crust / Mantle'],[-5150,'Outer Core'],[-Infinity,'Inner Core']
    ];
    let zone = 'Inner Core';
    for (const [threshold, name] of zones) { if (altKm > threshold) { zone = name; break; } }
    this.dvZone.textContent = zone + (isTop ? '' : ' (far side)');
  }

  onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }
}
