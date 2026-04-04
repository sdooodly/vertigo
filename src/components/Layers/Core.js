import * as THREE from 'three';
import { kmToY } from '../../altitude.js';
import { WORLD_HEIGHT } from '../../constants.js';
const H = WORLD_HEIGHT;
const M = (c) => new THREE.MeshStandardMaterial({color:c,flatShading:true});

export class Core {
  constructor(scene) {
    this.group = new THREE.Group(); scene.add(this.group); this.time = 0;
    const coreY = H * 0.5; // core is at center of world
    // Crust/mantle planes
    [[-50,0x5c3a1e,.7],[-500,0x4a2a10,.75],[-1500,0x3b1a08,.8],[-3500,0x2a0a00,.85],[-5500,0x1a0500,.9]].forEach(([km,c,o])=>{
      const m=new THREE.Mesh(new THREE.PlaneGeometry(160,160),new THREE.MeshStandardMaterial({color:c,transparent:true,opacity:o,side:THREE.DoubleSide,roughness:1}));
      m.rotation.x=-Math.PI/2;m.position.y=kmToY(km);this.group.add(m);
      // Mirror on bottom half
      const m2=m.clone();m2.position.y=H-kmToY(km);this.group.add(m2);
    });
    // Debris
    const dC=300,dP=new Float32Array(dC*3);
    for(let i=0;i<dC;i++){const i3=i*3,a=Math.random()*Math.PI*2,r=5+Math.random()*40;
      dP[i3]=Math.cos(a)*r;dP[i3+1]=coreY-150+Math.random()*300;dP[i3+2]=Math.sin(a)*r*.3;}
    const dG=new THREE.BufferGeometry();dG.setAttribute('position',new THREE.BufferAttribute(dP,3));
    this.group.add(new THREE.Points(dG,new THREE.PointsMaterial({color:0x664422,size:.5,sizeAttenuation:true,transparent:true,opacity:.5})));
    // Crystals
    this.crystals=[];
    for(let i=0;i<12;i++){const g=new THREE.Group();const cols=[0x9966ff,0x44ddff,0x22ffaa,0xff66cc];
      const c=cols[Math.floor(Math.random()*cols.length)];
      const cm=new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.3,flatShading:true,transparent:true,opacity:.8});
      g.add(new THREE.Mesh(new THREE.ConeGeometry(.3,1.5,5),cm));
      const a=Math.random()*Math.PI*2,r=5+Math.random()*25;
      g.position.set(Math.cos(a)*r,coreY-80+Math.random()*160,Math.sin(a)*r*.3);
      g.rotation.set(Math.random(),Math.random(),Math.random());
      g.scale.setScalar(.8+Math.random()*.8);this.group.add(g);this.crystals.push(g);}
    // Magma
    this.magma=[];
    for(let i=0;i<8;i++){const bl=new THREE.Mesh(new THREE.SphereGeometry(.5+Math.random(),5,4),
      new THREE.MeshStandardMaterial({color:0xff4400,emissive:0xff2200,emissiveIntensity:1,flatShading:true,transparent:true,opacity:.7}));
      const a=Math.random()*Math.PI*2,r=5+Math.random()*20;
      bl.position.set(Math.cos(a)*r,coreY-40+Math.random()*80,Math.sin(a)*r*.3);
      bl.userData.baseY=bl.position.y;this.group.add(bl);this.magma.push(bl);}
    // Core sphere
    this.coreMat=new THREE.MeshStandardMaterial({color:0xff3300,emissive:0xff4400,emissiveIntensity:2,roughness:.3,metalness:.1,flatShading:true});
    this.coreSphere=new THREE.Mesh(new THREE.IcosahedronGeometry(10,2),this.coreMat);
    this.coreSphere.position.y=coreY;this.group.add(this.coreSphere);
    this.glow=new THREE.Mesh(new THREE.IcosahedronGeometry(14,1),new THREE.MeshBasicMaterial({color:0xff6600,transparent:true,opacity:.15}));
    this.glow.position.y=coreY;this.group.add(this.glow);
    const light=new THREE.PointLight(0xff4400,3,300);light.position.y=coreY;this.group.add(light);
  }
  update(){
    this.time+=.02;
    this.coreMat.emissiveIntensity=1.5+Math.sin(this.time*2)*.8;
    const s=1+Math.sin(this.time*1.5)*.08;this.glow.scale.setScalar(s);
    this.glow.material.opacity=.1+Math.sin(this.time)*.06;
    this.coreSphere.rotation.y+=.003;this.coreSphere.rotation.x+=.001;
    for(const c of this.crystals)c.children[0].material.emissiveIntensity=.2+Math.sin(this.time*3+c.position.x)*.2;
    for(const b of this.magma){b.position.y=b.userData.baseY+Math.sin(this.time*1.5+b.position.x)*2;
      b.material.emissiveIntensity=.8+Math.sin(this.time*2+b.position.z)*.4;}
  }
}
