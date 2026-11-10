// 단계 2용 임시 작품. 단계 4에서 Supabase의 실제 업로드 작품으로 대체된다.
// 작품은 { title, description, author, imageUrl } 형태이고, 슬롯 id를 키로 한다.

const W = 64;
const H = 48;

function px(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

const PAINTINGS = {
  // 노을 지는 바다
  sunset(ctx) {
    const sky = ['#2b1b4a', '#5a2a6a', '#a8406a', '#e8706a', '#f5a860', '#fbd48a'];
    sky.forEach((c, i) => px(ctx, 0, i * 5, W, 5, c));
    px(ctx, 0, 30, W, 18, '#1f3a6a');
    for (let y = 30; y < H; y += 3) px(ctx, 24 + (y % 6), y, 14 - (y - 30) / 3, 1, '#f5a860');
    px(ctx, 26, 20, 12, 10, '#fff1b8');
    px(ctx, 28, 18, 8, 2, '#fff1b8');
  },
  // 산과 호수
  mountain(ctx) {
    px(ctx, 0, 0, W, 30, '#9cc8e8');
    px(ctx, 0, 30, W, 18, '#3d7a8a');
    // 두 봉우리: 한 칸씩 올라갔다 내려오는 삼각형 (수면 y=30까지 채움)
    for (let i = 0; i < 24; i++) px(ctx, 8 + i, 30 - (i + 1), 1, i + 1, '#6a7a90');
    for (let i = 0; i < 20; i++) px(ctx, 32 + i, 30 - (20 - i), 1, 20 - i, '#556680');
    px(ctx, 28, 8, 6, 3, '#ffffff');
    px(ctx, 20, 4, 3, 2, '#ffffff');
  },
  // 달밤의 고양이
  moon(ctx) {
    px(ctx, 0, 0, W, H, '#15183a');
    px(ctx, 40, 6, 12, 12, '#f4ecc0');
    px(ctx, 44, 4, 6, 2, '#f4ecc0');
    px(ctx, 43, 8, 3, 3, '#e0d8a0');
    for (const [x, y] of [[6, 6], [14, 14], [24, 5], [30, 16], [58, 24], [10, 24]]) px(ctx, x, y, 1, 1, '#ffffff');
    px(ctx, 0, 38, W, 10, '#0b0d20');
    px(ctx, 14, 30, 14, 9, '#222233');
    px(ctx, 16, 26, 10, 6, '#222233');
    px(ctx, 16, 24, 2, 3, '#222233');
    px(ctx, 24, 24, 2, 3, '#222233');
    px(ctx, 18, 28, 2, 1, '#e8c840');
    px(ctx, 22, 28, 2, 1, '#e8c840');
  },
  // 추상: 색 블록
  abstract(ctx) {
    px(ctx, 0, 0, W, H, '#f0e6d0');
    px(ctx, 4, 4, 24, 20, '#d83a3a');
    px(ctx, 30, 4, 30, 10, '#2a52a8');
    px(ctx, 30, 16, 14, 28, '#f0c828');
    px(ctx, 4, 26, 24, 18, '#222222');
    px(ctx, 46, 16, 14, 28, '#f0e6d0');
    px(ctx, 10, 32, 12, 6, '#f0e6d0');
  },
  // 해바라기
  flower(ctx) {
    px(ctx, 0, 0, W, H, '#bfe0f0');
    px(ctx, 0, 38, W, 10, '#5a9a3a');
    px(ctx, 31, 22, 2, 18, '#3a7a2a');
    px(ctx, 24, 30, 7, 3, '#3a7a2a');
    px(ctx, 33, 32, 7, 3, '#3a7a2a');
    for (let a = 0; a < 8; a++) {
      const dx = Math.round(Math.cos((a * Math.PI) / 4) * 9);
      const dy = Math.round(Math.sin((a * Math.PI) / 4) * 9);
      px(ctx, 30 + dx, 16 + dy, 4, 4, '#f5c518');
    }
    px(ctx, 28, 14, 8, 8, '#6a3a1a');
  },
};

function paint(kind) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  PAINTINGS[kind](canvas.getContext('2d'));
  return canvas.toDataURL('image/png');
}

/** 슬롯 id -> 작품. 여기에 없는 슬롯은 빈 액자다. */
export function sampleArtworks() {
  return {
    1: { title: '노을', description: '하루가 끝나는 바다 위로 해가 내려앉는 장면.', author: '김동구', imageUrl: paint('sunset') },
    3: { title: '고요한 산', description: '이른 아침, 호수에 비친 산과 구름.', author: '김동구', imageUrl: paint('mountain') },
    5: { title: '달밤의 고양이', description: '깊은 밤 지붕 위에서 달을 올려다보는 고양이.', author: '김동구', imageUrl: paint('moon') },
    6: { title: '색의 구성', description: '빨강, 파랑, 노랑과 검정으로 나눈 화면.', author: '김동구', imageUrl: paint('abstract') },
    9: { title: '해바라기', description: '여름 들판에 홀로 선 해바라기 한 송이.', author: '김동구', imageUrl: paint('flower') },
    12: { title: '조각상: 사색하는 사람', description: '단상 위에서 전시장을 지켜보는 석상. 조각상 자리에는 입체 작품을 올릴 수 있다.', author: '김동구', imageUrl: paint('moon') },
  };
}
