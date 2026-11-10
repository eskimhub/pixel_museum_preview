import * as THREE from '../../vendor/three.module.js';

// 못생긴 펭귄 스프라이트를 코드로 그린다 (4방향 x 3프레임: 0=서 있기, 1·2=걷기).
// 16x19 영역에 그린 뒤 사방 1px 여백에 어두운 외곽선을 자동으로 넣는다.

export const SPRITE_W = 18;
export const SPRITE_H = 21;

const BODY = '#2d3556';
const BODY_HI = '#44507a';
const BELLY = '#f1ede0';
const BELLY_SH = '#cfc8b4';
const BEAK = '#f2a21c';
const FEET = '#e8782a';
const EYE_W = '#ffffff';
const EYE = '#1a1218';
const TUFT = '#d9c23a';
const OUTLINE = '#1a1218';

// 일부러 못생기게: 짝짝이 눈, 삐뚤어진 부리, 삐죽 솟은 털, 크기가 다른 납작 발, 한쪽만 처진 날개.
function drawChar(ctx, dir, frame) {
  const mirror = dir === 'left';
  const side = dir === 'left' || dir === 'right';
  // 그리는 영역은 16칸 폭. 왼쪽을 볼 때는 오른쪽 그림을 좌우 반전해서 그린다.
  const R = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(mirror ? 16 - x - w : x, y, w, h);
  };

  // 걸음: 1이면 왼발, 2이면 오른발을 든다
  const liftL = frame === 1;
  const liftR = frame === 2;

  // 발 (몸 아래에 그려서 몸이 위에 덮이게 한다). 왼발이 오른발보다 크다.
  if (side) {
    const foot = (x, w, lifted) => R(x, lifted ? 16 : 17, w, lifted ? 1 : 2, FEET);
    if (frame === 0) foot(6, 6, false);
    else { foot(liftL ? 3 : 8, 5, false); foot(liftL ? 8 : 3, 4, true); }
  } else {
    R(2, liftL ? 16 : 17, 5, liftL ? 1 : 2, FEET);
    R(9, liftR ? 16 : 17, 4, liftR ? 1 : 2, FEET);
  }

  // 몸통
  const torso = (x0, w) => {
    R(x0 + 2, 2, w - 4, 1, BODY);
    R(x0 + 1, 3, w - 2, 1, BODY);
    R(x0, 4, w, 11, BODY);
    R(x0 + 1, 15, w - 2, 1, BODY);
    R(x0 + 2, 16, w - 4, 1, BODY);
  };

  if (side) {
    torso(2, 10);
    R(1, 13, 2, 2, BODY);            // 꼬리
    R(9, 7, 3, 7, BELLY);            // 배
    R(8, 9, 1, 4, BELLY_SH);
    R(9, 14, 2, 1, BELLY_SH);
    R(4, 5, 3, 1, BODY_HI);
    // 눈은 동그랗고 크게, 부리는 아래로 처진 채 삐뚤게
    R(9, 4, 3, 3, EYE_W);
    R(11, 5, 1, 1, EYE);
    R(12, 7, 3, 1, BEAK);
    R(12, 8, 2, 1, BEAK);
    R(13, 9, 1, 1, BEAK);
    // 삐죽 솟은 털
    R(6, 0, 1, 2, TUFT);
    R(8, 1, 1, 1, TUFT);
    // 날개: 걸을 때 앞뒤로 흔든다
    const sw = frame === 0 ? 0 : (liftL ? 1 : -1);
    R(5 + sw, 8, 2, 6, BODY_HI);
  } else if (dir === 'up') {
    torso(2, 12);
    R(7, 15, 3, 3, BODY);            // 꼬리
    R(5, 6, 2, 1, BODY_HI);
    R(9, 10, 3, 1, BODY_HI);
    R(6, 0, 1, 2, TUFT);
    R(8, 0, 1, 1, TUFT);
    R(10, 1, 1, 1, TUFT);
    // 날개: 한쪽은 높이, 한쪽은 처지게
    const aL = liftR ? -1 : 0;
    const aR = liftL ? -1 : 0;
    R(0, 9 + aL, 2, 6, BODY_HI);
    R(14, 7 + aR, 2, 5, BODY_HI);
  } else {
    torso(2, 12);
    R(6, 7, 4, 1, BELLY);            // 배
    R(5, 8, 6, 6, BELLY);
    R(6, 14, 4, 1, BELLY);
    R(5, 13, 1, 1, BELLY_SH);
    R(10, 13, 1, 1, BELLY_SH);
    // 짝짝이 눈: 왼쪽은 크고 사팔, 오른쪽은 작음
    R(4, 4, 3, 3, EYE_W);
    R(6, 5, 1, 1, EYE);
    R(10, 5, 2, 2, EYE_W);
    R(10, 6, 1, 1, EYE);
    // 삐뚤어진 부리
    R(7, 7, 3, 1, BEAK);
    R(8, 8, 3, 1, BEAK);
    // 삐죽 솟은 털
    R(6, 0, 1, 2, TUFT);
    R(8, 0, 1, 1, TUFT);
    R(10, 1, 1, 1, TUFT);
    // 날개: 왼쪽은 처지고 오른쪽은 위로, 걸을 때 퍼덕인다
    const aL = liftR ? -1 : 0;
    const aR = liftL ? -1 : 0;
    R(0, 9 + aL, 2, 6, BODY_HI);
    R(14, 6 + aR, 2, 5, BODY_HI);
  }
}

// 불투명 픽셀 바로 바깥쪽에 외곽선 색을 칠한다
function addOutline(ctx) {
  const img = ctx.getImageData(0, 0, SPRITE_W, SPRITE_H);
  const a = (x, y) => (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H ? 0 : img.data[(y * SPRITE_W + x) * 4 + 3]);
  const out = [];
  for (let y = 0; y < SPRITE_H; y++) {
    for (let x = 0; x < SPRITE_W; x++) {
      if (a(x, y) === 0 && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) out.push([x, y]);
    }
  }
  ctx.fillStyle = OUTLINE;
  for (const [x, y] of out) ctx.fillRect(x, y, 1, 1);
}

function makeFrame(dir, frame) {
  const canvas = document.createElement('canvas');
  canvas.width = SPRITE_W;
  canvas.height = SPRITE_H;
  const ctx = canvas.getContext('2d');
  ctx.translate(1, 1);
  drawChar(ctx, dir, frame);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  addOutline(ctx);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** { down: [t0,t1,t2], up: [...], left: [...], right: [...] } */
export function makeCharacterTextures() {
  const set = {};
  for (const dir of ['down', 'up', 'left', 'right']) {
    set[dir] = [0, 1, 2].map((f) => makeFrame(dir, f));
  }
  return set;
}
