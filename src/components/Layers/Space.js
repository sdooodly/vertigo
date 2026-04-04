import * as THREE from 'three';
import { kmToY, kmToYBottom } from '../../altitude.js';
const M = (c) => new THREE.MeshStandardMaterial({color:c,flatShading:true});

export class Space {
  constructor(scene, hemi) {
    this.group = new THREE.Group(); scene.add(this.group); this.elapsed = 0;
    const Y = hemi === 'bottom' ? kmToYBottom : kmToY;
    // Stars from 100km to 1000km
    const n = 2000, pos = new Float32Array(n * 3);
    const lo = Y(100), hi = Y(1000);
    const yMin = Math.min(lo, hi), yMax = Math.max(lo, hi);
    for (let i = 0; i < n; i++) {
      const i3 = i*3, a = Math.random()*Math.PI*2, r = 20+Math.random()*120;
      pos[i3]=Math.cos(a)*r; pos[i3+1]=yMin+Math.random()*(yMax-yMin); pos[i3+2]=Math.sin(a)*r*.5;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.group.add(new THREE.Points(geo, new THREE.PointsMaterial({color:0xffffff,size:.7,sizeAttenuation:true,transparent:true,opacity:.9})));
    // Satellites ~408km
    this.sats = [];
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.BoxGeometry(1.2,.6,.6), M(0x888899)));
      const pg = new THREE.BoxGeometry(3,.05,1.2), pm = M(0x2244aa);
      const lp = new THREE.Mesh(pg,pm); lp.position.x=-2.1; g.add(lp);
      const rp = new THREE.Mesh(pg,pm); rp.position.x=2.1; g.add(rp);
      g.userData = {or:15+Math.random()*25, os:.2+Math.random()*.3, oo:Math.random()*Math.PI*2, by:Y(300+Math.random()*200)};
      this.group.add(g); this.sats.push(g);
    }
    // Moon
    const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(6,1), M(0xcccccc));
    moon.position.set(-30, Y(800), -20); this.group.add(moon);
  }
  update() {
    this.elapsed += .016;
    for (const s of this.sats) {
      const {or,os,oo,by} = s.userData, a = this.elapsed*os+oo;
      s.position.set(Math.cos(a)*or, by, Math.sin(a)*or*.4); s.rotation.y = a;
    }
  }
}
