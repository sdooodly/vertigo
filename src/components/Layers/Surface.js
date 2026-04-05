import * as THREE from 'three';
import { kmToY } from '../../altitude.js';
const M = (c) => new THREE.MeshStandardMaterial({color:c,flatShading:true});

export class Surface {
  constructor(scene) {
    this.group = new THREE.Group(); scene.add(this.group); this.time = 0;
    const Y = kmToY;
    const gY = Y(0);
    // Ground
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200,200), new THREE.MeshStandardMaterial({color:0x3a7d44,roughness:1,side:THREE.DoubleSide}));
    ground.rotation.x=-Math.PI/2; ground.position.y=gY-.1; this.group.add(ground);
    // Trees
    for (let i = 0; i < 20; i++) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(.2,.3,2,5),M(0x6b4226))).position.y=1;
      g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.5,0),M(0x2d8a4e))).position.y=2.8;
      const a=Math.random()*Math.PI*2, r=8+Math.random()*55;
      g.position.set(Math.cos(a)*r,gY,Math.sin(a)*r*.3);
      g.scale.setScalar(.6+Math.random()*.8); this.group.add(g);
    }
    // Burj Khalifa
    const bk = new THREE.Group();
    const bm = M(0xaabbcc);
    bk.add(new THREE.Mesh(new THREE.BoxGeometry(3,8,3),bm)).position.y=4;
    bk.add(new THREE.Mesh(new THREE.BoxGeometry(2,10,2),bm)).position.y=13;
    bk.add(new THREE.Mesh(new THREE.BoxGeometry(1,8,1),bm)).position.y=22;
    bk.add(new THREE.Mesh(new THREE.ConeGeometry(.3,5,4),bm)).position.y=28.5;
    bk.position.set(30,gY,10); bk.scale.setScalar(.5); this.group.add(bk);
    // Mt Everest
    const peakY = Y(8.849) - gY;
    const pk = new THREE.Mesh(new THREE.ConeGeometry(Math.max(peakY*.5,3),Math.max(peakY,5),6),M(0x8B7355));
    pk.position.y=Math.max(peakY,5)/2;
    const ev = new THREE.Group(); ev.add(pk);
    const snowH = Math.max(peakY*.3,2);
    const snow = new THREE.Mesh(new THREE.ConeGeometry(Math.max(snowH*.4,1),snowH,6),M(0xffffff));
    snow.position.y=Math.max(peakY,5)-snowH/2; ev.add(snow);
    ev.position.set(-60,gY,-10); this.group.add(ev);
    // Ship
    this.ship = new THREE.Group();
    this.ship.add(new THREE.Mesh(new THREE.BoxGeometry(6,1.2,2),M(0x8b4513)));
    this.ship.position.set(20,gY+.5,5); this.ship.scale.setScalar(.8); this.group.add(this.ship);
    // Birds
    this.birds = [];
    for (let i = 0; i < 10; i++) {
      const b = new THREE.Group();
      const wm = M(0x333333);
      b.userData.lw = b.add(new THREE.Mesh(new THREE.BoxGeometry(1.2,.05,.4),wm)); b.userData.lw.position.x=-.6;
      b.userData.rw = b.add(new THREE.Mesh(new THREE.BoxGeometry(1.2,.05,.4),wm)); b.userData.rw.position.x=.6;
      b.add(new THREE.Mesh(new THREE.SphereGeometry(.15,4,4),wm));
      b.scale.setScalar(.5);
      b.userData.baseY=gY+3+Math.random()*8; b.userData.angle=Math.random()*Math.PI*2;
      b.userData.radius=10+Math.random()*25; b.userData.speed=.3+Math.random()*.4;
      this.group.add(b); this.birds.push(b);
    }
    this.gY = gY;
  }
  update() {
    this.time += .01;
    this.ship.position.y = this.gY+.5+Math.sin(this.time*2)*.15;
    for (const b of this.birds) {
      b.userData.angle += b.userData.speed*.016;
      const a = b.userData.angle;
      b.position.set(Math.cos(a)*b.userData.radius,b.userData.baseY+Math.sin(this.time*3)*.5,Math.sin(a)*b.userData.radius*.3);
      b.rotation.y=-a+Math.PI/2;
      const flap=Math.sin(this.time*12+a)*.4;
      if(b.userData.lw)b.userData.lw.rotation.z=flap;
      if(b.userData.rw)b.userData.rw.rotation.z=-flap;
    }
  }
}
