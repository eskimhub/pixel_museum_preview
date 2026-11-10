// Supabase 클라이언트. 설정(CONFIG)이 비어 있으면 아무것도 불러오지 않는다.
// vendor/supabase.js(UMD)는 설정이 있을 때만 <script>로 불러온다.
import { CONFIG } from './config.js';

export function isSupabaseConfigured() {
  return Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);
}

let clientPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`${src} 를 불러오지 못했습니다.`));
    document.head.appendChild(s);
  });
}

/** 설정이 있으면 클라이언트를, 없으면 null을 돌려준다. 같은 클라이언트를 재사용한다. */
export function getClient() {
  if (!isSupabaseConfigured()) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = loadScript(new URL('../vendor/supabase.js', import.meta.url).href).then(() =>
      window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey),
    );
  }
  return clientPromise;
}
