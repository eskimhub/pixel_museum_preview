// 게스트 입장: 가입 없이 바로 작품을 올릴 수 있게 한다.
// 1) Supabase 익명 로그인  2) 익명 로그인이 꺼져 있으면 가상 ID/비밀번호 계정을 자동 생성
// 3) 그것도 막혀 있으면(이메일 확인 켜짐, 메일 한도 초과 등) 대시보드에서 바꿀 설정을 안내한다.
// 가상 계정의 ID/비밀번호는 이 브라우저의 localStorage에만 저장한다(같은 기기에서 같은 미술관으로 돌아오기 위함).

const STORE_KEY = 'pixelMuseum.guest';
// 실제 메일을 받을 일이 없는 가상 주소. Supabase의 주소 형식 검사만 통과하면 된다.
const GUEST_DOMAIN = 'pixelmuseum.app';

export class GuestError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code; // 'confirm_email' | 'rate_limit' | 'unavailable'
  }
}

function randomHex(bytes) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function makeGuestCredentials() {
  return { email: `guest-${randomHex(6)}@${GUEST_DOMAIN}`, password: randomHex(16) };
}

export function isGuestEmail(email) {
  return typeof email === 'string' && email.startsWith('guest-') && email.endsWith(`@${GUEST_DOMAIN}`);
}

/** 세션 사용자가 게스트(익명 또는 가상 계정)인지 */
export function isGuestUser(user) {
  return Boolean(user) && (user.is_anonymous === true || isGuestEmail(user.email));
}

function readStored(storage) {
  try {
    const v = JSON.parse(storage.getItem(STORE_KEY));
    return v && isGuestEmail(v.email) && typeof v.password === 'string' ? v : null;
  } catch {
    return null;
  }
}

const anonymousOff = (err) => err?.code === 'anonymous_provider_disabled' || /anonymous/i.test(err?.message || '');
const rateLimited = (err) => err?.status === 429 || /rate limit/i.test(err?.code || err?.message || '');

/** 게스트 안내 문구(한국어). GuestError가 아니면 null */
export function guestHelp(err) {
  if (!(err instanceof GuestError)) return null;
  if (err.code === 'confirm_email') {
    return '게스트 입장이 막혀 있습니다. Supabase 대시보드 > Authentication > Sign In / Providers에서 "Allow anonymous sign-ins"를 켜거나, Email 공급자의 "Confirm email"을 꺼 주세요.';
  }
  if (err.code === 'rate_limit') {
    return '가입 메일 발송 한도에 걸렸습니다. 잠시 뒤 다시 시도하거나, Supabase 대시보드에서 "Allow anonymous sign-ins"를 켜 주세요.';
  }
  return '게스트로 입장하지 못했습니다. 네트워크와 Supabase 설정을 확인해 주세요.';
}

/**
 * 게스트 세션을 만든다. 이미 세션이 있으면 그대로 돌려준다.
 * 반환: { session, kind: 'existing' | 'anonymous' | 'virtual' }
 */
export async function ensureGuest(client, storage = window.localStorage) {
  const { data: cur } = await client.auth.getSession();
  if (cur?.session) return { session: cur.session, kind: 'existing' };

  const anon = await client.auth.signInAnonymously();
  if (!anon.error && anon.data?.session) return { session: anon.data.session, kind: 'anonymous' };
  if (anon.error && !anonymousOff(anon.error)) {
    if (rateLimited(anon.error)) throw new GuestError('rate_limit', anon.error.message);
    throw anon.error;
  }

  // 익명 로그인이 꺼져 있다: 저장해 둔 가상 계정으로 다시 들어가 본다
  const saved = readStored(storage);
  if (saved) {
    const back = await client.auth.signInWithPassword(saved);
    if (!back.error && back.data?.session) return { session: back.data.session, kind: 'virtual' };
  }

  // 새 가상 계정을 만든다
  const cred = makeGuestCredentials();
  const up = await client.auth.signUp(cred);
  if (up.error) {
    if (rateLimited(up.error)) throw new GuestError('rate_limit', up.error.message);
    throw new GuestError('unavailable', up.error.message);
  }
  if (!up.data?.session) throw new GuestError('confirm_email', '이메일 확인이 켜져 있어 세션이 만들어지지 않았습니다.');
  storage.setItem(STORE_KEY, JSON.stringify(cred));
  return { session: up.data.session, kind: 'virtual' };
}
