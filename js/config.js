// 화면/게임 기본 설정.
export const CONFIG = {
  museumName: '김동구전',
  // 내부 렌더링 해상도를 화면 크기의 1/PIXEL_SCALE로 낮춰 픽셀 느낌을 만든다.
  pixelScale: 4,
  // 전시 슬롯: 벽 액자 12개 + 중앙 조각상 1개
  wallSlots: 12,
  statueSlots: 1,
  // Supabase 대시보드 > Project Settings > API 의 Project URL 과 anon(public) 또는 publishable key.
  // anon key는 공개되어도 되는 키다(접근 제어는 RLS가 한다). service_role 키는 절대 넣지 않는다.
  // 둘 다 비어 있으면 로그인 UI가 나타나지 않고 단계 2의 로컬 데이터로만 동작한다.
  supabaseUrl: 'https://aixvmvwdkdsvrskwekii.supabase.co',
  supabaseAnonKey: 'sb_publishable_38d0Bp33nfN9BflAJL_fKA_G7dGjYTz',
  // 사이트가 보여 줄 미술관의 id. 채워 두면 방문자는 로그인 없이 이 미술관을 관람하고, 올리기는 이 미술관의 주인만 할 수 있다.
  // 비워 두면 로그인한 사용자 자신의 미술관을 보여 주고 누구나 올릴 수 있다(처음 미술관을 만들 때의 상태).
  museumId: 'ab774c45-8513-47a5-9292-0d383fa7368b',
  // Blender에서 내보낸 미술관 모델. 비워 두거나 불러오지 못하면 코드로 만든 방을 쓴다.
  museumModel: 'assets/museum.glb',
};
