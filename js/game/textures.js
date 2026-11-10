import * as THREE from '../../vendor/three.module.js';

// 16x16 픽셀 텍스처를 코드로 그린다. 확대할 때 보간하지 않아(Nearest) 픽셀이 그대로 보인다.
const SIZE = 16;

// 같은 좌표에는 항상 같은 값을 주는 간단한 해시 (무작위처럼 보이는 얼룩용)
function noise(x, y, seed) {
  let n = (x * 374761393 + y * 668265263 + seed * 1274126177) | 0;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

function shade(hex, amount) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amount);
  return `#${c.getHexString()}`;
}

const PAINTERS = {
  // 와인색 카펫: 잔 얼룩 + 마름모 무늬
  carpet(ctx) {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        let c = '#6b1d2a';
        if ((x + y) % 8 === 0 || (x - y + 16) % 8 === 0) c = '#82303f';
        else if (noise(x, y, 1) > 0.8) c = shade('#6b1d2a', 0.03);
        else if (noise(x, y, 2) > 0.85) c = shade('#6b1d2a', -0.03);
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  },
  // 나무 마루: 4px 높이 판자, 줄마다 이음새 위치가 다르다
  floor(ctx) {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const row = Math.floor(y / 4);
        let c = '#8a5a34';
        if (y % 4 === 3) c = '#6b4326';
        else if ((x + row * 5) % 16 === 0) c = '#6b4326';
        else if (noise(x, y, 3) > 0.82) c = shade('#8a5a34', 0.04);
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  },
  // 아이보리 벽: 8px마다 은은한 세로 줄무늬
  wall(ctx) {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        let c = '#efe6cf';
        if (x % 8 === 0) c = '#e4d9bd';
        else if (noise(x, y, 4) > 0.9) c = '#e9dfc6';
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  },
  // 어두운 나무 패널(벽 아래쪽)
  panel(ctx) {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        let c = '#5a3a22';
        if (x % 8 === 0 || y % 8 === 0) c = '#442a17';
        else if (noise(x, y, 5) > 0.8) c = shade('#5a3a22', 0.04);
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  },
  // 금색 몰딩
  gold(ctx) {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        let c = '#d4a84a';
        if (y % 4 === 0) c = '#f0cf7a';
        else if (y % 4 === 3) c = '#a9812f';
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  },
  // 대리석/석재
  stone(ctx) {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        let c = '#cfc8bb';
        if (noise(x, y, 6) > 0.85) c = '#bcb5a8';
        else if (noise(x, y, 7) > 0.9) c = '#ddd7cb';
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  },
  // 금색 무늬 테두리: 위아래 줄 + 마름모 격자
  goldPattern(ctx) {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        let c = '#d4a84a';
        if (y < 2) c = '#f0cf7a';
        else if (y > 13) c = '#a9812f';
        else if ((x + y) % 8 === 0 || (x - y + 16) % 8 === 0) c = '#7a5a1a';
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  },
  // 어두운 단상 석재
  darkstone(ctx) {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        let c = '#2b2a30';
        if (noise(x, y, 8) > 0.85) c = '#37363d';
        else if (noise(x, y, 9) > 0.88) c = '#222126';
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  },
};

/** kind 모양의 픽셀 텍스처를 만든다. repeatX/Y: 면 전체에서 타일이 반복되는 횟수 */
export function makeTexture(kind, repeatX = 1, repeatY = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  PAINTERS[kind](canvas.getContext('2d'));

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
