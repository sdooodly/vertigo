import * as THREE from 'three';
import { kmToY } from '../../altitude.js';

const FM = (c) => new THREE.MeshStandardMaterial({
  color: c, flatShading: true
});

export class Ocean {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.time = 0;
    const Y = kmToY;
    this.topY = Y(0);
    this.botY = Y(-11);
    const yMin = Math.min(this.topY, this.botY);
    const yMax = Math.max(this.topY, this.botY);

    // Water surface
    const sg = new THREE.PlaneGeometry(200, 200, 32, 32);
    const sm = new THREE.MeshStandardMaterial({
      color: 0x1a8fcc, transparent: true,
      opacity: 0.6, side: THREE.DoubleSide, roughness: 0.2
    });
    this.surface = new THREE.Mesh(sg, sm);
    this.surface.rotation.x = -Math.PI / 2;
    this.surface.position.y = this.topY;
    this.group.add(this.surface);
    this.surfPos = sg.attributes.position.clone();

    // Depth planes
    const dp = [
      [-0.1, 0x1a8fcc, 0.3], [-1, 0x0e5c88, 0.4],
      [-4, 0x042d44, 0.55], [-10, 0x010d14, 0.65]
    ];
    for (const [km, c, o] of dp) {
      const mat = new THREE.MeshStandardMaterial({
        color: c, transparent: true, opacity: o,
        side: THREE.DoubleSide
      });
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200), mat
      );
      m.rotation.x = -Math.PI / 2;
      m.position.y = Y(km);
      this.group.add(m);
    }

    // Bubbles
    const bC = 200;
    const bP = new Float32Array(bC * 3);
    for (let i = 0; i < bC; i++) {
      const i3 = i * 3;
      const a = Math.random() * Math.PI * 2;
      const r = 5 + Math.random() * 50;
      bP[i3] = Math.cos(a) * r;
      bP[i3 + 1] = yMin + Math.random() * (yMax - yMin);
      bP[i3 + 2] = Math.sin(a) * r * 0.3;
    }
    const bG = new THREE.BufferGeometry();
    bG.setAttribute('position',
      new THREE.BufferAttribute(bP, 3));
    this.bubbles = new THREE.Points(bG,
      new THREE.PointsMaterial({
        color: 0x66ccff, size: 0.4,
        sizeAttenuation: true, transparent: true, opacity: 0.4
      }));
    this.group.add(this.bubbles);

    // Whale at -100m
    this.whale = this._mkBody(0x445566);
    this.whale.position.set(0, Y(-0.1), 0);
    this.group.add(this.whale);

    // Titanic at -3784m
    this.titanic = this._mkShip();
    this.titanic.position.set(12, Y(-3.784), -3);
    this.titanic.userData.factId = 'fact-titanic';
    this.group.add(this.titanic);

    // Trench marker at -10935m
    const tMat = new THREE.MeshBasicMaterial({
      color: 0x44aaff, transparent: true, opacity: 0.6
    });
    this.trench = new THREE.Mesh(
      new THREE.SphereGeometry(3, 6, 6), tMat
    );
    this.trench.position.set(0, Y(-10.935), 0);
    this.trench.userData.factId = 'fact-mariana';
    this.group.add(this.trench);

    // Jellyfish
    this.jelly = [];
    for (let i = 0; i < 6; i++) {
      const jm = new THREE.MeshStandardMaterial({
        color: 0xff88cc, transparent: true,
        opacity: 0.5, flatShading: true
      });
      const g = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 6, 4), jm
      );
      const a = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * 30;
      g.position.set(
        Math.cos(a) * r,
        Y(-0.5 - Math.random() * 5),
        Math.sin(a) * r * 0.3
      );
      g.userData.baseY = g.position.y;
      g.scale.setScalar(1.5);
      this.group.add(g);
      this.jelly.push(g);
    }
  }

  _mkBody(c) {
    const g = new THREE.Group();
    const m = FM(c);
    const b = new THREE.Mesh(
      new THREE.SphereGeometry(2, 6, 5), m
    );
    b.scale.set(2.5, 0.8, 0.9);
    g.add(b);
    g.scale.setScalar(1.5);
    return g;
  }

  _mkShip() {
    const g = new THREE.Group();
    const rm = FM(0x664433);
    g.add(new THREE.Mesh(
      new THREE.BoxGeometry(8, 1.5, 2.5), rm
    ));
    const d = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.8, 1.8), rm
    );
    d.position.y = 1.1;
    g.add(d);
    g.scale.setScalar(2);
    return g;
  }

  update() {
    this.time += 0.015;
    // Waves
    const pos = this.surface.geometry.attributes.position;
    const base = this.surfPos;
    for (let i = 0; i < pos.count; i++) {
      const x = base.getX(i);
      const z = base.getZ(i);
      pos.setZ(i, base.getZ(i) +
        Math.sin(x * 0.1 + this.time) * 0.5 +
        Math.cos(z * 0.1 + this.time * 0.7) * 0.3);
    }
    pos.needsUpdate = true;

    // Bubbles
    const bp = this.bubbles.geometry.attributes.position;
    for (let i = 0; i < bp.count; i++) {
      let y = bp.getY(i) + 0.05;
      if (y > this.topY) y = this.botY;
      bp.setY(i, y);
    }
    bp.needsUpdate = true;

    // Whale
    this.whale.position.x = Math.cos(this.time * 0.1) * 30;
    this.whale.rotation.y = -this.time * 0.1 + Math.PI / 2;

    // Jellyfish
    for (const j of this.jelly) {
      j.position.y = j.userData.baseY +
        Math.sin(this.time * 1.5 + j.position.x) * 2;
    }
  }
}
