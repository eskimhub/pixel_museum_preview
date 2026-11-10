// 로그인 UI (이메일/비밀번호). Supabase 설정이 없으면 아무것도 하지 않는다.
// 사용자 입력과 서버 메시지는 textContent로만 화면에 넣는다.
import { getClient, isSupabaseConfigured } from '../supabaseClient.js';
import { isGuestUser } from '../data/guest.js';

const bar = document.getElementById('auth-bar');
const who = document.getElementById('auth-who');
const openBtn = document.getElementById('auth-open');
const outBtn = document.getElementById('auth-logout');
const modal = document.getElementById('auth-modal');
const form = document.getElementById('auth-form');
const emailEl = document.getElementById('auth-email');
const pwEl = document.getElementById('auth-password');
const msg = document.getElementById('auth-msg');
const signupBtn = document.getElementById('auth-signup');
const cancelBtn = document.getElementById('auth-cancel');

/** 로그인 창이 열려 있는 동안 게임 입력(캐릭터 이동)을 멈추는 데 쓴다 */
export function isAuthOpen() {
  return modal?.hidden === false;
}

const ERRORS = {
  'Invalid login credentials': '이메일 또는 비밀번호가 맞지 않습니다.',
  'Email not confirmed': '이메일 확인이 아직 안 됐습니다. 받은 편지함의 확인 메일을 눌러주세요.',
  'User already registered': '이미 가입된 이메일입니다. 로그인해 주세요.',
  'Email rate limit exceeded': '메일을 너무 자주 요청했습니다. 잠시 뒤에 다시 시도해 주세요.',
};

function say(text, isError = true) {
  msg.textContent = text;
  msg.className = isError ? 'auth-error' : 'auth-ok';
}

function korean(err) {
  const m = err?.message || String(err);
  if (/Password should be at least/i.test(m)) return '비밀번호는 6자 이상이어야 합니다.';
  if (/Failed to fetch|NetworkError|불러오지 못했습니다/i.test(m)) return '서버에 연결하지 못했습니다. 네트워크와 Supabase 설정을 확인해 주세요.';
  return ERRORS[m] || m;
}

function openModal() {
  say('', false);
  modal.hidden = false;
  emailEl.focus();
}

function closeModal() {
  modal.hidden = true;
  pwEl.value = '';
  document.activeElement?.blur();
}

function render(session) {
  const user = session?.user;
  const label = user ? (isGuestUser(user) ? '게스트' : user.email || '') : '';
  who.textContent = label;
  who.hidden = !label;
  outBtn.hidden = !user;
  openBtn.hidden = Boolean(user);
}

/** 앱 시작 시 한 번 호출한다. onChange(session|null)은 로그인 상태가 바뀔 때마다 불린다 */
export async function initAuthUi(onChange = () => {}) {
  if (!bar || !isSupabaseConfigured()) return; // 로그인 UI가 없는 페이지(테스트 등)에서는 아무것도 하지 않는다
  render(null);

  let client;
  try {
    client = await getClient();
  } catch (e) {
    bar.hidden = false;
    openBtn.disabled = true;
    who.textContent = korean(e);
    who.hidden = false;
    return;
  }

  // 리스너를 먼저 모두 달고 나서 막대를 보여준다(비동기 대기 중에 폼이 네이티브 제출되는 것을 막는다)
  openBtn.addEventListener('click', openModal);
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  outBtn.addEventListener('click', () => client.auth.signOut());

  async function submit(kind) {
    const email = emailEl.value.trim();
    const password = pwEl.value;
    if (!email || !password) return say('이메일과 비밀번호를 입력해 주세요.');
    form.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    try {
      if (kind === 'login') {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) return say(korean(error));
        closeModal();
      } else {
        // GitHub Pages 배포 후에도 확인 메일 링크가 현재 주소로 돌아오게 한다
        const { data, error } = await client.auth.signUp({
          email, password, options: { emailRedirectTo: location.origin + location.pathname },
        });
        if (error) return say(korean(error));
        if (data.session) closeModal();
        else say('가입 확인 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인해 주세요.', false);
      }
    } catch (e) {
      say(korean(e));
    } finally {
      form.querySelectorAll('button').forEach((b) => { b.disabled = false; });
    }
  }
  form.addEventListener('submit', (e) => { e.preventDefault(); submit('login'); });
  signupBtn.addEventListener('click', () => submit('signup'));

  client.auth.onAuthStateChange((_event, session) => {
    render(session);
    onChange(session);
  });
  bar.hidden = false;
  const { data } = await client.auth.getSession();
  render(data.session);
  onChange(data.session);
}
