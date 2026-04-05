import * as THREE from 'three';
import { kmToY } from '../../altitude.js';
const M = (c) => new THREE.MeshStandardMaterial({color:c,flatShading:true});

export class Space {
  constructor(scene) {
    this.group = new THREE.Group(); scene.add(this.group); this.elapsed = 0;

    // Stars
    const n = 2500, pos = new Float32Array(n * 3);
    const lo = kmToY(100), hi = kmToY(1.5e8);
    for (let i = 0; i < n; i++) {
      const i3=i*3, a=Math.random()*Math.PI*2, r=20+Math.random()*150;
      pos[i3]=Math.cos(a)*r; pos[i3+1]=lo+Math.random()*(hi-lo); pos[i3+2]=Math.sin(a)*r*.5;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.group.add(new THREE.Points(geo, new THREE.PointsMaterial({color:0xffffff,size:.7,sizeAttenuation:true,transparent:true,opacity:.9})));

    // ISS satellites at 408 km
    this.sats = [];
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.BoxGeometry(1.2,.6,.6), M(0x888899)));
      const pm = M(0x2244aa), pg = new THREE.BoxGeometry(3,.05,1.2);
      g.add(new THREE.Mesh(pg,pm)).position.x=-2.1;
      g.add(new THREE.Mesh(pg,pm)).position.x=2.1;
      g.userData = {or:15+Math.random()*25, os:.2+Math.random()*.3, oo:Math.random()*Math.PI*2, by:kmToY(350+Math.random()*120), factId:'fact-iss'};
      this.group.add(g); this.sats.push(g);
    }

    // Moon at 384,400 km (radius 1,737 km → scale ~3 units)
    this.moon = new THREE.Mesh(new THREE.IcosahedronGeometry(5,1), M(0xcccccc));
    this.moon.position.set(-20, kmToY(384400), -15);
    this.moon.userData.factId = 'fact-moon'; this.group.add(this.moon);

    // Venus at ~41.4M km (radius 6,052 km ≈ 0.95× Earth → ~6 units)
    this.venus = new THREE.Mesh(new THREE.IcosahedronGeometry(6,1),
      new THREE.MeshStandardMaterial({color:0xddaa55,flatShading:true,roughness:.7}));
    this.venus.position.set(25, kmToY(41400000), 10);
    this.venus.userData.factId = 'fact-venus'; this.group.add(this.venus);

    // Mercury at ~91.7M km (radius 2,440 km ≈ 0.38× Earth → ~2.5 units)
    this.mercury = new THREE.Mesh(new THREE.IcosahedronGeometry(2.5,1),
      new THREE.MeshStandardMaterial({color:0x999999,flatShading:true,roughness:.9}));
    this.mercury.position.set(-15, kmToY(91700000), -8);
    this.mercury.userData.factId = 'fact-mercury'; this.group.add(this.mercury);

    // Sun at 149.6M km (radius 696,340 km ≈ 109× Earth → huge, but we show ~20 units as a glow)
    this.sun = new THREE.Mesh(new THREE.IcosahedronGeometry(20,2),
      new THREE.MeshBasicMaterial({color:0xffdd44,transparent:true,opacity:.8}));
    this.sun.position.set(0, kmToY(149600000), 0);
    this.sun.userData.factId = 'fact-sun'; this.group.add(this.sun);
    const corona = new THREE.Mesh(new THREE.IcosahedronGeometry(30,1),
      new THREE.MeshBasicMaterial({color:0xffaa22,transparent:true,opacity:.2}));
    corona.position.copy(this.sun.position); this.group.add(corona);
    const sunLight = new THREE.PointLight(0xffdd44, 3, 500);
    sunLight.position.copy(this.sun.position); this.group.add(sunLight);
  }

  update() {
    this.elapsed += .016;
    for (const s of this.sats) {
      const {or,os,oo,by} = s.userData, a = this.elapsed*os+oo;
      s.position.set(Math.cos(a)*or, by, Math.sin(a)*or*.4); s.rotation.y = a;
    }
    // Slow rotation on celestial bodies
    this.moon.rotation.y += .001;
    this.venus.rotation.y += .0008;
    this.mercury.rotation.y += .0012;
    this.sun.rotation.y += .0005;
  }
}
