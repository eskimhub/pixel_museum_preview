// Supabase 데이터 계층: 내 미술관 읽기, 작품 읽기, 작품 업로드.
// client는 supabase-js 클라이언트다. 화면(DOM)을 직접 건드리지 않아 모의 클라이언트로 테스트할 수 있다.

export const BUCKET = 'artworks';
export const LIMITS = { slotMax: 12, titleMax: 60, descMax: 500 };

/** 내 미술관 한 개를 읽는다. 없으면 null */
export async function loadMyMuseum(client, userId) {
  const { data, error } = await client
    .from('museums')
    .select('id, name, is_public, owner_id')
    .eq('owner_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** 지정한 미술관 한 개를 읽는다. 공개 미술관은 로그인 없이도 읽힌다. 없으면 null */
export async function loadMuseumById(client, id) {
  const { data, error } = await client
    .from('museums')
    .select('id, name, is_public, owner_id')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** 미술관의 작품을 읽어 { [slot]: { id, title, description, author, imageUrl } } 로 돌려준다 */
export async function loadArtworks(client, museum) {
  const { data, error } = await client
    .from('artworks')
    .select('id, slot, title, description, image_path')
    .eq('museum_id', museum.id);
  if (error) throw error;
  const map = {};
  for (const row of data) map[row.slot] = toArtwork(client, row);
  return map;
}

function toArtwork(client, row) {
  const { data } = client.storage.from(BUCKET).getPublicUrl(row.image_path);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    author: '',
    imagePath: row.image_path,
    imageUrl: data.publicUrl,
  };
}

/** 입력 검증. 문제가 있으면 한국어 메시지를, 없으면 null을 돌려준다 */
export function validateArtwork({ slot, title, description }) {
  if (!Number.isInteger(slot) || slot < 0 || slot > LIMITS.slotMax) return '전시 자리가 올바르지 않습니다.';
  if (!title || !title.trim()) return '제목을 입력해 주세요.';
  if (title.trim().length > LIMITS.titleMax) return `제목은 ${LIMITS.titleMax}자 이하로 입력해 주세요.`;
  if ((description || '').length > LIMITS.descMax) return `설명은 ${LIMITS.descMax}자 이하로 입력해 주세요.`;
  return null;
}

/**
 * 이미지를 Storage에 올리고 artworks 행을 만든다.
 * 행 저장이 실패하면 방금 올린 파일을 지워 고아 파일이 남지 않게 한다.
 * blob: 이미 리사이즈된 PNG. 반환값은 loadArtworks와 같은 작품 형태.
 */
export async function uploadArtwork(client, { museum, userId, slot, title, description, blob }) {
  const problem = validateArtwork({ slot, title, description });
  if (problem) throw new Error(problem);

  const path = `${userId}/${slot}-${Date.now()}.png`;
  const up = await client.storage.from(BUCKET).upload(path, blob, { contentType: 'image/png', upsert: false });
  if (up.error) throw up.error;

  const ins = await client
    .from('artworks')
    .insert({ museum_id: museum.id, slot, title: title.trim(), description: description || '', image_path: path })
    .select('id, slot, title, description, image_path')
    .single();
  if (ins.error) {
    await client.storage.from(BUCKET).remove([path]); // 실패해도 원래 오류를 우선 알린다
    throw ins.error;
  }
  return toArtwork(client, ins.data);
}

/**
 * 걸린 작품의 그림을 새 이미지로 바꾼다(제목·설명도 함께). 새 파일을 먼저 올리고 행을 고친 뒤 옛 파일을 지운다.
 * 행 수정이 실패하면 방금 올린 새 파일을 지워 원래 작품이 그대로 남게 한다.
 */
export async function replaceArtwork(client, { userId, art, slot, title, description, blob }) {
  const problem = validateArtwork({ slot, title, description });
  if (problem) throw new Error(problem);

  const path = `${userId}/${slot}-${Date.now()}.png`;
  const up = await client.storage.from(BUCKET).upload(path, blob, { contentType: 'image/png', upsert: false });
  if (up.error) throw up.error;

  const upd = await client
    .from('artworks')
    .update({ title: title.trim(), description: description || '', image_path: path })
    .eq('id', art.id)
    .select('id, slot, title, description, image_path')
    .single();
  if (upd.error) {
    await client.storage.from(BUCKET).remove([path]);
    throw upd.error;
  }
  await client.storage.from(BUCKET).remove([art.imagePath]); // 옛 파일 정리. 실패해도 새 그림은 이미 걸렸다
  return toArtwork(client, upd.data);
}

/** 작품을 내린다: 행을 지우고 이미지 파일도 지운다 */
export async function removeArtwork(client, art) {
  const { data, error } = await client.from('artworks').delete().eq('id', art.id).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('작품을 내릴 권한이 없거나 이미 내려진 작품입니다.');
  await client.storage.from(BUCKET).remove([art.imagePath]);
}

/** 서버 오류를 사용자에게 보여줄 한국어 메시지로 바꾼다 */
export function describeError(err) {
  const code = err?.code || err?.statusCode;
  const msg = err?.message || String(err);
  if (code === 'PGRST002' || /schema cache/i.test(msg)) return '서버가 아직 준비되지 않았습니다. 잠시 뒤에 다시 시도해 주세요.';
  if (code === '23505') return '이 자리에는 이미 작품이 있습니다.';
  if (code === '42501' || /row-level security/i.test(msg)) return '이 미술관에는 작품을 올릴 권한이 없습니다.';
  if (code === 'PGRST116') return '작품을 바꿀 권한이 없거나 이미 내려진 작품입니다.';
  if (/Failed to fetch|NetworkError/i.test(msg)) return '서버에 연결하지 못했습니다. 네트워크를 확인해 주세요.';
  if (/exceeded the maximum allowed size|too large/i.test(msg)) return '이미지 용량이 너무 큽니다.';
  if (/mime type/i.test(msg)) return 'png, jpg, webp 이미지만 올릴 수 있습니다.';
  return msg;
}
