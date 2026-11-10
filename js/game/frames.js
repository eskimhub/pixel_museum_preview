import * as THREE from '../../vendor/three.module.js';
import { makeTexture } from './textures.js';
import { SLOTS } from './layout.js';

// 벽 액자와 작품 설명판. 슬롯마다 액자(Group)를 만들고, setArtwork로 그림을 바꿔 끼운다.
// 단계 4에서는 업로드한 이미지 URL로 같은 함수를 호출한다.

const FRAME_W = 2.0;
const FRAME_H = 1.5;
const FRAME_BORDER = 0.14;
const FRAME_Y = 2.35;     // 액자 중심 높이
const IMG_W = FRAME_W - FRAME_BORDER * 2;
const IMG_H = FRAME_H - FRAME_BORDER * 2;

// 슬롯 face -> 3D 회전 (액자 앞면이 +z 방향이라고 보고, 바라보는 방향으로 돌린다)
const FACE_ROT = { south: 0, east: Math.PI / 2, west: -Math.PI / 2 };

const emptyCanvasTexture = (() => {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 6;
  const g = c.getContext('2d');
  g.fillStyle = '#e8dcc0';
  g.fillRect(0, 0, 8, 6);
  g.fillStyle = '#d6c8a6';
  for (let i = 0; i < 8; i += 2) g.fillRect(i, (i * 3) % 6, 1, 1);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();

function pixelTexture(image) {
  const t = new THREE.Texture(image);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

function box(w, h, d, material, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

/**
 * 그림 면 재질(pictureMat)에 작품을 입히는 setArtwork(art|null)를 만든다.
 * 코드로 만든 액자(buildFrames)와 Blender 모델(glbMuseum)이 함께 쓴다.
 */
export function makeArtworkSetter(pictureMat) {
  let version = 0; // 이미지 로딩이 끝나기 전에 setArtwork가 다시 불리면 오래된 결과를 버린다
  return (art) => {
    const mine = ++version;
    if (pictureMat.map && pictureMat.map !== emptyCanvasTexture) pictureMat.map.dispose();
    if (!art) {
      pictureMat.map = emptyCanvasTexture;
      pictureMat.needsUpdate = true;
      return;
    }
    const img = new Image();
    // 다른 도메인(Supabase Storage)의 이미지를 WebGL 텍스처로 쓰려면 CORS 허용 요청이어야 한다
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (mine !== version) return;
      pictureMat.map = pixelTexture(img);
      pictureMat.needsUpdate = true;
    };
    img.src = art.imageUrl;
  };
}

/** 빈 액자 그림 면 재질 */
export function makeEmptyPictureMaterial() {
  return new THREE.MeshBasicMaterial({ map: emptyCanvasTexture });
}

/** 슬롯 하나의 액자를 만든다. 반환값의 picture 재질을 바꿔 그림을 교체한다. */
function buildFrame(slot) {
  const g = new THREE.Group();
  g.position.set(slot.x, FRAME_Y, slot.z);
  g.rotation.y = FACE_ROT[slot.face];

  const wood = new THREE.MeshLambertMaterial({ map: makeTexture('panel', 2, 1) });
  const gold = new THREE.MeshLambertMaterial({ map: makeTexture('gold', 2, 1) });
  const depth = 0.12;

  // 나무 테두리 4개 + 안쪽 금색 선
  box(FRAME_W, FRAME_BORDER, depth, wood, 0, (FRAME_H - FRAME_BORDER) / 2, 0, g);
  box(FRAME_W, FRAME_BORDER, depth, wood, 0, -(FRAME_H - FRAME_BORDER) / 2, 0, g);
  box(FRAME_BORDER, FRAME_H - FRAME_BORDER * 2, depth, wood, -(FRAME_W - FRAME_BORDER) / 2, 0, 0, g);
  box(FRAME_BORDER, FRAME_H - FRAME_BORDER * 2, depth, wood, (FRAME_W - FRAME_BORDER) / 2, 0, 0, g);
  box(IMG_W + 0.06, 0.03, depth + 0.02, gold, 0, IMG_H / 2 + 0.015, 0, g);
  box(IMG_W + 0.06, 0.03, depth + 0.02, gold, 0, -IMG_H / 2 - 0.015, 0, g);

  // 그림 면 (빈 액자일 때는 연한 종이색)
  const pictureMat = makeEmptyPictureMaterial();
  const picture = new THREE.Mesh(new THREE.PlaneGeometry(IMG_W, IMG_H), pictureMat);
  picture.position.set(0, 0, depth / 2 + 0.005);
  g.add(picture);

  return { group: g, pictureMat };
}

/** 액자 아래 작품 설명판: 금속 받침 + 흰 안내판 (참고 이미지 2번) */
function buildPlaque(slot) {
  const g = new THREE.Group();
  const d = { south: { x: 0, z: 1 }, east: { x: 1, z: 0 }, west: { x: -1, z: 0 } }[slot.face];
  g.position.set(slot.x + d.x * 0.45, 0, slot.z + d.z * 0.45);
  g.rotation.y = FACE_ROT[slot.face];

  const metal = new THREE.MeshLambertMaterial({ color: 0x3a3a44 });
  const paper = new THREE.MeshBasicMaterial({ color: 0xf4f0e4 });
  const line = new THREE.MeshBasicMaterial({ color: 0x8a8578 });
  box(0.08, 0.7, 0.08, metal, 0, 0.35, 0, g);                      // 기둥
  const board = box(0.7, 0.42, 0.05, metal, 0, 0.78, 0, g);
  board.rotation.x = -0.35;                                         // 살짝 눕힌 안내판
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.3), paper);
  face.position.set(0, 0, 0.03);
  board.add(face);
  for (const y of [0.07, 0, -0.07]) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.025), line);
    l.position.set(0, y, 0.035);
    board.add(l);
  }
  return g;
}

/**
 * 벽 액자 12개와 설명판을 만든다. 슬롯 id -> { setArtwork(art|null) } 맵과 그룹을 돌려준다.
 * 조각상 슬롯(12)은 액자가 없으므로 포함하지 않는다.
 */
export function buildFrames() {
  const root = new THREE.Group();
  const frames = {};
  for (const slot of SLOTS) {
    if (slot.kind !== 'frame') continue;
    const { group, pictureMat } = buildFrame(slot);
    root.add(group);
    root.add(buildPlaque(slot));
    frames[slot.id] = { setArtwork: makeArtworkSetter(pictureMat) };
  }
  return { root, frames };
}
