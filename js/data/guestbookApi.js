// 방명록 데이터 계층. 서버 규칙(RLS)은 supabase/schema.sql 6)에 있고, 여기서는 입력 검증과 호출만 한다.

export const GB_LIMITS = { nameMax: 20, messageMax: 200, listMax: 50 };

/** 문제가 있으면 한국어 안내 문구를, 없으면 null을 돌려준다 */
export function validateEntry({ name, message }) {
  const n = (name ?? '').trim();
  const m = (message ?? '').trim();
  if (!n) return '이름을 입력해 주세요.';
  if (n.length > GB_LIMITS.nameMax) return `이름은 ${GB_LIMITS.nameMax}자 이하로 적어 주세요.`;
  if (!m) return '남길 말을 입력해 주세요.';
  if (m.length > GB_LIMITS.messageMax) return `한 줄 메시지는 ${GB_LIMITS.messageMax}자 이하로 적어 주세요.`;
  return null;
}

/** 최신순 방명록. 화면에 쓸 값만 골라 돌려준다 */
export async function loadEntries(client, museumId) {
  const { data, error } = await client
    .from('guestbook_entries')
    .select('id, author_id, author_name, message, created_at')
    .eq('museum_id', museumId)
    .order('created_at', { ascending: false })
    .limit(GB_LIMITS.listMax);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id, authorId: r.author_id, name: r.author_name, message: r.message, createdAt: r.created_at,
  }));
}

export async function addEntry(client, { museumId, name, message }) {
  const problem = validateEntry({ name, message });
  if (problem) throw new Error(problem);
  const { data, error } = await client
    .from('guestbook_entries')
    .insert({ museum_id: museumId, author_name: name.trim(), message: message.trim() })
    .select('id, author_id, author_name, message, created_at')
    .single();
  if (error) throw error;
  return { id: data.id, authorId: data.author_id, name: data.author_name, message: data.message, createdAt: data.created_at };
}

export async function deleteEntry(client, id) {
  const { error } = await client.from('guestbook_entries').delete().eq('id', id);
  if (error) throw error;
}

/** 지울 수 있는 글인가: 쓴 사람 본인이거나 미술관 주인 */
export function canDelete(entry, { userId, ownerId }) {
  return Boolean(userId) && (entry.authorId === userId || ownerId === userId);
}

export function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}
