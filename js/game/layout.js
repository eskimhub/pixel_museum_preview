// 방 배치 데이터. 3D 모델 생성(MuseumScene)과 충돌 판정(collision, 테스트)이 같은 값을 쓴다.
// 좌표계: x = 오른쪽, z = 화면 아래쪽(남쪽), y = 위. 단위는 임의의 "미터".

export const ROOM = {
  halfW: 10,   // x: -10 ~ 10
  halfD: 8,    // z: -8 ~ 8
  wallH: 4.2,
};

// 카펫(와인색)과 금색 무늬 테두리
export const CARPET = { halfW: 8, halfD: 6, border: 0.4 };

// 중앙 조각상 전시대 (슬롯 12번 자리)
export const PEDESTAL = { x: 0, z: 0, size: 2.8, height: 0.8 };

// 전시대를 둘러싼 로프 기둥 (한 변 길이 = half * 2). 관람객은 로프 안으로 들어갈 수 없다.
export const ROPE = { x: 0, z: 0, half: 2.1, thickness: 0.12, postSpacing: 1.4 };

export const BENCHES = [
  { x: -5.5, z: 0, w: 3.0, d: 0.9 },
  { x: 5.5, z: 0, w: 3.0, d: 0.9 },
];

export const PLANTS = [
  { x: -9, z: -7, size: 0.9 },
  { x: 9, z: -7, size: 0.9 },
  { x: -9, z: 7, size: 0.9 },
  { x: 9, z: 7, size: 0.9 },
];

export const PLAYER = { radius: 0.35, speed: 4, spawn: { x: 0, z: 5.5 } };

// 전시 슬롯 13개: 0~11 = 벽 액자, 12 = 중앙 조각상 단상.
// x, z = 작품이 놓인 위치. face = 작품이 바라보는 방향(관람객이 서는 쪽): 'south' | 'east' | 'west'
// 남쪽 벽에는 걸지 않는다(카메라가 그쪽에서 바라보므로 안쪽 면이 보이지 않는다).
export const FRAME_SPOTS = [
  ...[-7.5, -4.5, -1.5, 1.5, 4.5, 7.5].map((x) => ({ x, z: -ROOM.halfD + 0.15, face: 'south' })),
  ...[-4, 0, 4].map((z) => ({ x: -ROOM.halfW + 0.15, z, face: 'east' })),
  ...[-4, 0, 4].map((z) => ({ x: ROOM.halfW - 0.15, z, face: 'west' })),
];
export const SLOT_COUNT = FRAME_SPOTS.length + 1; // 13
export const STATUE_SLOT = 12;

const FACE_DIR = { south: { x: 0, z: 1 }, east: { x: 1, z: 0 }, west: { x: -1, z: 0 } };

/** 슬롯 목록: { id, kind: 'frame' | 'statue', x, z, face, stand: 관람객이 서는 위치 } */
export const SLOTS = [
  ...FRAME_SPOTS.map((s, id) => {
    const d = FACE_DIR[s.face];
    return { id, kind: 'frame', ...s, stand: { x: s.x + d.x * 1.3, z: s.z + d.z * 1.3 } };
  }),
  { id: STATUE_SLOT, kind: 'statue', x: PEDESTAL.x, z: PEDESTAL.z, face: 'south',
    stand: { x: PEDESTAL.x, z: PEDESTAL.z + ROPE.half + 0.9 } },
];

/** 상호작용 가능 거리: 플레이어가 stand 위치 주변 이 반경 안에 있으면 슬롯을 볼 수 있다 */
export const INTERACT_RADIUS = 1.6;

/** 플레이어 위치에서 상호작용 가능한 가장 가까운 슬롯. 없으면 null */
export function nearestSlot(pos) {
  let best = null;
  let bestD = INTERACT_RADIUS;
  for (const s of SLOTS) {
    const d = Math.hypot(pos.x - s.stand.x, pos.z - s.stand.z);
    if (d < bestD) { best = s; bestD = d; }
  }
  return best;
}

function box(x, z, w, d) {
  return { minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 };
}

const ropeSide = ROPE.half * 2 + ROPE.thickness;

// 플레이어가 지나갈 수 없는 사각형 영역
export const COLLIDERS = [
  box(ROPE.x, ROPE.z - ROPE.half, ropeSide, ROPE.thickness), // 로프 북
  box(ROPE.x, ROPE.z + ROPE.half, ropeSide, ROPE.thickness), // 로프 남
  box(ROPE.x - ROPE.half, ROPE.z, ROPE.thickness, ropeSide), // 로프 서
  box(ROPE.x + ROPE.half, ROPE.z, ROPE.thickness, ropeSide), // 로프 동
  ...BENCHES.map((b) => box(b.x, b.z, b.w, b.d)),
  ...PLANTS.map((p) => box(p.x, p.z, p.size, p.size)),
];

export const BOUNDS = {
  minX: -ROOM.halfW,
  maxX: ROOM.halfW,
  minZ: -ROOM.halfD,
  maxZ: ROOM.halfD,
};
