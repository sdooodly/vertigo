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

export { WORLD_HEIGHT };
const H = WORLD_HEIGHT;

/*
 * World layout (Y coordinates):
 *   Y = H    (1.0)  Deep Space
 *   Y = 0.9H        Exosphere
 *   Y = 0.75H       Thermosphere
 *   Y = 0.6H        Troposphere / Clouds
 *   Y = 0.5H        Surface (sea level) ← camera starts here
 *   Y = 0.4H        Shallow Ocean
 *   Y = 0.3H        Deep Ocean / Mariana
 *   Y = 0.2H        Crust
 *   Y = 0.1H        Mantle
 *   Y = 0    (0.0)  Core
 *
 * Scroll goes: Surface→Core→(mirror)→Surface→Space→(wrap)→Surface
 */

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
    dir.position.set(30, 100, 80);
    this.scene.add(dir);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight), 0.0, 0.4, 0.85
    );
    this.composer.addPass(this.bloomPass);

    this.targetY = startY;
    this.currentY = startY;
    this.prevTargetY = startY;

    // Layers
    this.space = new Space(this.scene);
    this.clouds = new Clouds(this.scene);
    this.surface = new Surface(this.scene);
    this.ocean = new Ocean(this.scene);
    this.core = new Core(this.scene);

    // Labels: [elementId, centerY, radius]
    this.labels = [
      ['label-deep-space',   H * 0.97, H * 0.04],
      ['label-exosphere',    H * 0.88, H * 0.04],
      ['label-thermosphere', H * 0.75, H * 0.04],
      ['label-troposphere',  H * 0.58, H * 0.04],
      ['label-crust',        H * 0.22, H * 0.04],
      ['label-mantle',       H * 0.12, H * 0.04],
      ['label-core',         H * 0.03, H * 0.03],
    ];

    // Trivia: [elementId, centerY, radius]
    this.trivias = [
      ['trivia-iss',        H * 0.92, H * 0.025],
      ['trivia-karman',     H * 0.85, H * 0.025],
      ['trivia-meteor',     H * 0.80, H * 0.025],
      ['trivia-felix',      H * 0.73, H * 0.025],
      ['trivia-concorde',   H * 0.67, H * 0.025],
      ['trivia-planes',     H * 0.60, H * 0.025],
      ['trivia-everest',    H * 0.54, H * 0.025],
      ['trivia-surface',    H * 0.50, H * 0.025],
      ['trivia-titanic',    H * 0.42, H * 0.025],
      ['trivia-mariana',    H * 0.35, H * 0.025],
      ['trivia-crust',      H * 0.25, H * 0.025],
      ['trivia-mantle',     H * 0.15, H * 0.03],
      ['trivia-outer-core', H * 0.08, H * 0.03],
      ['trivia-inner-core', H * 0.03, H * 0.025],
    ];

    this.surfaceBtn = document.getElementById('btn-surface');
    this.altitudeHud = document.getElementById('altitude-hud');
    this.transitionFog = document.getElementById('transition-fog');
    this.scrollHint = document.getElementById('scroll-hint');

    window.addEventListener('resize', () => this.onResize());
  }

  update() {
    const jumpThreshold = H * 0.25;
    if (Math.abs(this.targetY - this.prevTargetY) > jumpThreshold) {
      this.currentY = this.targetY;
    } else {
      this.currentY += (this.targetY - this.currentY) * 0.07;
    }
    this.prevTargetY = this.targetY;

    this.camera.position.set(0, this.currentY, 100);
    this.camera.lookAt(0, this.currentY, 0);

    const norm = this.currentY / H; // 0=core, 0.5=surface, 1=space

    this.updateBiome(norm);

    // LOD visibility
    this.space.group.visible   = norm > 0.65;
    this.clouds.group.visible  = norm > 0.45 && norm < 0.80;
    this.surface.group.visible = norm > 0.38 && norm < 0.62;
    this.ocean.group.visible   = norm > 0.25 && norm < 0.55;
    this.core.group.visible    = norm < 0.35;

    // Bloom near core
    this.bloomPass.strength = norm < 0.1 ? THREE.MathUtils.lerp(2.5, 0.0, norm / 0.1) : 0.0;

    // Animate
    this.space.update(this.currentY);
    this.clouds.update(this.currentY);
    this.surface.update(this.currentY);
    this.ocean.update(this.currentY);
    this.core.update(this.currentY);

    this.updateOverlays(norm);
    this.updateHud(norm);

    // Hide scroll hint after user scrolls away from surface
    if (this.scrollHint && Math.abs(norm - 0.5) > 0.03) {
      this.scrollHint.style.opacity = '0';
    }

    // Transition fog near Y=H (space wrap point)
    const distFromTop = 1 - norm;
    this.transitionFog.style.opacity = distFromTop < 0.025 ? String(1 - distFromTop / 0.025) : '0';

    this.composer.render();
  }

  updateBiome(norm) {
    const bg = this.scene.background;
    if (norm > 0.8) {
      bg.setHex(0x000000);
      this.fog.density = 0.0;
    } else if (norm > 0.5) {
      // Atmosphere: sky blue → dark indigo → black
      const t = (norm - 0.5) / 0.3; // 0 at surface, 1 at 0.8
      const skyBlue = new THREE.Color(0x87ceeb);
      const indigo = new THREE.Color(0x050520);
      bg.copy(skyBlue).lerp(indigo, Math.min(t, 1));
      this.fog.color.copy(bg);
      this.fog.density = 0.0005 * t;
    } else if (norm > 0.35) {
      // Ocean: bright blue → deep dark blue
      const t = (0.5 - norm) / 0.15;
      const shallow = new THREE.Color(0x1a8fcc);
      const deep = new THREE.Color(0x021828);
      bg.copy(shallow).lerp(deep, Math.min(t, 1));
      this.fog.color.copy(bg);
      this.fog.density = 0.002 * t;
    } else if (norm > 0.15) {
      // Crust: dark blue → brown
      const t = (0.35 - norm) / 0.2;
      const deepOcean = new THREE.Color(0x021828);
      const crustBrown = new THREE.Color(0x3b1f0a);
      bg.copy(deepOcean).lerp(crustBrown, Math.min(t, 1));
      this.fog.color.copy(bg);
      this.fog.density = 0.003 * t;
    } else {
      // Mantle → Core: brown → deep red
      const t = norm / 0.15;
      const coreRed = new THREE.Color(0x330000);
      const mantleBrown = new THREE.Color(0x3b1f0a);
      bg.copy(coreRed).lerp(mantleBrown, t);
      this.fog.color.copy(bg);
      this.fog.density = 0.003 * (1 - t);
    }
  }

  updateOverlays(norm) {
    for (const [id, centerY, radius] of this.labels) {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('visible', Math.abs(this.currentY - centerY) < radius);
    }
    for (const [id, centerY, radius] of this.trivias) {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('visible', Math.abs(this.currentY - centerY) < radius);
    }
    const distFromSurface = Math.abs(norm - 0.5);
    this.surfaceBtn.classList.toggle('visible', distFromSurface > 0.06);
  }

  updateHud(norm) {
    let altKm;
    if (norm >= 0.5) {
      altKm = ((norm - 0.5) / 0.5) * 400;
    } else {
      altKm = -((0.5 - norm) / 0.5) * 6371;
    }
    const sign = altKm >= 0 ? '+' : '';
    this.altitudeHud.textContent = `ALT ${sign}${Math.round(altKm)} km`;
  }

  onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }
}
