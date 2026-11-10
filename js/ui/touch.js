// 터치 화면용 조작: 왼쪽 아래 가상 조이스틱과 오른쪽 아래 "보기" 버튼.
// 키보드가 없는 모바일에서도 이동·작품 보기·패널 닫기를 할 수 있게 Input에 값을 넘긴다.

const DEAD_ZONE = 0.2; // 조이스틱 반지름 대비 이 비율 안쪽은 움직이지 않는 것으로 본다

/** 터치가 주 입력인 기기인지 (휴대폰·태블릿). 테스트에서 ?touch=1 로 강제할 수 있다. */
export function isTouchDevice() {
  if (new URLSearchParams(location.search).get('touch') === '1') return true;
  return window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window;
}

/** 조이스틱 이동량(px)을 -1~1 범위의 방향 값으로 바꾼다. 데드존 안쪽은 0. */
export function stickVector(dx, dy, radius) {
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: 0, z: 0 };
  const mag = Math.min(1, len / radius);
  if (mag < DEAD_ZONE) return { x: 0, z: 0 };
  const scaled = (mag - DEAD_ZONE) / (1 - DEAD_ZONE); // 데드존 직후 0에서 시작해 부드럽게 커진다
  return { x: (dx / len) * scaled, z: (dy / len) * scaled };
}

export function initTouch(input) {
  const root = document.getElementById('touch');
  const base = document.getElementById('stick-base');
  const knob = document.getElementById('stick-knob');
  const act = document.getElementById('touch-act');
  if (!root || !base || !knob || !act) return false;
  if (!isTouchDevice()) return false;

  document.body.classList.add('is-touch');
  root.hidden = false;

  let activeId = null;
    function move(e) {
    const r = base.getBoundingClientRect();
    const R = r.width / 2; // 테두리를 포함한 실제 크기 기준(중심이 어긋나지 않게)
    let dx = e.clientX - (r.left + R);
    let dy = e.clientY - (r.top + R);
    const len = Math.hypot(dx, dy);
    if (len > R) { dx = (dx / len) * R; dy = (dy / len) * R; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const v = stickVector(dx, dy, R);
    input.virtual.x = v.x;
    input.virtual.z = v.z;
  }
  function release() {
    activeId = null;
    knob.style.transform = '';
    input.virtual.x = 0;
    input.virtual.z = 0;
  }

  base.addEventListener('pointerdown', (e) => {
    if (activeId !== null) return;
    activeId = e.pointerId;
    try { base.setPointerCapture(e.pointerId); } catch { /* 캡처 없이도 동작한다 */ }
    move(e);
    e.preventDefault();
  });
  base.addEventListener('pointermove', (e) => { if (e.pointerId === activeId) move(e); });
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    base.addEventListener(t, (e) => { if (e.pointerId === activeId) release(); });
  }

  act.addEventListener('pointerdown', (e) => {
    input.pressVirtual('interact');
    e.preventDefault();
  });
  window.addEventListener('blur', release);
  return true;
}
