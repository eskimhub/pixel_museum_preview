// 작품 올리기 폼 (상세 패널 안). 빈 자리 + 올릴 수 있는 사람일 때만 "작품 올리기" 버튼이 나타난다.
// 이미 걸린 작품은 주인에게만 "작품 바꾸기"와 "내리기"가 나타난다.
// 폼 요소가 없는 페이지(일부 테스트)에서는 모든 함수가 아무것도 하지 않는다.
import { toPng } from '../data/imageResize.js';
import { uploadArtwork, replaceArtwork, removeArtwork, describeError, validateArtwork } from '../data/museumApi.js';

const openBtn = document.getElementById('upload-open');
const replaceBtn = document.getElementById('upload-replace');
const removeBtn = document.getElementById('upload-remove');
const form = document.getElementById('upload-form');
const fileEl = document.getElementById('upload-file');
const titleEl = document.getElementById('upload-title');
const descEl = document.getElementById('upload-desc');
const msg = document.getElementById('upload-msg');
const submitBtn = document.getElementById('upload-submit');
const cancelBtn = document.getElementById('upload-cancel');

const REMOVE_LABEL = '내리기';
const REMOVE_CONFIRM_LABEL = '정말 내릴까요?';

let deps = null;     // { getConnection(), onUploaded(slotId, art), onRemoved(slotId), canUpload(), canManage(), enterAsGuest(), guestHelp(err), isSlotEmpty(id), onSlotTaken(id) }
let slotNow = null;
let artNow = null;   // 지금 패널에 열린 작품(바꾸기·내리기 대상). 빈 자리면 null
let busy = false;
let confirmTimer = null;

function say(text, ok = false) {
  msg.textContent = text;
  msg.className = ok ? 'auth-ok' : 'auth-error';
}

function resetRemoveConfirm() {
  clearTimeout(confirmTimer);
  confirmTimer = null;
  if (removeBtn) removeBtn.textContent = REMOVE_LABEL;
}

/** 패널의 버튼 상태: 빈 자리면 올리기, 내가 관리하는 작품이면 바꾸기·내리기 */
function showButtons() {
  openBtn.hidden = slotNow === null || artNow !== null;
  if (replaceBtn) replaceBtn.hidden = artNow === null;
  if (removeBtn) removeBtn.hidden = artNow === null;
}

function collapse() {
  form.hidden = true;
  form.reset();
  submitBtn.textContent = '올리기';
  say('');
  showButtons();
}

/** 패널이 닫힐 때 호출한다 */
export function resetUpload() {
  slotNow = null;
  artNow = null;
  resetRemoveConfirm();
  if (!form) return;
  form.hidden = true;
  openBtn.hidden = true;
  if (replaceBtn) replaceBtn.hidden = true;
  if (removeBtn) removeBtn.hidden = true;
  form.reset();
  submitBtn.textContent = '올리기';
  say('');
  document.activeElement?.blur();
}

/** 패널을 열 때 호출한다. 빈 자리이고 올릴 수 있는 상태일 때만 올리기 버튼을, 내 작품이면 바꾸기·내리기를 보여준다 */
export function prepareUpload(slot, art) {
  resetUpload();
  if (!form) return;
  if (art) {
    if (!art.id || !art.imagePath || !deps?.canManage?.()) return;
    slotNow = slot.id;
    artNow = art;
    showButtons();
    return;
  }
  if (!deps?.canUpload?.()) return;
  slotNow = slot.id;
  showButtons();
}

export function initUpload(d) {
  if (!form) return;
  deps = d;

  openBtn.addEventListener('click', async () => {
    if (busy) return;
    if (!deps.getConnection()) {
      // 로그인하지 않았으면 게스트로 자동 입장한다
      busy = true;
      openBtn.disabled = true;
      openBtn.textContent = '게스트로 입장하는 중...';
      try {
        await deps.enterAsGuest();
      } catch (err) {
        openBtn.hidden = true;
        form.hidden = false;
        say(deps.guestHelp?.(err) || describeError(err));
        return;
      } finally {
        busy = false;
        openBtn.disabled = false;
        openBtn.textContent = '작품 올리기';
      }
      if (slotNow === null) return; // 입장하는 동안 패널이 닫혔다
      // 예전에 쓰던 게스트 미술관이면 이 자리에 이미 작품이 있을 수 있다
      if (!deps.isSlotEmpty(slotNow)) return deps.onSlotTaken(slotNow);
    }
    openBtn.hidden = true;
    form.hidden = false;
    titleEl.focus();
  });

  // 걸린 작품을 새 그림으로 바꾼다: 제목·설명을 미리 채운 폼을 연다
  replaceBtn?.addEventListener('click', () => {
    if (busy || !artNow) return;
    resetRemoveConfirm();
    say('');
    titleEl.value = artNow.title || '';
    descEl.value = artNow.description || '';
    submitBtn.textContent = '바꾸기';
    replaceBtn.hidden = true;
    removeBtn.hidden = true;
    form.hidden = false;
    fileEl.focus();
  });

  // 내리기는 실수로 누르기 쉬워서 두 번 눌러야 지워진다(4초 안에 한 번 더)
  removeBtn?.addEventListener('click', async () => {
    if (busy || !artNow) return;
    if (!confirmTimer) {
      removeBtn.textContent = REMOVE_CONFIRM_LABEL;
      confirmTimer = setTimeout(resetRemoveConfirm, 4000);
      return;
    }
    resetRemoveConfirm();
    const conn = deps.getConnection();
    if (!conn) return say('로그인이 필요합니다.');
    const slot = slotNow;
    busy = true;
    removeBtn.disabled = true;
    replaceBtn.disabled = true;
    say('내리는 중...', true);
    try {
      await removeArtwork(conn.client, artNow);
      deps.onRemoved(slot);
    } catch (err) {
      say(describeError(err));
    } finally {
      busy = false;
      removeBtn.disabled = false;
      replaceBtn.disabled = false;
    }
  });

  cancelBtn.addEventListener('click', () => { if (!busy) collapse(); });
  // 입력창에서는 게임 입력이 무시되므로, Esc로 폼만 접을 수 있게 한다
  form.addEventListener('keydown', (e) => {
    e.stopPropagation(); // 폼 안에서 누른 키는 게임(이동, E/Space/Esc 닫기)으로 전달하지 않는다
    if (e.key === 'Escape' && !busy) { e.preventDefault(); collapse(); }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || slotNow === null) return;
    const slot = slotNow;
    const title = titleEl.value;
    const description = descEl.value;
    const problem = validateArtwork({ slot, title, description });
    if (problem) return say(problem);
    const conn = deps.getConnection();
    if (!conn) return say('로그인이 필요합니다.');

    busy = true;
    submitBtn.disabled = true;
    cancelBtn.disabled = true;
    say(artNow ? '바꾸는 중...' : '올리는 중...', true);
    try {
      const blob = await toPng(fileEl.files[0]);
      const art = artNow
        ? await replaceArtwork(conn.client, { userId: conn.userId, art: artNow, slot, title, description, blob })
        : await uploadArtwork(conn.client, { museum: conn.museum, userId: conn.userId, slot, title, description, blob });
      deps.onUploaded(slot, art);
    } catch (err) {
      say(describeError(err));
    } finally {
      busy = false;
      submitBtn.disabled = false;
      cancelBtn.disabled = false;
    }
  });
}
