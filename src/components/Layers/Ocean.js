import * as THREE from 'three';
import { WORLD_HEIGHT } from '../../constants.js';
const H = WORLD_HEIGHT;

export class Ocean {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.time = 0;
    const sY = H * 0.5; // surface

    // Water surface
    const sg = new THREE.PlaneGeometry(200,200,32,32);
    this.surfaceMat = new THREE.MeshStandardMaterial({color:0x1a8fcc,transparent:true,opacity:0.6,side:THREE.DoubleSide,roughness:0.2,metalness:0.1});
    this.surface = new THREE.Mesh(sg, this.surfaceMat);
    this.surface.rotation.x = -Math.PI/2; this.surface.position.y = sY;
    this.group.add(this.surface);
    this.surfacePositions = sg.attributes.position.clone();

    // Depth layers
    const depths = [
      {y:H*0.47,color:0x1577aa,op:0.35},{y:H*0.44,color:0x0e5c88,op:0.45},
      {y:H*0.40,color:0x084466,op:0.5},{y:H*0.37,color:0x042d44,op:0.55},
      {y:H*0.33,color:0x021822,op:0.65},
    ];
    for (const {y,color,op} of depths) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(200,200),
        new THREE.MeshStandardMaterial({color,transparent:true,opacity:op,side:THREE.DoubleSide}));
      m.rotation.x=-Math.PI/2; m.position.y=y; this.group.add(m);
    }

    // Bubbles
    const bC=200, bP=new Float32Array(bC*3);
    for(let i=0;i<bC;i++){const i3=i*3,a=Math.random()*Math.PI*2,r=5+Math.random()*50;
      bP[i3]=Math.cos(a)*r;bP[i3+1]=H*0.33+Math.random()*H*0.17;bP[i3+2]=Math.sin(a)*r*0.3;}
    const bG=new THREE.BufferGeometry();bG.setAttribute('position',new THREE.BufferAttribute(bP,3));
    this.bubbles=new THREE.Points(bG,new THREE.PointsMaterial({color:0x66ccff,size:0.3,sizeAttenuation:true,transparent:true,opacity:0.4}));
    this.group.add(this.bubbles);

    // Fish schools
    this.fishSchools=[];
    for(let s=0;s<4;s++){
      const school=this.createFishSchool(15+Math.floor(Math.random()*10));
      const a=Math.random()*Math.PI*2,r=10+Math.random()*25;
      school.userData.centerX=Math.cos(a)*r; school.userData.centerZ=Math.sin(a)*r*0.3;
      school.userData.baseY=H*0.42+Math.random()*H*0.06;
      school.userData.speed=0.2+Math.random()*0.3; school.userData.angle=Math.random()*Math.PI*2;
      this.group.add(school); this.fishSchools.push(school);
    }
    // Whale
    this.whale=this.createWhale(); this.whale.position.set(0,H*0.44,0); this.group.add(this.whale);
    // Jellyfish
    this.jellyfish=[];
    for(let i=0;i<6;i++){
      const jf=this.createJellyfish();
      const a=Math.random()*Math.PI*2,r=8+Math.random()*30;
      jf.position.set(Math.cos(a)*r,H*0.38+Math.random()*H*0.06,Math.sin(a)*r*0.3);
      jf.userData.baseY=jf.position.y; this.group.add(jf); this.jellyfish.push(jf);
    }
    // Titanic
    this.titanic=this.createTitanic(); this.titanic.position.set(15,H*0.42,-5);
    this.titanic.rotation.z=0.15; this.titanic.rotation.y=0.3; this.group.add(this.titanic);
    // Submarine
    this.sub=this.createSubmarine(); this.sub.position.set(-20,H*0.36,0); this.group.add(this.sub);
    // Anglerfish (deep)
    this.angler=this.createAnglerfish(); this.angler.position.set(10,H*0.34,5); this.group.add(this.angler);
  }
  createFishSchool(count){const g=new THREE.Group();const m1=new THREE.MeshStandardMaterial({color:0xffaa33,flatShading:true});
    const m2=new THREE.MeshStandardMaterial({color:0x3399ff,flatShading:true});
    for(let i=0;i<count;i++){const f=new THREE.Group();
      const b=new THREE.Mesh(new THREE.ConeGeometry(0.15,0.6,4),Math.random()>0.5?m1:m2);b.rotation.z=-Math.PI/2;f.add(b);
      const t=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.25,0.05),b.material);t.position.x=-0.35;f.add(t);
      f.position.set((Math.random()-0.5)*4,(Math.random()-0.5)*2,(Math.random()-0.5)*2);
      f.scale.setScalar(0.5+Math.random()*0.5);g.add(f);}return g;}
  createWhale(){const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:0x445566,flatShading:true});
    const b=new THREE.Mesh(new THREE.SphereGeometry(2,6,5),m);b.scale.set(2.5,0.8,0.9);g.add(b);
    const t=new THREE.Mesh(new THREE.BoxGeometry(2,0.1,1.5),m);t.position.set(-4,0.2,0);t.rotation.z=0.2;g.add(t);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.15,4,4),new THREE.MeshBasicMaterial({color:0x111111})));
    g.children[2].position.set(3,0.3,0.8);g.scale.setScalar(1.2);return g;}
  createJellyfish(){const g=new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.6,8,6,0,Math.PI*2,0,Math.PI/2),
      new THREE.MeshStandardMaterial({color:0xff88cc,transparent:true,opacity:0.6,flatShading:true})));
    const tm=new THREE.MeshBasicMaterial({color:0xff66aa,transparent:true,opacity:0.4});
    for(let i=0;i<6;i++){const t=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,1.5,3),tm);
      const a=(i/6)*Math.PI*2;t.position.set(Math.cos(a)*0.3,-0.75,Math.sin(a)*0.3);g.add(t);}
    g.scale.setScalar(0.8);return g;}
  createTitanic(){const g=new THREE.Group();const rm=new THREE.MeshStandardMaterial({color:0x664433,flatShading:true,roughness:1});
    g.add(new THREE.Mesh(new THREE.BoxGeometry(8,1.5,2.5),rm));
    const d=new THREE.Mesh(new THREE.BoxGeometry(4,0.8,1.8),rm);d.position.set(0,1.1,0);g.add(d);
    for(let i=0;i<3;i++){const f=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.25,1.2,5),
      new THREE.MeshStandardMaterial({color:0x553322,flatShading:true}));f.position.set(-1.5+i*1.5,2,0);g.add(f);}
    g.scale.setScalar(0.7);return g;}
  createSubmarine(){const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:0x556677,flatShading:true});
    const b=new THREE.Mesh(new THREE.CapsuleGeometry(0.6,3,4,8),m);b.rotation.z=Math.PI/2;g.add(b);
    const tw=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.5,0.4),m);tw.position.y=0.7;g.add(tw);
    g.scale.setScalar(1.5);return g;}
  createAnglerfish(){const g=new THREE.Group();
    const m=new THREE.MeshStandardMaterial({color:0x222233,flatShading:true});
    const b=new THREE.Mesh(new THREE.SphereGeometry(0.8,5,4),m);b.scale.set(1.3,1,1);g.add(b);
    // Lure light
    const lure=new THREE.Mesh(new THREE.SphereGeometry(0.15,4,4),new THREE.MeshBasicMaterial({color:0x44ffff}));
    lure.position.set(1.2,0.8,0);g.add(lure);
    const lureLight=new THREE.PointLight(0x44ffff,0.5,10);lureLight.position.copy(lure.position);g.add(lureLight);
    // Fin
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.6,0.3,0.05),m)).position.set(-0.8,0.3,0);
    g.scale.setScalar(1.5);return g;}
  update(){
    this.time+=0.015;
    const pos=this.surface.geometry.attributes.position,base=this.surfacePositions;
    for(let i=0;i<pos.count;i++){const x=base.getX(i),z=base.getZ(i);
      pos.setZ(i,base.getZ(i)+Math.sin(x*0.1+this.time)*0.5+Math.cos(z*0.1+this.time*0.7)*0.3);}
    pos.needsUpdate=true;
    const bp=this.bubbles.geometry.attributes.position;
    for(let i=0;i<bp.count;i++){let y=bp.getY(i)+0.03;if(y>H*0.50)y=H*0.33;bp.setY(i,y);}
    bp.needsUpdate=true;
    for(const s of this.fishSchools){s.userData.angle+=s.userData.speed*0.01;const a=s.userData.angle;
      s.position.set(s.userData.centerX+Math.cos(a)*8,s.userData.baseY+Math.sin(this.time*2)*0.5,
        s.userData.centerZ+Math.sin(a)*8*0.3);s.rotation.y=-a+Math.PI/2;}
    this.whale.position.x=Math.cos(this.time*0.1)*30;this.whale.position.z=Math.sin(this.time*0.1)*10;
    this.whale.rotation.y=-this.time*0.1+Math.PI/2;
    for(const jf of this.jellyfish){jf.position.y=jf.userData.baseY+Math.sin(this.time*1.5+jf.position.x)*1;
      jf.scale.y=0.8+Math.sin(this.time*3+jf.position.z)*0.15;}
    this.sub.position.x=-20+Math.cos(this.time*0.15)*15;this.sub.position.z=Math.sin(this.time*0.15)*5;
    this.sub.rotation.y=-this.time*0.15+Math.PI/2;
    this.angler.position.x=10+Math.sin(this.time*0.2)*5;this.angler.rotation.y=Math.sin(this.time*0.2)*0.3;
  }
}
