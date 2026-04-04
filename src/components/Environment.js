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
import { normToAltKm, altKmToNorm } from '../altitude.js';

export { WORLD_HEIGHT };
const H = WORLD_HEIGHT;

// Helper: convert real km to Y position in world
function kmToY(km) { return altKmToNorm(km) * H; }

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

    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);
    const startY = H * 0.5;
    this.camera.position.set(0, startY, 100);
    this.camera.lookAt(0, startY, 0);

    this.fog = new THREE.FogExp2(0x000000, 0.0);
    this.scene.fog = this.fog;

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(30, 100, 80); this.scene.add(dir);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.0, 0.4, 0.85);
    this.composer.addPass(this.bloomPass);

    this.targetY = startY;
    this.currentY = startY;
    this.prevTargetY = startY;

    this.space = new Space(this.scene);
    this.clouds = new Clouds(this.scene);
    this.surface = new Surface(this.scene);
    this.ocean = new Ocean(this.scene);
    this.core = new Core(this.scene);

    // Clickable 3D landmarks — built by layers, registered here
    this.landmarks = [];
    this.activeFact = null;
    this.factPanel = document.getElementById('fact-panel');
    this.factTitle = document.getElementById('fp-title');
    this.factDepth = document.getElementById('fp-depth');
    this.factDesc = document.getElementById('fp-desc');
    this.factClose = document.getElementById('fp-close');
    if (this.factClose) this.factClose.addEventListener('click', () => this.closeFact());

    // Raycaster for click detection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    window.addEventListener('click', (e) => this.onClick(e));

    // Fact triggers: [elementId, altitudeKm, radiusKm]
    this.facts = [
      ['fact-iss',408,40],['fact-karman',100,18],['fact-meteor',80,12],
      ['fact-felix',38.969,8],['fact-concorde',18.3,5],['fact-jets',11,3],
      ['fact-everest',8.849,2.5],['fact-sealevel',0,1.5],
      ['fact-light',-0.2,0.12],['fact-divingsuit',-0.61,0.12],
      ['fact-milsub',-0.9,0.15],['fact-spermwhale',-2.25,0.5],
      ['fact-titanic',-3.784,0.6],['fact-avgocean',-3.688,0.6],
      ['fact-snailfish',-8.178,1.2],['fact-mariana',-10.935,1.5],
      ['fact-kola',-12.262,2],['fact-mantle',-1500,300],
      ['fact-outercore',-4000,400],['fact-innercore',-5800,350],
    ];

    this.dvNum = document.getElementById('dv-num');
    this.dvZone = document.getElementById('dv-zone');
    this.surfaceBtn = document.getElementById('btn-surface');
    this.transitionFog = document.getElementById('transition-fog');
    this.scrollHint = document.getElementById('scroll-hint');

    window.addEventListener('resize', () => this.onResize());
  }

  registerLandmark(mesh, factId) {
    mesh.userData.factId = factId;
    this.landmarks.push(mesh);
  }

  onClick(e) {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.landmarks, true);
    if (hits.length > 0) {
      let obj = hits[0].object;
      while (obj && !obj.userData.factId) obj = obj.parent;
      if (obj && obj.userData.factId) this.showFact(obj.userData.factId);
    }
  }

  showFact(factId) {
    const el = document.getElementById(factId);
    if (!el || !this.factPanel) return;
    this.factTitle.textContent = el.querySelector('.fact-title')?.textContent || '';
    this.factDepth.textContent = el.querySelector('.fact-depth')?.textContent || '';
    this.factDesc.textContent = el.querySelector('.fact-desc')?.textContent || '';
    this.factPanel.classList.add('visible');
    this.activeFact = factId;
  }

  closeFact() {
    if (this.factPanel) this.factPanel.classList.remove('visible');
    this.activeFact = null;
  }

  update() {
    const jumpThreshold = H * 0.25;
    if (Math.abs(this.targetY - this.prevTargetY) > jumpThreshold) this.currentY = this.targetY;
    else this.currentY += (this.targetY - this.currentY) * 0.07;
    this.prevTargetY = this.targetY;

    this.camera.position.set(0, this.currentY, 100);
    this.camera.lookAt(0, this.currentY, 0);

    const norm = this.currentY / H;
    const altKm = normToAltKm(norm);

    this.updateBiome(norm);

    this.space.group.visible   = norm > 0.60;
    this.clouds.group.visible  = norm > 0.45 && norm < 0.85;
    this.surface.group.visible = norm > 0.35 && norm < 0.65;
    this.ocean.group.visible   = norm > 0.22 && norm < 0.55;
    this.core.group.visible    = norm < 0.30;

    this.bloomPass.strength = norm < 0.08 ? THREE.MathUtils.lerp(2.5, 0.0, norm / 0.08) : 0.0;

    this.space.update(this.currentY);
    this.clouds.update(this.currentY);
    this.surface.update(this.currentY);
    this.ocean.update(this.currentY);
    this.core.update(this.currentY);

    this.updateOverlays(altKm, norm);
    this.updateHud(altKm);

    if (this.scrollHint && Math.abs(norm - 0.5) > 0.02) this.scrollHint.style.opacity = '0';
    const dTop = 1 - norm;
    this.transitionFog.style.opacity = dTop < 0.025 ? String(1 - dTop / 0.025) : '0';

    this.composer.render();
  }

  updateBiome(norm) {
    const bg = this.scene.background;
    if (norm > 0.8) { bg.setHex(0x000000); this.fog.density = 0; }
    else if (norm > 0.5) {
      const t = (norm - 0.5) / 0.3;
      bg.copy(new THREE.Color(0x87ceeb)).lerp(new THREE.Color(0x050520), Math.min(t, 1));
      this.fog.color.copy(bg); this.fog.density = 0.0004 * Math.min(t, 1);
    } else if (norm > 0.35) {
      const t = (0.5 - norm) / 0.15;
      bg.copy(new THREE.Color(0x1a8fcc)).lerp(new THREE.Color(0x021828), Math.min(t, 1));
      this.fog.color.copy(bg); this.fog.density = 0.0012 * Math.min(t, 1);
    } else if (norm > 0.18) {
      const t = (0.35 - norm) / 0.17;
      bg.copy(new THREE.Color(0x021828)).lerp(new THREE.Color(0x3b1f0a), Math.min(t, 1));
      this.fog.color.copy(bg); this.fog.density = 0.002 * Math.min(t, 1);
    } else {
      const t = norm / 0.18;
      bg.copy(new THREE.Color(0x330000)).lerp(new THREE.Color(0x3b1f0a), t);
      this.fog.color.copy(bg); this.fog.density = 0.002 * (1 - t);
    }
  }

  updateOverlays(altKm, norm) {
    for (const [id, triggerKm, radiusKm] of this.facts) {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('visible', Math.abs(altKm - triggerKm) < radiusKm);
    }
    this.surfaceBtn.classList.toggle('visible', Math.abs(norm - 0.5) > 0.05);
  }

  updateHud(altKm) {
    const abs = Math.abs(altKm);
    let display;
    if (abs >= 1) display = (altKm >= 0 ? '+' : '') + altKm.toFixed(1) + ' km';
    else { const m = Math.round(altKm * 1000); display = (m >= 0 ? '+' : '') + m + ' m'; }
    this.dvNum.textContent = display;

    let zone;
    if (altKm > 500) zone = 'Deep Space';
    else if (altKm > 100) zone = 'Exosphere';
    else if (altKm > 80) zone = 'Thermosphere';
    else if (altKm > 50) zone = 'Mesosphere';
    else if (altKm > 12) zone = 'Stratosphere';
    else if (altKm > 0.01) zone = 'Troposphere';
    else if (altKm > -0.2) zone = 'Sea Level';
    else if (altKm > -1) zone = 'Sunlight Zone';
    else if (altKm > -4) zone = 'Twilight Zone';
    else if (altKm > -11) zone = 'Abyssal Zone';
    else if (altKm > -35) zone = 'Hadal Zone';
    else if (altKm > -2891) zone = 'Crust / Mantle';
    else if (altKm > -5150) zone = 'Outer Core';
    else zone = 'Inner Core';
    this.dvZone.textContent = zone;
  }

  onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h); this.composer.setSize(w, h);
  }
}
