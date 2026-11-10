import * as THREE from '../../vendor/three.module.js';
import { makeTexture } from './textures.js';
import { ROOM, CARPET, PEDESTAL, ROPE, BENCHES, PLANTS } from './layout.js';

function mat(tex) {
  return new THREE.MeshLambertMaterial({ map: tex });
}

function addBox(parent, w, h, d, material, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

/** 미술관 방 전체를 만들어 Group으로 돌려준다. */
export function buildMuseum() {
  const g = new THREE.Group();
  const { halfW, halfD, wallH } = ROOM;
  const W = halfW * 2;
  const D = halfD * 2;

  // 바닥: 나무 마루 위에 와인 카펫과 금색 테두리
  const floorTex = makeTexture('floor', W / 2, D / 2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat(floorTex));
  floor.rotation.x = -Math.PI / 2;
  g.add(floor);

  const cw = CARPET.halfW * 2;
  const cd = CARPET.halfD * 2;
  // 금색 무늬 테두리: 카펫 둘레에 띠 4개
  const bd = CARPET.border;
  const strips = [
    { w: cw + bd * 2, d: bd, x: 0, z: -CARPET.halfD - bd / 2 },
    { w: cw + bd * 2, d: bd, x: 0, z: CARPET.halfD + bd / 2 },
    { w: bd, d: cd, x: -CARPET.halfW - bd / 2, z: 0 },
    { w: bd, d: cd, x: CARPET.halfW + bd / 2, z: 0 },
  ];
  for (const s of strips) {
    addBox(g, s.w, 0.02, s.d, mat(makeTexture('goldPattern', Math.max(s.w, s.d) / bd, 1)), s.x, 0.01, s.z);
  }
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(cw, cd), mat(makeTexture('carpet', cw, cd)));
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.y = 0.025;
  g.add(carpet);

  // 벽 4면 (안쪽에서 보이도록 얇은 박스). 아랫부분은 나무 패널, 윗부분은 아이보리
  const t = 0.3;
  const panelH = 1.2;
  const walls = [
    { w: W + t * 2, d: t, x: 0, z: -halfD - t / 2 }, // 북
    { w: W + t * 2, d: t, x: 0, z: halfD + t / 2 },  // 남
    { w: t, d: D, x: -halfW - t / 2, z: 0 },         // 서
    { w: t, d: D, x: halfW + t / 2, z: 0 },          // 동
  ];
  for (const s of walls) {
    const len = Math.max(s.w, s.d);
    addBox(g, s.w, wallH, s.d, mat(makeTexture('wall', len / 2, wallH / 2)), s.x, wallH / 2, s.z);
  }

  // 안쪽 면에 붙이는 나무 패널과 금색 몰딩
  const inset = 0.02;
  const inner = [
    { w: W, d: 0.1, x: 0, z: -halfD + 0.05 + inset },
    { w: W, d: 0.1, x: 0, z: halfD - 0.05 - inset },
    { w: 0.1, d: D, x: -halfW + 0.05 + inset, z: 0 },
    { w: 0.1, d: D, x: halfW - 0.05 - inset, z: 0 },
  ];
  for (const s of inner) {
    const len = Math.max(s.w, s.d);
    addBox(g, s.w, panelH, s.d, mat(makeTexture('panel', len / 2, panelH / 2)), s.x, panelH / 2, s.z);
    addBox(g, s.w + (s.w > s.d ? 0 : 0.04), 0.18, s.d + (s.w > s.d ? 0.04 : 0), mat(makeTexture('gold', len / 2, 1)), s.x, panelH + 0.09, s.z);
    addBox(g, s.w + (s.w > s.d ? 0 : 0.04), 0.14, s.d + (s.w > s.d ? 0.04 : 0), mat(makeTexture('gold', len / 2, 1)), s.x, wallH - 0.07, s.z);
  }

  // 천장은 만들지 않는다(카메라가 위에서 내려다본다). 대신 조명으로 실내 느낌을 낸다.

  // 중앙 조각상 전시대: 어두운 단상 2단 + 바닥에 따뜻한 LED 띠 + 조각상
  const stoneMat = mat(makeTexture('stone', 2, 2));
  const darkMat = mat(makeTexture('darkstone', 3, 1));
  const stepH = 0.2;
  addBox(g, PEDESTAL.size + 0.5, stepH, PEDESTAL.size + 0.5, darkMat, PEDESTAL.x, stepH / 2, PEDESTAL.z);
  addBox(g, PEDESTAL.size, PEDESTAL.height - stepH, PEDESTAL.size, darkMat, PEDESTAL.x, stepH + (PEDESTAL.height - stepH) / 2, PEDESTAL.z);
  const led = new THREE.MeshBasicMaterial({ color: 0xffb347 });
  addBox(g, PEDESTAL.size + 1.0, 0.03, PEDESTAL.size + 1.0, led, PEDESTAL.x, 0.03, PEDESTAL.z);
  const statue = new THREE.Group();
  statue.position.set(PEDESTAL.x, PEDESTAL.height, PEDESTAL.z);
  addBox(statue, 0.7, 0.9, 0.5, stoneMat, 0, 0.45, 0);   // 몸통
  addBox(statue, 0.45, 0.45, 0.45, stoneMat, 0, 1.12, 0); // 머리
  addBox(statue, 0.2, 0.75, 0.2, stoneMat, -0.45, 0.5, 0); // 왼팔
  addBox(statue, 0.2, 0.75, 0.2, stoneMat, 0.45, 0.5, 0);  // 오른팔
  g.add(statue);

  // 전시대를 둘러싼 로프: 모서리와 변 중간에 기둥, 기둥 사이에 붉은 줄
  const postMat = new THREE.MeshLambertMaterial({ color: 0xb8b8c0 });
  const ropeMat = new THREE.MeshLambertMaterial({ color: 0xb02a2a });
  const postH = 0.85;
  const side = ROPE.half * 2;
  const n = Math.round(side / ROPE.postSpacing);
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (let c = 0; c < 4; c++) {
    const [ax, az] = corners[c];
    const [bx, bz] = corners[(c + 1) % 4];
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const px = ROPE.x + (ax + (bx - ax) * t) * ROPE.half;
      const pz = ROPE.z + (az + (bz - az) * t) * ROPE.half;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, postH, 8), postMat);
      post.position.set(px, postH / 2, pz);
      g.add(post);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), postMat);
      cap.position.set(px, postH + 0.05, pz);
      g.add(cap);
    }
    const mx = ROPE.x + (ax + bx) / 2 * ROPE.half;
    const mz = ROPE.z + (az + bz) / 2 * ROPE.half;
    const horizontal = az === bz;
    addBox(g, horizontal ? side : 0.05, 0.05, horizontal ? 0.05 : side, ropeMat, mx, postH - 0.1, mz);
  }

  // 벤치
  const woodMat = mat(makeTexture('panel', 2, 1));
  for (const b of BENCHES) {
    addBox(g, b.w, 0.12, b.d, woodMat, b.x, 0.5, b.z);
    addBox(g, 0.12, 0.5, b.d - 0.1, woodMat, b.x - b.w / 2 + 0.2, 0.25, b.z);
    addBox(g, 0.12, 0.5, b.d - 0.1, woodMat, b.x + b.w / 2 - 0.2, 0.25, b.z);
  }

  // 화분: 모서리마다 하나씩
  const potMat = new THREE.MeshLambertMaterial({ color: 0x8a4b2d });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x3f7a3a });
  for (const p of PLANTS) {
    addBox(g, p.size, 0.5, p.size, potMat, p.x, 0.25, p.z);
    addBox(g, p.size * 0.9, 0.9, p.size * 0.9, leafMat, p.x, 0.95, p.z);
  }

  return g;
}

