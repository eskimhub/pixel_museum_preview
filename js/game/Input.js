// 키보드 입력. 방향키와 WASD를 모두 지원하고, 창이 포커스를 잃으면 눌린 키를 초기화한다.
// 터치 화면용 가상 입력(조이스틱 값, 보기/닫기 버튼)도 같은 곳으로 합친다.

const KEYS = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  interact: ['KeyE', 'Space', 'VirtualInteract'],
  close: ['Escape', 'KeyE', 'Space', 'VirtualInteract', 'VirtualClose'],
};

export class Input {
  constructor(target = window) {
    this.down = new Set();
    this.pressed = new Set(); // 이번 프레임에 새로 눌린 키 (consume으로 한 번만 읽는다)
    this.virtual = { x: 0, z: 0 }; // 화면 조이스틱 값 (길이 0~1)
    target.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!e.repeat) this.pressed.add(e.code);
      this.down.add(e.code);
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); // 스크롤 방지
    });
    target.addEventListener('keyup', (e) => this.down.delete(e.code));
    target.addEventListener('blur', () => this.down.clear());
  }

  held(action) {
    return KEYS[action].some((k) => this.down.has(k));
  }

  /** action 키가 새로 눌렸으면 true를 돌려주고, 같은 눌림은 다시 true가 되지 않게 지운다 */
  consume(action) {
    const hit = KEYS[action].filter((k) => this.pressed.has(k));
    hit.forEach((k) => this.pressed.delete(k));
    return hit.length > 0;
  }

  /** 터치 버튼 입력. action은 'interact' 또는 'close' */
  pressVirtual(action) {
    this.pressed.add(action === 'close' ? 'VirtualClose' : 'VirtualInteract');
  }

  /** 화면 기준 이동 방향. x: 오른쪽 +, z: 아래(남쪽) +. 대각선도 속도가 같도록 정규화한다. */
  axis() {
    let x = (this.held('right') ? 1 : 0) - (this.held('left') ? 1 : 0);
    let z = (this.held('down') ? 1 : 0) - (this.held('up') ? 1 : 0);
    if (x !== 0 && z !== 0) {
      x *= Math.SQRT1_2;
      z *= Math.SQRT1_2;
    }
    // 키보드가 눌려 있지 않을 때만 조이스틱 값을 쓴다 (길이가 1을 넘지 않게 제한)
    if (x === 0 && z === 0) {
      const len = Math.hypot(this.virtual.x, this.virtual.z);
      const k = len > 1 ? 1 / len : 1;
      return { x: this.virtual.x * k, z: this.virtual.z * k };
    }
    return { x, z };
  }
}
