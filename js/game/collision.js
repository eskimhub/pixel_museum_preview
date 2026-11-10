// 충돌 판정. 플레이어를 반지름 r의 정사각형으로 보고, 축별로 나눠 이동해서 벽/물체를 따라 미끄러지게 한다.

function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

function overlaps(x, z, r, b) {
  return x + r > b.minX && x - r < b.maxX && z + r > b.minZ && z - r < b.maxZ;
}

/**
 * pos({x, z})에서 (dx, dz)만큼 이동한 새 위치를 반환한다.
 * 한 프레임 이동량은 가장 작은 장애물 크기보다 작아야 한다(터널링 방지).
 */
export function moveWithCollision(pos, dx, dz, r, colliders, bounds) {
  let x = clamp(pos.x + dx, bounds.minX + r, bounds.maxX - r);
  for (const b of colliders) {
    if (overlaps(x, pos.z, r, b)) {
      x = dx > 0 ? b.minX - r : b.maxX + r;
    }
  }

  let z = clamp(pos.z + dz, bounds.minZ + r, bounds.maxZ - r);
  for (const b of colliders) {
    if (overlaps(x, z, r, b)) {
      z = dz > 0 ? b.minZ - r : b.maxZ + r;
    }
  }
  return { x, z };
}

export function isBlocked(x, z, r, colliders, bounds) {
  if (x - r < bounds.minX || x + r > bounds.maxX || z - r < bounds.minZ || z + r > bounds.maxZ) {
    return true;
  }
  return colliders.some((b) => overlaps(x, z, r, b));
}
