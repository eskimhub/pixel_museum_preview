import * as THREE from '../../vendor/three.module.js';
import { makeCharacterTextures, SPRITE_W, SPRITE_H } from './sprites.js';

// 못생긴 펭귄 2D 스프라이트를 3D 공간에 세운 캐릭터. 스프라이트는 항상 카메라를 향하고,
// 발밑에는 바닥에 눕힌 그림자를 둔다. 걷는 동안 프레임 1·2를 번갈아 보여준다.

const PX = 0.085; // 스프라이트 1픽셀의 월드 크기

export class Player {
  constructor(spawn) {
    this.group = new THREE.Group();
    this.pos = { x: spawn.x, z: spawn.z };
    this.dir = 'up'; // down(남) | up(북) | left(서) | right(동). 처음에는 전시대(북쪽)를 본다
    this.walkTime = 0;
    this.textures = makeCharacterTextures();

    this.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.textures.up[0], alphaTest: 0.5 }));
    this.sprite.scale.set(SPRITE_W * PX, SPRITE_H * PX, 1);
    this.sprite.center.set(0.5, 1 / SPRITE_H); // 발끝(외곽선 1px 위)을 기준점으로
    this.group.add(this.sprite);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.42, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(1, 0.65, 1);
    shadow.position.y = 0.04;
    this.group.add(shadow);

    this.setFrame(0);
    this.syncMesh();
  }

  setFrame(frame) {
    this.sprite.material.map = this.textures[this.dir][frame];
  }

  syncMesh() {
    this.group.position.set(this.pos.x, 0, this.pos.z);
  }

  /** dirX/dirZ: 입력 방향(-1~1), moved: 충돌 처리 후 실제로 이동했는지 */
  animate(dt, dirX, dirZ, moved) {
    if (dirX !== 0 || dirZ !== 0) {
      // 가로·세로 중 입력이 더 큰 쪽을 바라본다 (대각선이면 좌우를 우선)
      this.dir = Math.abs(dirX) >= Math.abs(dirZ) ? (dirX > 0 ? 'right' : 'left') : (dirZ > 0 ? 'down' : 'up');
    }
    if (moved) {
      this.walkTime += dt * 8;
      this.setFrame(Math.floor(this.walkTime) % 2 === 0 ? 1 : 2);
    } else {
      this.walkTime = 0;
      this.setFrame(0);
    }
    this.syncMesh();
  }
}
