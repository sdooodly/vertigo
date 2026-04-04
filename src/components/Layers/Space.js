import * as THREE from 'three';
import { WORLD_HEIGHT } from '../../constants.js';
const H = WORLD_HEIGHT;

export class Space {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.elapsed = 0;
    const starCount = 2500, pos = new Float32Array(starCount*3);
    for (let i=0;i<starCount;i++){const i3=i*3,a=Math.random()*Math.PI*2,r=20+Math.random()*120;
      pos[i3]=Math.cos(a)*r;pos[i3+1]=H*0.72+Math.random()*H*0.3;pos[i3+2]=Math.sin(a)*r*0.5;}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    this.stars=new THREE.Points(geo,new THREE.PointsMaterial({color:0xffffff,size:0.7,sizeAttenuation:true,transparent:true,opacity:0.9}));
    this.group.add(this.stars);
    this.satellites=[];
    for(let i=0;i<5;i++){const sat=this.createSatellite();
      sat.userData.orbitRadius=15+Math.random()*25;sat.userData.orbitSpeed=0.2+Math.random()*0.3;
      sat.userData.orbitOffset=Math.random()*Math.PI*2;sat.userData.baseY=H*0.82+Math.random()*H*0.12;
      this.group.add(sat);this.satellites.push(sat);}
    const moonMat=new THREE.MeshStandardMaterial({color:0xcccccc,roughness:0.9,flatShading:true});
    this.moon=new THREE.Mesh(new THREE.IcosahedronGeometry(6,1),moonMat);
    this.moon.position.set(-30,H*0.95,-20);this.group.add(this.moon);
  }
  createSatellite(){const g=new THREE.Group();const bm=new THREE.MeshStandardMaterial({color:0x888899,flatShading:true});
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.2,0.6,0.6),bm));
    const pm=new THREE.MeshStandardMaterial({color:0x2244aa,flatShading:true});const pg=new THREE.BoxGeometry(3,0.05,1.2);
    const lp=new THREE.Mesh(pg,pm);lp.position.x=-2.1;g.add(lp);
    const rp=new THREE.Mesh(pg,pm);rp.position.x=2.1;g.add(rp);
    const ant=new THREE.Mesh(new THREE.ConeGeometry(0.3,0.8,4),new THREE.MeshStandardMaterial({color:0xaaaaaa,flatShading:true}));
    ant.position.y=0.7;g.add(ant);return g;}
  update(){this.elapsed+=0.016;
    for(const sat of this.satellites){const{orbitRadius,orbitSpeed,orbitOffset,baseY}=sat.userData;
      const a=this.elapsed*orbitSpeed+orbitOffset;
      sat.position.set(Math.cos(a)*orbitRadius,baseY,Math.sin(a)*orbitRadius*0.4);sat.rotation.y=a;}}
}
