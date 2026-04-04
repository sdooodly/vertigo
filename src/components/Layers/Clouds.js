import * as THREE from 'three';
import { WORLD_HEIGHT } from '../../constants.js';
import { altKmToNorm } from '../../altitude.js';
const H = WORLD_HEIGHT;
function kmY(km) { return altKmToNorm(km) * H; }

export class Clouds {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.time = 0;
    // Clouds from ~2km to ~12km altitude
    const count = 60;
    const geo = new THREE.IcosahedronGeometry(3,1);
    const mat = new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:0.55,flatShading:true,roughness:1});
    this.mesh = new THREE.InstancedMesh(geo,mat,count);
    this.count = count;
    const dummy = new THREE.Object3D();
    this.basePositions = [];
    for(let i=0;i<count;i++){
      const angle=Math.random()*Math.PI*2,r=8+Math.random()*50;
      const alt=2+Math.random()*10; // 2-12 km
      const x=Math.cos(angle)*r,y=kmY(alt),z=Math.sin(angle)*r*0.3;
      dummy.position.set(x,y,z);
      const s=1+Math.random()*2;dummy.scale.set(s*2,s*0.5,s);
      dummy.updateMatrix();this.mesh.setMatrixAt(i,dummy.matrix);
      this.basePositions.push(new THREE.Vector3(x,y,z));
    }
    this.mesh.instanceMatrix.needsUpdate=true;
    this.group.add(this.mesh);
    // Airplane at ~11km
    this.plane=this.mkPlane();this.plane.position.set(0,kmY(11),0);
    this.plane.userData.factId='fact-jets';this.group.add(this.plane);
    this.dummy=new THREE.Object3D();
  }
  mkPlane(){const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:0xeeeeee,flatShading:true});
    const b=new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.3,5,6),m);b.rotation.z=Math.PI/2;g.add(b);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(6,0.08,1.2),m));
    const t=new THREE.Mesh(new THREE.BoxGeometry(0.08,1.2,0.6),m);t.position.set(-2.2,0.6,0);g.add(t);
    g.scale.setScalar(1.5);return g;}
  update(){
    this.time+=0.005;
    const mat4=new THREE.Matrix4();
    for(let i=0;i<this.count;i++){this.mesh.getMatrixAt(i,mat4);const bp=this.basePositions[i];
      this.dummy.position.set(bp.x+Math.sin(this.time+i*0.5)*1.5,bp.y,bp.z+Math.cos(this.time+i*0.3)*1);
      const sx=new THREE.Vector3(),sy=new THREE.Vector3(),sz=new THREE.Vector3();
      mat4.extractBasis(sx,sy,sz);this.dummy.scale.set(sx.length(),sy.length(),sz.length());
      this.dummy.updateMatrix();this.mesh.setMatrixAt(i,this.dummy.matrix);}
    this.mesh.instanceMatrix.needsUpdate=true;
    const r=20;this.plane.position.x=Math.cos(this.time*0.4)*r;
    this.plane.position.z=Math.sin(this.time*0.4)*r*0.3;
    this.plane.rotation.y=-this.time*0.4+Math.PI/2;
  }
}
