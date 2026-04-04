import * as THREE from 'three';
import { WORLD_HEIGHT } from '../../constants.js';
import { altKmToNorm } from '../../altitude.js';
const H = WORLD_HEIGHT;
function kmY(km) { return altKmToNorm(km) * H; }

export class Core {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.time = 0;

    // Crust/mantle layer planes at real depths
    const layers = [
      {km:-50,color:0x5c3a1e,op:0.7},{km:-200,color:0x4a2a10,op:0.75},
      {km:-1000,color:0x3b1a08,op:0.8},{km:-3000,color:0x2a0a00,op:0.85},
      {km:-5500,color:0x1a0500,op:0.9},
    ];
    for (const {km,color,op} of layers) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(160,160),
        new THREE.MeshStandardMaterial({color,transparent:true,opacity:op,side:THREE.DoubleSide,roughness:1}));
      m.rotation.x=-Math.PI/2;m.position.y=kmY(km);this.group.add(m);
    }

    // Debris particles spread through crust/mantle
    const dC=300,dP=new Float32Array(dC*3);
    const crustTop=kmY(-35),coreBot=kmY(-6371);
    for(let i=0;i<dC;i++){const i3=i*3,a=Math.random()*Math.PI*2,r=5+Math.random()*40;
      dP[i3]=Math.cos(a)*r;dP[i3+1]=coreBot+Math.random()*(crustTop-coreBot);dP[i3+2]=Math.sin(a)*r*0.3;}
    const dG=new THREE.BufferGeometry();dG.setAttribute('position',new THREE.BufferAttribute(dP,3));
    this.group.add(new THREE.Points(dG,new THREE.PointsMaterial({color:0x664422,size:0.5,sizeAttenuation:true,transparent:true,opacity:0.5})));

    // Fossils in crust (-35 to -100 km)
    for(let i=0;i<8;i++){const f=this.mkFossil();const a=Math.random()*Math.PI*2,r=5+Math.random()*30;
      f.position.set(Math.cos(a)*r,kmY(-35-Math.random()*65),Math.sin(a)*r*0.3);
      f.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);
      this.group.add(f);}
    // Bones (-50 to -80 km)
    for(let i=0;i<5;i++){const b=this.mkBone();const a=Math.random()*Math.PI*2,r=8+Math.random()*25;
      b.position.set(Math.cos(a)*r,kmY(-50-Math.random()*30),Math.sin(a)*r*0.3);
      b.rotation.z=Math.random()*Math.PI;this.group.add(b);}
    // Crystals in mantle (-500 to -2000 km)
    this.crystals=[];
    for(let i=0;i<12;i++){const c=this.mkCrystal();const a=Math.random()*Math.PI*2,r=5+Math.random()*25;
      c.position.set(Math.cos(a)*r,kmY(-500-Math.random()*1500),Math.sin(a)*r*0.3);
      c.rotation.set(Math.random(),Math.random(),Math.random());
      this.group.add(c);this.crystals.push(c);}
    // Magma blobs (-3000 to -5000 km)
    this.magma=[];
    for(let i=0;i<8;i++){const bl=new THREE.Mesh(new THREE.SphereGeometry(0.5+Math.random(),5,4),
      new THREE.MeshStandardMaterial({color:0xff4400,emissive:0xff2200,emissiveIntensity:1,flatShading:true,transparent:true,opacity:0.7}));
      const a=Math.random()*Math.PI*2,r=5+Math.random()*20;
      bl.position.set(Math.cos(a)*r,kmY(-3000-Math.random()*2000),Math.sin(a)*r*0.3);
      bl.userData.baseY=bl.position.y;this.group.add(bl);this.magma.push(bl);}
    // Core sphere at -6371 km
    this.coreMat=new THREE.MeshStandardMaterial({color:0xff3300,emissive:0xff4400,emissiveIntensity:2,roughness:0.3,metalness:0.1,flatShading:true});
    this.coreSphere=new THREE.Mesh(new THREE.IcosahedronGeometry(10,2),this.coreMat);
    this.coreSphere.position.y=kmY(-6371);
    this.coreSphere.userData.factId='fact-innercore';
    this.group.add(this.coreSphere);
    this.glow=new THREE.Mesh(new THREE.IcosahedronGeometry(14,1),new THREE.MeshBasicMaterial({color:0xff6600,transparent:true,opacity:0.15}));
    this.glow.position.y=kmY(-6371);this.group.add(this.glow);
    const light=new THREE.PointLight(0xff4400,3,200);light.position.y=kmY(-6371);this.group.add(light);
  }

  mkFossil(){const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:0xccbb99,flatShading:true,roughness:0.9});
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.8,0.25,6,12),m));
    const inner=new THREE.Mesh(new THREE.TorusGeometry(0.4,0.15,5,8),m);inner.position.x=0.3;g.add(inner);
    g.scale.setScalar(0.8+Math.random()*0.6);return g;}
  mkBone(){const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:0xeeddcc,flatShading:true,roughness:0.8});
    const s=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,2.5,5),m);s.rotation.z=Math.PI/2;g.add(s);
    const k1=new THREE.Mesh(new THREE.SphereGeometry(0.25,5,4),m);k1.position.x=-1.25;g.add(k1);
    const k2=new THREE.Mesh(new THREE.SphereGeometry(0.25,5,4),m);k2.position.x=1.25;g.add(k2);
    g.scale.setScalar(0.6+Math.random()*0.5);return g;}
  mkCrystal(){const g=new THREE.Group();const cols=[0x9966ff,0x44ddff,0x22ffaa,0xff66cc];
    const c=cols[Math.floor(Math.random()*cols.length)];
    const m=new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:0.3,flatShading:true,transparent:true,opacity:0.8});
    g.add(new THREE.Mesh(new THREE.ConeGeometry(0.3,1.5,5),m));
    for(let i=0;i<3;i++){const sh=new THREE.Mesh(new THREE.ConeGeometry(0.15,0.8,4),m);
      const a=(i/3)*Math.PI*2+Math.random()*0.5;sh.position.set(Math.cos(a)*0.4,-0.3,Math.sin(a)*0.4);g.add(sh);}
    g.scale.setScalar(0.8+Math.random()*0.8);return g;}
  update(){
    this.time+=0.02;
    this.coreMat.emissiveIntensity=1.5+Math.sin(this.time*2)*0.8;
    const s=1+Math.sin(this.time*1.5)*0.08;this.glow.scale.setScalar(s);
    this.glow.material.opacity=0.1+Math.sin(this.time)*0.06;
    this.coreSphere.rotation.y+=0.003;this.coreSphere.rotation.x+=0.001;
    for(const c of this.crystals)c.children[0].material.emissiveIntensity=0.2+Math.sin(this.time*3+c.position.x)*0.2;
    for(const b of this.magma){b.position.y=b.userData.baseY+Math.sin(this.time*1.5+b.position.x)*2;
      b.material.emissiveIntensity=0.8+Math.sin(this.time*2+b.position.z)*0.4;}
  }
}
