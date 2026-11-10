# pixel_museum

**김동구전** - 픽셀 느낌의 3D 가상 미술관. 캐릭터를 조작해 미술관을 돌아다니고, 작품을 액자로 전시하며, 다른 사용자의 미술관을 방문한다.

- 개발 계획: [PLAN.md](PLAN.md)
- 진행 기록과 이어서 하는 방법: [PROGRESS.md](PROGRESS.md)
- 배포 예정: GitHub Pages (`https://eskimhub.github.io/pixel_museum/`)

## 기술

- Three.js r160 (`vendor/`에 포함, 빌드 도구 없음)
- HTML / CSS / JavaScript (ES 모듈)
- Supabase (Auth, Database, Storage) - 단계 3부터

## 로컬 실행

ES 모듈은 `file://`로는 동작하지 않으므로 로컬 서버가 필요하다.

```bash
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 열기
```

3D 화면에는 WebGL이 필요하다. Chrome에서 "WebGL을 사용할 수 없습니다"가 뜨면 `chrome://gpu`를 확인하고, 오래된 GPU라면 Safari를 사용한다.

## 테스트

서버를 켠 상태에서 브라우저로 아래 페이지를 열면 결과가 화면에 표시된다(`RESULT ALL PASS`).

- `http://localhost:8000/tests/collision.test.html` - 충돌 판정
- `http://localhost:8000/tests/slots.test.html` - 전시 슬롯 배치
- `http://localhost:8000/tests/movement.test.html` - 키 입력과 이동 (WebGL 필요)
- `http://localhost:8000/tests/interact.test.html` - 작품 상호작용과 상세 패널 (WebGL 필요)
- `http://localhost:8000/tests/auth.test.html?mode=empty` 와 `?mode=fake` - 로그인 UI (WebGL 필요)
- `http://localhost:8000/tests/museumApi.test.html` - 데이터 계층과 이미지 축소 (모의 서버)
- `http://localhost:8000/tests/upload.test.html` - 작품 올리기 화면 흐름 (모의 서버, WebGL 필요)
- `http://localhost:8000/tests/guest.test.html` - 게스트 입장 (모의 클라이언트)
- `http://localhost:8000/tests/touch.test.html?touch=1` - 모바일 조이스틱·버튼 (WebGL 필요)
- `http://localhost:8000/tests/guestbook.test.html` - 방명록 (모의 서버, WebGL 필요)
- `http://localhost:8000/tests/auth.live.test.html` - 실제 Supabase 서버 연결 (브라우저에서 열면 결과 표시)

## 진행 상황

- [x] 단계 0: 프로젝트 준비 (저해상도 3D 화면 확인)
- [x] 단계 1: 미술관 공간 + 캐릭터 이동 (방향키/WASD, 벽·장애물 충돌)
- [x] 단계 2: 전시 슬롯 13개(벽 액자 12 + 조각상 1) + 상호작용
- [ ] 단계 3: Supabase 연결 + 이메일 로그인 (스키마·RLS 검증 완료, 프로젝트 REST 503 해결 대기)
- [ ] 단계 4: 작품 업로드 (구현·모의 테스트 완료, 실서버 확인 대기)
- [x] 추가 기능(구현·모의 테스트 완료): 게스트 업로드, 못생긴 펭귄 캐릭터, 모바일 터치 조작, 방명록. 게스트 업로드는 Supabase 대시보드에서 "Allow anonymous sign-ins"를 켜야 동작한다
- [ ] 단계 5~8: 수정, 방문, 디자인, 배포

## 라이선스

`vendor/three.module.js`는 MIT 라이선스 ([vendor/THREE_LICENSE.txt](vendor/THREE_LICENSE.txt)).
