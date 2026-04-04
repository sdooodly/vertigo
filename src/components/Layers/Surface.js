import * as THREE from 'three';
import { WORLD_HEIGHT } from '../../constants.js';
import { altKmToNorm } from '../../altitude.js';
const H = WORLD_HEIGHT;
function kmY(km) { return altKmToNorm(km) * H; }

export class Surface {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.time = 0;
    const gY = kmY(0); // sea level

    // Ground
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200,200),
      new THREE.MeshStandardMaterial({color:0x3a7d44,roughness:1,side:THREE.DoubleSide}));
    ground.rotation.x=-Math.PI/2;ground.position.y=gY-0.1;this.group.add(ground);

    // Trees (avg 10-20m tall = 0.01-0.02 km)
    for(let i=0;i<25;i++){
      const t=this.mkTree();const a=Math.random()*Math.PI*2,r=8+Math.random()*55;
      t.position.set(Math.cos(a)*r,gY,Math.sin(a)*r*0.3);
      t.scale.setScalar(0.6+Math.random()*0.8);this.group.add(t);
    }

    // Burj Khalifa (828m = 0.828 km)
    this.burj=this.mkBurjKhalifa();
    this.burj.position.set(30,gY,10);
    this.burj.userData.factId='fact-everest';
    this.group.add(this.burj);

    // Small buildings
    const bm=new THREE.MeshStandardMaterial({color:0x999999,flatShading:true});
    for(let i=0;i<6;i++){
      const w=1+Math.random()*2,h=2+Math.random()*5,d=1+Math.random()*2;
      const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),bm);
      const a=Math.random()*Math.PI*2,r=15+Math.random()*30;
      b.position.set(Math.cos(a)*r,gY+h/2,Math.sin(a)*r*0.3);this.group.add(b);
    }

    // Ship
    this.ship=this.mkShip();this.ship.position.set(20,gY+0.5,5);this.group.add(this.ship);

    // Birds
    this.birds=[];
    for(let i=0;i<12;i++){
      const bird=this.mkBird();
      bird.userData.baseY=gY+3+Math.random()*8;
      bird.userData.angle=Math.random()*Math.PI*2;
      bird.userData.radius=10+Math.random()*25;
      bird.userData.speed=0.3+Math.random()*0.4;
      this.group.add(bird);this.birds.push(bird);
    }

    // Balloon
    this.balloon=this.mkBalloon();this.balloon.position.set(-15,gY+15,5);this.group.add(this.balloon);

    // Mt Everest (8.849 km) — scaled to reach correct Y
    this.everest=this.mkMountain();
    this.everest.position.set(-60,gY,-10);
    this.everest.userData.factId='fact-everest';
    this.group.add(this.everest);
  }
  mkTree(){const g=new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.3,2,5),new THREE.MeshStandardMaterial({color:0x6b4226,flatShading:true}))).position.y=1;
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.5,0),new THREE.MeshStandardMaterial({color:0x2d8a4e,flatShading:true}))).position.y=2.8;
    return g;}
  mkBurjKhalifa(){const g=new THREE.Group();
    const m=new THREE.MeshStandardMaterial({color:0xaabbcc,flatShading:true});
    // Tapered tower (828m real, visual ~25 units tall)
    const base=new THREE.Mesh(new THREE.BoxGeometry(3,8,3),m);base.position.y=4;g.add(base);
    const mid=new THREE.Mesh(new THREE.BoxGeometry(2,10,2),m);mid.position.y=13;g.add(mid);
    const top=new THREE.Mesh(new THREE.BoxGeometry(1,8,1),m);top.position.y=22;g.add(top);
    const spire=new THREE.Mesh(new THREE.ConeGeometry(0.3,5,4),m);spire.position.y=28.5;g.add(spire);
    g.scale.setScalar(0.5);return g;}
  mkShip(){const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:0x8b4513,flatShading:true});
    g.add(new THREE.Mesh(new THREE.BoxGeometry(6,1.2,2),m));
    const cab=new THREE.Mesh(new THREE.BoxGeometry(2,1,1.4),new THREE.MeshStandardMaterial({color:0xdddddd,flatShading:true}));
    cab.position.set(-0.5,1,0);g.add(cab);g.scale.setScalar(0.8);return g;}
  mkBird(){const g=new THREE.Group();const wm=new THREE.MeshStandardMaterial({color:0x333333,flatShading:true});
    const lw=new THREE.Mesh(new THREE.BoxGeometry(1.2,0.05,0.4),wm);lw.position.x=-0.6;g.add(lw);
    const rw=new THREE.Mesh(new THREE.BoxGeometry(1.2,0.05,0.4),wm);rw.position.x=0.6;g.add(rw);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.15,4,4),wm));
    g.userData.leftWing=lw;g.userData.rightWing=rw;g.scale.setScalar(0.5);return g;}
  mkBalloon(){const g=new THREE.Group();
    const env=new THREE.Mesh(new THREE.SphereGeometry(2.5,8,6),new THREE.MeshStandardMaterial({color:0xff4444,flatShading:true}));
    env.position.y=3;env.scale.set(1,1.3,1);g.add(env);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1,0.6,1),new THREE.MeshStandardMaterial({color:0x8b6914,flatShading:true})));
    return g;}
  mkMountain(){const g=new THREE.Group();
    // Peak height in Y-units: kmY(8.849) - kmY(0)
    const peakY = kmY(8.849) - kmY(0);
    const peak=new THREE.Mesh(new THREE.ConeGeometry(peakY*0.5,peakY,6),
      new THREE.MeshStandardMaterial({color:0x8B7355,flatShading:true,roughness:0.9}));
    peak.position.y=peakY/2;g.add(peak);
    // Snow cap (top 30%)
    const snowH=peakY*0.3;
    const snow=new THREE.Mesh(new THREE.ConeGeometry(snowH*0.4,snowH,6),
      new THREE.MeshStandardMaterial({color:0xffffff,flatShading:true}));
    snow.position.y=peakY-snowH/2;g.add(snow);
    // Foothills
    for(let i=0;i<4;i++){
      const h=peakY*0.3+Math.random()*peakY*0.3;
      const hill=new THREE.Mesh(new THREE.ConeGeometry(h*0.6,h,5),
        new THREE.MeshStandardMaterial({color:0x7a6b52,flatShading:true}));
      const a=(i/4)*Math.PI*2+Math.random()*0.5;
      hill.position.set(Math.cos(a)*peakY*0.4,h/2,Math.sin(a)*peakY*0.25);g.add(hill);
    }
    return g;}
  update(){
    this.time+=0.01;const gY=kmY(0);
    this.ship.position.y=gY+0.5+Math.sin(this.time*2)*0.15;
    this.ship.rotation.z=Math.sin(this.time*1.5)*0.03;
    for(const b of this.birds){
      b.userData.angle+=b.userData.speed*0.016;const a=b.userData.angle;
      b.position.set(Math.cos(a)*b.userData.radius,b.userData.baseY+Math.sin(this.time*3)*0.5,Math.sin(a)*b.userData.radius*0.3);
      b.rotation.y=-a+Math.PI/2;
      const flap=Math.sin(this.time*12+a)*0.4;
      b.userData.leftWing.rotation.z=flap;b.userData.rightWing.rotation.z=-flap;
    }
    this.balloon.position.x=-15+Math.sin(this.time*0.3)*5;
    this.balloon.position.y=gY+15+Math.sin(this.time*0.5)*2;
  }
}
