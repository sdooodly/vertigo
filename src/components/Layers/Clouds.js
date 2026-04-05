import * as THREE from 'three';
import { kmToY } from '../../altitude.js';

export class Clouds {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.time = 0;

    const count = 50;
    const geo = new THREE.IcosahedronGeometry(3, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff, transparent: true, opacity: 0.55,
      flatShading: true, roughness: 1
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, count);
    this.count = count;

    const dummy = new THREE.Object3D();
    this.bp = [];
    this.scales = []; // cache scales to avoid extractBasis

    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * 50;
      const alt = 2 + Math.random() * 10;
      const x = Math.cos(a) * r;
      const y = kmToY(alt);
      const z = Math.sin(a) * r * 0.3;
      const s = 1 + Math.random() * 2;
      dummy.position.set(x, y, z);
      dummy.scale.set(s * 2, s * 0.5, s);
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
      this.bp.push(new THREE.Vector3(x, y, z));
      this.scales.push(new THREE.Vector3(s * 2, s * 0.5, s));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.group.add(this.mesh);

    // Airplane
    const pm = new THREE.MeshStandardMaterial({
      color: 0xeeeeee, flatShading: true
    });
    this.plane = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.3, 5, 6), pm
    );
    body.rotation.z = Math.PI / 2;
    this.plane.add(body);
    this.plane.add(new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.08, 1.2), pm
    ));
    this.plane.scale.setScalar(1.5);
    this.plane.position.set(0, kmToY(11), 0);
    this.plane.userData.factId = 'fact-jets';
    this.group.add(this.plane);

    this.dummy = new THREE.Object3D();
  }

  update() {
    this.time += 0.005;
    for (let i = 0; i < this.count; i++) {
      const b = this.bp[i];
      const sc = this.scales[i];
      this.dummy.position.set(
        b.x + Math.sin(this.time + i * 0.5) * 1.5,
        b.y,
        b.z + Math.cos(this.time + i * 0.3)
      );
      this.dummy.scale.copy(sc);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;

    const r = 20;
    this.plane.position.x = Math.cos(this.time * 0.4) * r;
    this.plane.position.z = Math.sin(this.time * 0.4) * r * 0.3;
    this.plane.rotation.y = -this.time * 0.4 + Math.PI / 2;
  }
}
