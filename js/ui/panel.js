// 작품 상세 패널. 슬롯이 비어 있으면 빈 액자 안내를, 작품이 있으면 이미지·제목·설명·작성자를 보여준다.
// 내용은 textContent로만 넣는다(작품 제목·설명은 사용자가 입력하므로 HTML로 해석하면 안 된다).

const panel = document.getElementById('panel');
const img = document.getElementById('panel-image');
const title = document.getElementById('panel-title');
const author = document.getElementById('panel-author');
const desc = document.getElementById('panel-desc');
const hint = document.getElementById('prompt');

export function isPanelOpen() {
  return !panel.hidden;
}

/** slot: 슬롯 정보, art: 작품 또는 undefined(빈 액자), emptyText: 빈 자리일 때 설명 문구(생략하면 기본 문구) */
export function openPanel(slot, art, emptyText) {
  if (art) {
    img.src = art.imageUrl;
    img.alt = art.title;
    img.hidden = false;
    title.textContent = art.title;
    author.textContent = art.author ? `작가 ${art.author}` : '';
    desc.textContent = art.description || '';
  } else {
    img.hidden = true;
    img.removeAttribute('src');
    title.textContent = slot.kind === 'statue' ? '비어 있는 전시대' : '비어 있는 액자';
    author.textContent = '';
    desc.textContent = emptyText || '아직 전시된 작품이 없습니다.';
  }
  panel.hidden = false;
}

export function closePanel() {
  panel.hidden = true;
}

/** 화면 아래 "E: 보기" 안내. text가 null이면 숨긴다 */
export function showPrompt(text) {
  if (text) {
    hint.textContent = text;
    hint.hidden = false;
  } else {
    hint.hidden = true;
  }
}
