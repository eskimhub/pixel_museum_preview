// 업로드할 이미지를 작은 PNG로 줄인다. 원본이 커도 전시용으로는 긴 변 256px이면 충분하고(저해상도 렌더링),
// 용량이 작아 Storage 한도(5MB)에 걸리지 않는다.

export const MAX_SIDE = 256;
export const MAX_INPUT_BYTES = 15 * 1024 * 1024;
export const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/** 축소 후 크기. 확대는 하지 않는다 */
export function fitSize(w, h, maxSide = MAX_SIDE) {
  const scale = Math.min(1, maxSide / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
}

/** 파일 검사. 문제가 있으면 한국어 메시지, 없으면 null */
export function checkImageFile(file) {
  if (!file) return '이미지를 선택해 주세요.';
  if (!ALLOWED_TYPES.includes(file.type)) return 'png, jpg, webp 이미지만 올릴 수 있습니다.';
  if (file.size > MAX_INPUT_BYTES) return '이미지가 너무 큽니다. 15MB 이하로 골라 주세요.';
  return null;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지를 읽을 수 없습니다. 다른 파일을 골라 주세요.')); };
    img.src = url;
  });
}

/** File -> PNG Blob (긴 변 최대 256px) */
export async function toPng(file) {
  const problem = checkImageFile(file);
  if (problem) throw new Error(problem);
  const img = await loadImage(file);
  const { w, h } = fitSize(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  g.drawImage(img, 0, 0, w, h);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('이미지를 변환하지 못했습니다.');
  return blob;
}
