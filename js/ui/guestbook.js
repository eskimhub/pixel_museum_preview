// 방명록 창. 지금 전시 중인 미술관의 방명록을 보여주고, 입장(로그인)한 사람은 한 줄을 남길 수 있다.
// 입장 전에도 전시 중인 미술관(getView)이 있으면 글은 읽을 수 있다.
// 이름·메시지는 사용자가 입력한 글이므로 textContent로만 화면에 넣는다.
// 필요한 요소가 없는 페이지(일부 테스트)에서는 아무것도 하지 않는다.
import { loadEntries, addEntry, deleteEntry, validateEntry, canDelete, formatDate, GB_LIMITS } from '../data/guestbookApi.js';
import { describeError } from '../data/museumApi.js';

const NAME_KEY = 'pixelMuseum.gbName';

const openBtn = document.getElementById('gb-open');
const modal = document.getElementById('gb-modal');
const list = document.getElementById('gb-list');
const form = document.getElementById('gb-form');
const nameEl = document.getElementById('gb-name');
const msgEl = document.getElementById('gb-message');
const note = document.getElementById('gb-note');
const status = document.getElementById('gb-status');
const closeBtn = document.getElementById('gb-close');
const enterBtn = document.getElementById('gb-enter');
const submitBtn = document.getElementById('gb-submit');

/** 방명록 창이 열려 있는 동안 게임 입력(이동)을 멈추는 데 쓴다 */
export function isGuestbookOpen() {
  return modal?.hidden === false;
}

let deps = null; // { getConnection(), getView(), enterAsGuest(), guestHelp(err), getUserLabel() }
let seq = 0;     // 늦게 도착한 응답이 최신 화면을 덮어쓰지 않게 한다
let busy = false;

function say(text, ok = false) {
  status.textContent = text;
  status.className = ok ? 'auth-ok' : 'auth-error';
}

// ownerId: 전시 중인 미술관의 주인. 주인과 글쓴이 본인만 삭제 버튼이 보인다
function renderList(entries, conn, ownerId) {
  list.replaceChildren();
  if (entries.length === 0) {
    const li = document.createElement('li');
    li.className = 'gb-empty';
    li.textContent = '아직 남겨진 글이 없습니다. 첫 번째로 한 줄 남겨 보세요.';
    list.appendChild(li);
    return;
  }
  for (const e of entries) {
    const li = document.createElement('li');
    const head = document.createElement('div');
    head.className = 'gb-head';
    const who = document.createElement('strong');
    who.textContent = e.name;
    const when = document.createElement('span');
    when.textContent = formatDate(e.createdAt);
    head.append(who, when);
    if (canDelete(e, { userId: conn?.userId, ownerId })) {
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'gb-del';
      del.textContent = '삭제';
      del.addEventListener('click', () => removeEntry(e.id));
      head.appendChild(del);
    }
    const body = document.createElement('p');
    body.textContent = e.message;
    li.append(head, body);
    list.appendChild(li);
  }
}

async function refresh() {
  const conn = deps.getConnection();
  const target = conn ?? deps.getView?.(); // 입장 전에는 전시 중인 미술관을 읽기만 한다
  const mine = ++seq;
  if (!target) {
    list.replaceChildren();
    form.hidden = true;
    enterBtn.hidden = false;
    note.textContent = '데모 전시에는 방명록이 없습니다. 게스트로 입장하면 내 미술관의 방명록을 쓸 수 있습니다.';
    say('');
    return;
  }
  enterBtn.hidden = Boolean(conn);
  form.hidden = !conn;
  note.textContent = `${target.museum.name || '김동구전'} 방명록`;
  say('불러오는 중...', true);
  try {
    const entries = await loadEntries(target.client, target.museum.id);
    if (mine !== seq) return;
    renderList(entries, conn, target.museum.owner_id ?? conn?.userId);
    say(conn ? '' : '글을 남기려면 아래 "게스트로 입장"을 눌러 주세요.', !conn);
  } catch (err) {
    if (mine !== seq) return;
    list.replaceChildren();
    say(describeError(err));
  }
}

async function removeEntry(id) {
  const conn = deps.getConnection();
  if (!conn || busy) return;
  busy = true;
  try {
    await deleteEntry(conn.client, id);
  } catch (err) {
    say(describeError(err));
  } finally {
    busy = false;
  }
  await refresh();
}

export function openGuestbook() {
  if (!modal) return;
  modal.hidden = false;
  nameEl.value = nameEl.value || localStorage.getItem(NAME_KEY) || deps?.getUserLabel?.() || '게스트';
  refresh();
  (deps?.getConnection() ? msgEl : closeBtn).focus();
}

export function closeGuestbook() {
  if (!modal) return;
  modal.hidden = true;
  seq++; // 진행 중인 불러오기는 버린다
  document.activeElement?.blur();
}

export function initGuestbook(d) {
  if (!modal || !openBtn) return;
  deps = d;
  openBtn.addEventListener('click', openGuestbook);
  closeBtn.addEventListener('click', closeGuestbook);
  // 창 안에서 누른 키는 게임으로 전달하지 않는다
  modal.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); closeGuestbook(); }
  });

  enterBtn.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    enterBtn.disabled = true;
    say('게스트로 입장하는 중...', true);
    try {
      await deps.enterAsGuest();
    } catch (err) {
      say(deps.guestHelp?.(err) || describeError(err));
      return;
    } finally {
      busy = false;
      enterBtn.disabled = false;
    }
    await refresh();
    msgEl.focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    const conn = deps.getConnection();
    if (!conn) return say('먼저 게스트로 입장해 주세요.');
    const problem = validateEntry({ name: nameEl.value, message: msgEl.value });
    if (problem) return say(problem);
    busy = true;
    submitBtn.disabled = true;
    say('남기는 중...', true);
    try {
      await addEntry(conn.client, { museumId: conn.museum.id, name: nameEl.value, message: msgEl.value });
      localStorage.setItem(NAME_KEY, nameEl.value.trim());
      msgEl.value = '';
    } catch (err) {
      say(describeError(err));
      return;
    } finally {
      busy = false;
      submitBtn.disabled = false;
    }
    await refresh();
  });
  nameEl.maxLength = GB_LIMITS.nameMax;
  msgEl.maxLength = GB_LIMITS.messageMax;
}
