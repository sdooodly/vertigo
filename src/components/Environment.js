import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Space } from './Layers/Space.js';
import { Clouds } from './Layers/Clouds.js';
import { Ocean } from './Layers/Ocean.js';
import { Surface } from './Layers/Surface.js';
import { Core } from './Layers/Core.js';
import { normToAltKm, WORLD_HEIGHT } from '../altitude.js';

export { WORLD_HEIGHT };
const H = WORLD_HEIGHT;

export class Environment {
  constructor(container) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.fog = new THREE.FogExp2(0x000000, 0);
    this.scene.fog = this.fog;

    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);
    const startY = H * 0.5;
    this.camera.position.set(0, startY, 100);
    this.camera.lookAt(0, startY, 0);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(30, 100, 80);
    this.scene.add(dir);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0, 0.4, 0.85);
    this.composer.addPass(this.bloomPass);

    this.targetY = startY;
    this.currentY = startY;

    // Cached biome colors (avoid GC pressure)
    this._biomeColors = {
      sky: new THREE.Color(0x87ceeb),
      indigo: new THREE.Color(0x050520),
      shallow: new THREE.Color(0x1a8fcc),
      deep: new THREE.Color(0x021828),
      crust: new THREE.Color(0x3b1f0a),
      coreRed: new THREE.Color(0x330000),
    };

    // Single set of layers — core to sun
    this.layers = [
      this.space   = new Space(this.scene),
      this.clouds  = new Clouds(this.scene),
      this.surface = new Surface(this.scene),
      this.ocean   = new Ocean(this.scene),
      this.core    = new Core(this.scene),
    ];

    // DOM
    this.dvNum = document.getElementById('dv-num');
    this.dvZone = document.getElementById('dv-zone');
    this.surfaceBtn = document.getElementById('btn-surface');
    this.scrollHint = document.getElementById('scroll-hint');
    this.clickHint = document.getElementById('click-hint');
    this.factPanel = document.getElementById('fact-panel');
    this.fpTitle = document.getElementById('fp-title');
    this.fpDepth = document.getElementById('fp-depth');
    this.fpDesc = document.getElementById('fp-desc');

    document.getElementById('fp-close')?.addEventListener('click', () => this.factPanel?.classList.remove('visible'));

    // Click detection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clickables = [];
    this.clickablesDirty = true;
    window.addEventListener('click', (e) => this.onClick(e));
    window.addEventListener('resize', () => this.onResize());
  }

  onClick(e) {
    if (this.clickablesDirty) {
      this.clickables = [];
      this.scene.traverse(c => { if (c.userData?.factId) this.clickables.push(c); });
      this.clickablesDirty = false;
    }
    this.mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.clickables, true);
    if (!hits.length) return;
    let obj = hits[0].object;
    while (obj && !obj.userData?.factId) obj = obj.parent;
    if (!obj?.userData?.factId) return;
    const el = document.getElementById(obj.userData.factId);
    if (!el || !this.factPanel) return;
    this.fpTitle.textContent = el.dataset.title || '';
    this.fpDepth.textContent = el.dataset.depth || '';
    this.fpDesc.textContent = el.dataset.desc || '';
    this.factPanel.classList.add('visible');
    if (this.clickHint) this.clickHint.style.opacity = '0';
  }

  update() {
    // Clamped lerp (no wrapping)
    this.currentY += (this.targetY - this.currentY) * 0.07;
    this.currentY = Math.max(0, Math.min(H, this.currentY));
    this.camera.position.set(0, this.currentY, 100);
    this.camera.lookAt(0, this.currentY, 0);

    const norm = this.currentY / H;
    const altKm = normToAltKm(norm);

    this.updateBiome(norm);

    // LOD
    this.space.group.visible   = norm > 0.55;
    this.clouds.group.visible  = norm > 0.42 && norm < 0.72;
    this.surface.group.visible = norm > 0.35 && norm < 0.60;
    this.ocean.group.visible   = norm > 0.15 && norm < 0.52;
    this.core.group.visible    = norm < 0.25;

    this.bloomPass.strength = norm < 0.06 ? THREE.MathUtils.lerp(2.5, 0, norm / 0.06) : 0;

    for (const l of this.layers) if (l.group.visible) l.update(this.currentY);

    this.updateHud(altKm);
    this.surfaceBtn.classList.toggle('visible', Math.abs(norm - 0.5) > 0.06);
    if (this.scrollHint && Math.abs(norm - 0.5) > 0.02) this.scrollHint.style.opacity = '0';

    this.composer.render();
  }

  updateBiome(norm) {
    const bg = this.scene.background;
    const c = this._biomeColors;
    if (norm > 0.7) { bg.setHex(0x000000); this.fog.density = 0; }
    else if (norm > 0.5) {
      const t = Math.min((norm - 0.5) / 0.2, 1);
      bg.copy(c.sky).lerp(c.indigo, t);
      this.fog.color.copy(bg); this.fog.density = 0.0004 * t;
    } else if (norm > 0.35) {
      const t = Math.min((0.5 - norm) / 0.15, 1);
      bg.copy(c.shallow).lerp(c.deep, t);
      this.fog.color.copy(bg); this.fog.density = 0.001 * t;
    } else if (norm > 0.10) {
      const t = Math.min((0.35 - norm) / 0.25, 1);
      bg.copy(c.deep).lerp(c.crust, t);
      this.fog.color.copy(bg); this.fog.density = 0.002 * t;
    } else {
      const t = norm / 0.10;
      bg.copy(c.coreRed).lerp(c.crust, t);
      this.fog.color.copy(bg); this.fog.density = 0.002 * (1 - t);
    }
  }

  updateHud(altKm) {
    const abs = Math.abs(altKm);
    let display;
    if (abs >= 1e9) display = `${(altKm / 1e6).toFixed(0)}M km`;
    else if (abs >= 1e6) display = `${(altKm / 1e6).toFixed(1)}M km`;
    else if (abs >= 1000) display = `${Math.round(altKm).toLocaleString()} km`;
    else if (abs >= 1) display = `${altKm >= 0 ? '+' : ''}${altKm.toFixed(1)} km`;
    else display = `${Math.round(altKm * 1000)} m`;
    this.dvNum.textContent = display;

    const zones = [
      [1.5e8,'Approaching the Sun'],[9.2e7,'Mercury Orbit'],[4.1e7,'Venus Orbit'],
      [384400,'Cislunar Space'],[35786,'Geostationary Orbit'],[500,'Low Earth Orbit'],
      [100,'Exosphere'],[80,'Thermosphere'],[50,'Mesosphere'],
      [12,'Stratosphere'],[0.01,'Troposphere'],[-0.2,'Sea Level'],[-1,'Sunlight Zone'],
      [-4,'Twilight Zone'],[-11,'Abyssal Zone'],[-35,'Hadal Zone'],
      [-2891,'Crust / Mantle'],[-5150,'Outer Core'],[-Infinity,'Inner Core']
    ];
    let zone = 'Inner Core';
    for (const [threshold, name] of zones) { if (altKm > threshold) { zone = name; break; } }
    this.dvZone.textContent = zone;
  }

  onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }
}