/** 조명: 은은한 환경광 + 따뜻한 방 전체 조명 + 조각상 스포트라이트 */
export function buildLights() {
  const g = new THREE.Group();
  g.add(new THREE.AmbientLight(0xfff1dc, 0.75));

  const key = new THREE.DirectionalLight(0xffe2b0, 0.6);
  key.position.set(-4, 10, 6);
  g.add(key);

  const spot = new THREE.SpotLight(0xfff0c8, 3, 14, Math.PI / 5, 0.5, 1);
  spot.position.set(PEDESTAL.x, 7, PEDESTAL.z + 1);
  spot.target.position.set(PEDESTAL.x, 1, PEDESTAL.z);
  g.add(spot, spot.target);

  // 조각상 위로 내려오는 빛줄기 3개 (눈에 보이는 반투명 원뿔)
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xffe9b0, transparent: true, opacity: 0.13, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const top = 4.0;
  const bottom = PEDESTAL.height + 0.05;
  for (const dx of [-1, 0, 1]) {
    const beam = new THREE.Mesh(new THREE.ConeGeometry(0.75, top - bottom, 12, 1, true), beamMat);
    beam.position.set(PEDESTAL.x + dx * 0.9, (top + bottom) / 2, PEDESTAL.z);
    g.add(beam);
  }
  return g;
}
