import * as THREE from 'three';
import { kmToY } from '../../altitude.js';

export class Clouds {
  constructor(scene) {
    this.group = new THREE.Group(); scene.add(this.group); this.time = 0;
    const Y = kmToY;
    const count = 50;
    const geo = new THREE.IcosahedronGeometry(3,1);
    const mat = new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.55,flatShading:true,roughness:1});
    this.mesh = new THREE.InstancedMesh(geo,mat,count); this.count = count;
    const dummy = new THREE.Object3D(); this.bp = [];
    for (let i = 0; i < count; i++) {
      const a = Math.random()*Math.PI*2, r = 8+Math.random()*50;
      const alt = 2+Math.random()*10;
      const x = Math.cos(a)*r, y = Y(alt), z = Math.sin(a)*r*.3;
      dummy.position.set(x,y,z);
      const s = 1+Math.random()*2; dummy.scale.set(s*2,s*.5,s);
      dummy.updateMatrix(); this.mesh.setMatrixAt(i,dummy.matrix);
      this.bp.push(new THREE.Vector3(x,y,z));
    }
    this.mesh.instanceMatrix.needsUpdate = true; this.group.add(this.mesh);
    // Airplane at ~11km
    const pg = new THREE.Group();
    const pm = new THREE.MeshStandardMaterial({color:0xeeeeee,flatShading:true});
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.4,.3,5,6),pm); body.rotation.z=Math.PI/2; pg.add(body);
    pg.add(new THREE.Mesh(new THREE.BoxGeometry(6,.08,1.2),pm));
    pg.scale.setScalar(1.5); pg.position.set(0,Y(11),0);
    this.plane = pg; this.group.add(pg);
    this.dummy = new THREE.Object3D();
  }
  update() {
    this.time += .005;
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < this.count; i++) {
      this.mesh.getMatrixAt(i,m4); const b = this.bp[i];
      this.dummy.position.set(b.x+Math.sin(this.time+i*.5)*1.5,b.y,b.z+Math.cos(this.time+i*.3));
      const sx=new THREE.Vector3(),sy=new THREE.Vector3(),sz=new THREE.Vector3();
      m4.extractBasis(sx,sy,sz); this.dummy.scale.set(sx.length(),sy.length(),sz.length());
      this.dummy.updateMatrix(); this.mesh.setMatrixAt(i,this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    const r = 20;
    this.plane.position.x = Math.cos(this.time*.4)*r;
    this.plane.position.z = Math.sin(this.time*.4)*r*.3;
    this.plane.rotation.y = -this.time*.4+Math.PI/2;
  }
}
