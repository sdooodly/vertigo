import * as THREE from 'three';
import { WORLD_HEIGHT } from '../../constants.js';
const H = WORLD_HEIGHT;

export class Surface {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.time = 0;
    const gY = H * 0.5;

    // Ground
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x3a7d44, roughness: 1, side: THREE.DoubleSide }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = gY - 0.1; this.group.add(ground);

    // Trees
    this.trees = [];
    for (let i = 0; i < 25; i++) {
      const t = this.createTree();
      const a = Math.random() * Math.PI * 2, r = 8 + Math.random() * 55;
      t.position.set(Math.cos(a)*r, gY, Math.sin(a)*r*0.3);
      t.scale.setScalar(0.6 + Math.random() * 0.8);
      this.group.add(t); this.trees.push(t);
    }
    // Buildings
    const bm = new THREE.MeshStandardMaterial({ color: 0x999999, flatShading: true });
    for (let i = 0; i < 6; i++) {
      const w=1+Math.random()*2, h=2+Math.random()*5, d=1+Math.random()*2;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), bm);
      const a = Math.random()*Math.PI*2, r = 15+Math.random()*30;
      b.position.set(Math.cos(a)*r, gY+h/2, Math.sin(a)*r*0.3); this.group.add(b);
    }
    // Ship
    this.ship = this.createShip(); this.ship.position.set(20, gY+0.5, 5); this.group.add(this.ship);
    // Birds
    this.birds = [];
    for (let i = 0; i < 12; i++) {
      const bird = this.createBird();
      bird.userData.baseY = gY+3+Math.random()*8;
      bird.userData.angle = Math.random()*Math.PI*2;
      bird.userData.radius = 10+Math.random()*25;
      bird.userData.speed = 0.3+Math.random()*0.4;
      this.group.add(bird); this.birds.push(bird);
    }
    // Balloon
    this.balloon = this.createBalloon(); this.balloon.position.set(-15, gY+15, 5); this.group.add(this.balloon);
    // Mt Everest
    this.everest = this.createMountain(); this.everest.position.set(-60, gY, -10); this.group.add(this.everest);
  }
  createTree() {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.3,2,5), new THREE.MeshStandardMaterial({color:0x6b4226,flatShading:true}));
    trunk.position.y=1; g.add(trunk);
    const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5,0), new THREE.MeshStandardMaterial({color:0x2d8a4e,flatShading:true}));
    canopy.position.y=2.8; g.add(canopy); return g;
  }
  createShip() {
    const g = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({color:0x8b4513,flatShading:true});
    g.add(new THREE.Mesh(new THREE.BoxGeometry(6,1.2,2), m));
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2,1,1.4), new THREE.MeshStandardMaterial({color:0xdddddd,flatShading:true}));
    cab.position.set(-0.5,1,0); g.add(cab);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,3,4), new THREE.MeshStandardMaterial({color:0x654321}));
    mast.position.set(1,2,0); g.add(mast); g.scale.setScalar(0.8); return g;
  }
  createBird() {
    const g = new THREE.Group();
    const wm = new THREE.MeshStandardMaterial({color:0x333333,flatShading:true});
    const lw = new THREE.Mesh(new THREE.BoxGeometry(1.2,0.05,0.4),wm); lw.position.x=-0.6; g.add(lw);
    const rw = new THREE.Mesh(new THREE.BoxGeometry(1.2,0.05,0.4),wm); rw.position.x=0.6; g.add(rw);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.15,4,4),wm));
    g.userData.leftWing=lw; g.userData.rightWing=rw; g.scale.setScalar(0.5); return g;
  }
  createBalloon() {
    const g = new THREE.Group();
    const env = new THREE.Mesh(new THREE.SphereGeometry(2.5,8,6), new THREE.MeshStandardMaterial({color:0xff4444,flatShading:true}));
    env.position.y=3; env.scale.set(1,1.3,1); g.add(env);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1,0.6,1), new THREE.MeshStandardMaterial({color:0x8b6914,flatShading:true})));
    return g;
  }
  createMountain() {
    const g = new THREE.Group();
    // Main peak
    const peak = new THREE.Mesh(new THREE.ConeGeometry(18, 35, 6), new THREE.MeshStandardMaterial({color:0x8B7355,flatShading:true,roughness:0.9}));
    peak.position.y = 17; g.add(peak);
    // Snow cap
    const snow = new THREE.Mesh(new THREE.ConeGeometry(6, 10, 6), new THREE.MeshStandardMaterial({color:0xffffff,flatShading:true}));
    snow.position.y = 30; g.add(snow);
    // Foothills
    for (let i = 0; i < 4; i++) {
      const h = 8+Math.random()*12, r = 10+Math.random()*8;
      const hill = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5), new THREE.MeshStandardMaterial({color:0x7a6b52,flatShading:true}));
      const a = (i/4)*Math.PI*2+Math.random()*0.5;
      hill.position.set(Math.cos(a)*20, h/2, Math.sin(a)*12); g.add(hill);
    }
    g.scale.setScalar(0.6);
    return g;
  }
  update() {
    this.time += 0.01;
    const sY = WORLD_HEIGHT * 0.5;
    this.ship.position.y = sY+0.5+Math.sin(this.time*2)*0.15;
    this.ship.rotation.z = Math.sin(this.time*1.5)*0.03;
    for (const b of this.birds) {
      b.userData.angle += b.userData.speed*0.016;
      const a = b.userData.angle;
      b.position.set(Math.cos(a)*b.userData.radius, b.userData.baseY+Math.sin(this.time*3)*0.5, Math.sin(a)*b.userData.radius*0.3);
      b.rotation.y = -a+Math.PI/2;
      const flap = Math.sin(this.time*12+a)*0.4;
      b.userData.leftWing.rotation.z = flap; b.userData.rightWing.rotation.z = -flap;
    }
    this.balloon.position.x = -15+Math.sin(this.time*0.3)*5;
    this.balloon.position.y = sY+15+Math.sin(this.time*0.5)*2;
  }
}
