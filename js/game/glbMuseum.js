import * as THREE from '../../vendor/three.module.js';
import { GLTFLoader } from '../../vendor/three-addons/GLTFLoader.js';
import { SLOTS } from './layout.js';
import { makeArtworkSetter, makeEmptyPictureMaterial } from './frames.js';

// Blender에서 내보낸 미술관(assets/museum.glb)을 불러온다.
// 모델은 layout.js와 같은 좌표·치수로 만들어져 있어 충돌과 슬롯 판정은 그대로 쓴다.
// 액자 그림 면은 모델 안의 `picture_<슬롯 id>` 메시이고, 코드 액자와 같은 setArtwork 인터페이스를 돌려준다.

/** @returns {Promise<{ root: THREE.Group, frames: Record<number, { setArtwork(art: object|null): void }> }>} */
export async function loadGlbMuseum(url) {
  const gltf = await new GLTFLoader().loadAsync(url);
  const root = gltf.scene;
  const frames = {};
  for (const slot of SLOTS) {
    if (slot.kind !== 'frame') continue;
    const picture = root.getObjectByName(`picture_${slot.id}`);
    if (!picture) throw new Error(`모델에 picture_${slot.id}가 없습니다`);
    const mat = makeEmptyPictureMaterial();
    picture.material = mat;
    frames[slot.id] = { setArtwork: makeArtworkSetter(mat) };
  }
  return { root, frames };
}
