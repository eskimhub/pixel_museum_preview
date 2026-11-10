# 진행 기록 (이어서 작업하기)

마지막 갱신: 2026-11-10. 새 세션에서는 이 파일과 [PLAN.md](PLAN.md)를 먼저 읽고 시작한다. **현재 상태는 바로 아래 "현재 상태 (2026-11-10)"가 가장 최신이다.** 그 아래 단계별 기록 중 "REST 503 미해결", "push 전"이라고 쓴 부분은 당시 기록이며 모두 해결됐다.

## 현재 상태 (2026-11-10)

- **사이트 공개 중:** https://eskimhub.github.io/pixel_museum/ (GitHub Pages, `main` 브랜치, 최신 코드 커밋 `efce058`). 파일과 Supabase REST 모두 200 응답을 확인했다
- 방문자는 로그인 없이 주인의 미술관(작품 9점)을 보고, "게스트로 입장"해 방명록을 남길 수 있다. 올리기·바꾸기·내리기는 주인 계정(`dmstjd914@gmail.com`)만 가능하다 (`js/config.js`의 `museumId`)
- 실서버에서 확인한 것: 비로그인 방문 시 작품 9점 로드, 수정 버튼 없음, 게스트 입장 후 방명록 글 표시, 남이 작품 행·이미지를 고치거나 지우는 것 차단
- 정리한 것: 배포 확인용 테스트 글과 익명 테스트 계정을 DB에서 삭제했다. 주인 계정, 미술관, 작품 9점은 그대로다

### 아직 못 한 것 (다음에 이어서)

1. **주인 계정으로 실사이트에서 올리기·바꾸기·내리기 해보기:** 비밀번호를 모르는 AI는 못 한다. 사용자가 직접 한 번 확인해야 한다. 같은 흐름은 모의 서버 테스트(`manage` 21개, `upload` 23개)로만 확인했다
2. **휴대폰 실기기 확인:** 헤드리스 브라우저는 터치 기기가 아니라(`pointer: coarse` 아님) 조이스틱과 "보기" 버튼이 나타나지 않는다. 390px 폭 스크린샷에서는 상단 안내, 방명록·로그인 버튼, 캐릭터, 액자가 겹치지 않고 보이는 것까지만 확인했다. 터치 UI를 보려면 `tests/touch.test.html?touch=1` 또는 실제 폰이 필요하다
3. **Supabase 대시보드 (사용자가 직접):** Authentication > URL Configuration의 Site URL과 Redirect URLs를 `https://eskimhub.github.io/pixel_museum/`로 바꾼다 (이메일 확인 링크용)
4. **보안 정리 (사용자가 직접):** 채팅에 붙여넣은 GitHub 토큰 `ghp_…`를 https://github.com/settings/tokens 에서 폐기하고, `sed -i '' '/ghp_/d' ~/.zsh_history`로 기록을 지운다. 이 토큰은 AI가 쓴 적이 없다
5. **비밀번호 찾기 기능 없음:** 주인 비밀번호를 잊으면 복구 수단이 없다 (DB에서 직접 재설정해야 한다)
6. **보류:** 공개 미술관 목록 화면(단계 4)은 사용자가 "나중에 정하겠다"고 했다. 스토리지 `artworks` 버킷에 쓰이지 않는 이미지 3개가 남아 있다 (uid `55bd8e6c…`, `a3183024…`, `f0eac05e…`). 원하면 Storage API로 지운다. `favicon.ico`가 없어 콘솔에 404가 하나 뜬다 (무해)
7. 단계 7~8 중 디자인 다듬기는 미착수. 배포는 완료

### 운영 메모

- **주인 미술관:** id `ab774c45-8513-47a5-9292-0d383fa7368b`, owner_id `d71943da-8cf3-40d0-9b48-09193d6c9689`. **이 uid 아래 파일과 행은 절대 지우지 않는다.** 익명 사용자 정리(`delete from auth.users where is_anonymous`)는 안전하다
- **Supabase 프로젝트:** ref `aixvmvwdkdsvrskwekii`. 대시보드에서 "Allow anonymous sign-ins"를 켰고 프로젝트를 재시작해 REST 503이 풀렸다. "Confirm email"은 켜져 있어 가입 메일은 `over_email_send_rate_limit`에 걸릴 수 있다. 그래서 주인 계정은 DB에서 `email_confirmed_at = now()`로 인증했다
- **DB 직접 접속:** 파이썬 `pg8000.native`, host `aws-0-ap-northeast-1.pooler.supabase.com`, port 5432, user `postgres.aixvmvwdkdsvrskwekii`, `ssl._create_unverified_context()`. 비밀번호는 `.env`의 `superbaseurl` 줄 값이다. **`.env` 내용은 화면에 출력하지 않는다.** 줄 구분자가 `=`가 아니라 `:`이므로 `^([^=:\s]+)\s*[=:]\s*(.*)$`로 읽는다
- `storage.objects`를 SQL로 직접 지우는 것은 막혀 있다. Storage API를 쓴다
- **브라우저 자동화:** gstack `browse` (`~/.bob/gstack/browse/dist/browse`). WebGL을 쓰려면 `export GSTACK_DISABLE_GPU=off`가 필요하고, Chrome·Bun 경로는 `~/.zshenv`에 있다. 스크린샷은 워크스페이스 안(`.bob/tmp/`)에 저장해야 읽을 수 있다. 끝나면 `browse stop`과 `rm -rf .bob/tmp`
- 로컬 서버 `python3 -m http.server 8000`은 명령이 끝나면 죽는다. `background: true`로 띄우고 끝나면 `pkill -f "http.server 8000"`
- `tests/touch.test.html`은 원래 코드에서도 헤드리스에서 11개가 실패한다 (터치 환경 문제, 무관)
- 캐시에 영향받는 테스트는 URL에 `?v=$RANDOM`을 붙이고 `browse stop` 후 다시 연다
- **GitHub 인증:** 키체인의 github.com 자격 증명은 지웠다. `gh` CLI v2.103.3이 `~/.bob/tools/gh`에 있고 로그인은 `~/.bob/tools/gh auth login --hostname github.com --git-protocol https --web`. 커밋 작성자 이메일이 공개되는 것은 사용자가 승인했다
- **gstack** (garrytan/gstack)이 `~/.bob/gstack`에 설치되어 있고 스킬 63개가 `~/.bob/skills`에 등록되어 있다

### Blender 모델 적용 (브랜치 `blender-museum`, 2026-11-10, **main에는 병합하지 않음, 공개 사이트에 반영 안 됨**)

- `assets/museum.glb`(1.8MB, Blender 4.2에서 내보냄)를 `js/game/glbMuseum.js`의 `loadGlbMuseum`이 불러온다. `js/main.js`의 `useBlenderModel`이 코드로 만든 방(`buildMuseum`)과 액자(`buildFrames`)를 모델로 바꿔 끼운다. 켜고 끄기는 `js/config.js`의 `museumModel`(비우면 기존 코드 방)
- 모델은 `layout.js`와 같은 좌표·치수다. 벽 액자 12개의 그림 면은 `picture_<슬롯 id>` 메시이고, `frames[id].setArtwork`를 같은 인터페이스로 이어받는다. 충돌·슬롯·상호작용 코드는 바꾸지 않았다. 조각상(12번)은 액자가 아니라 모델에 그대로 들어 있다
- 불러오기에 실패하면 경고만 남기고 코드로 만든 방을 그대로 쓴다. 그래서 `tests/` 안의 페이지는 상대 경로(`assets/museum.glb`) 때문에 404가 나서 **항상 코드 방으로 돌아간다.** 즉 기존 테스트는 모델 경로를 검증하지 않는다
- `makeArtworkSetter`, `makeEmptyPictureMaterial`을 `frames.js`에서 내보내 코드 액자와 모델이 함께 쓴다 (기존 동작 그대로 옮김)
- 모델의 PBR 재질(크롬 기둥, 금 테두리)은 환경광이 없으면 검게 보여서 `RoomEnvironment`(three 예제 애드온, `vendor/three-addons/`)로 `scene.environment`를 넣었다 (`environmentIntensity` 0.6)
- 확인한 것: 데스크톱 1280x720에서 액자 12개를 이어받고, 작품이 모델의 액자 안에 제대로 들어가며(방향·비율 정상) 설명판·화분·벽 몰딩 위치가 맞는다. 기존 테스트 10종(collision, museumApi, guest, guestbook, shared, manage, upload, interact, movement, auth)이 모두 통과
- **미확인:** 모바일 성능(메시 302개, 노드 338개라 드로우콜이 많다), 휴대폰에서의 로딩 시간(1.8MB), 크롬 외 브라우저, 모델 경로를 직접 검증하는 자동 테스트(없음)
- 판단은 사용자에게: 이 모델 화면을 공개 사이트에 쓸지(main 병합), 아니면 비교만 하고 접을지. 병합 전에 휴대폰에서 부드럽게 도는지 확인하는 것을 권한다

### Blender 탐색 기록

- 사용자 설명: 처음에는 게임을 **바꾸려는 것이 아니라**, Blender를 써서 어느 정도까지 바꿀 수 있는지 가능성을 보는 탐색이었다. 이후 "1. 이어서 적용"을 선택해 위 브랜치 작업을 진행했다
- Blender 4.2.23 LTS가 `~/.bob/tools/Blender.app`에 설치되어 있고 실행된다 (`~/.bob/tools/Blender.app/Contents/MacOS/Blender --version`). 설치 파일 `~/.bob/tools/blender-dl/b.dmg`(약 335MB)가 남아 있으니 필요 없으면 지운다
- `blender_demo/`(`.gitignore`로 git 제외, GitHub에는 없음): `art/0~12.png`(작품 이미지 13장), 렌더 `overview_*.png`(위에서 내려다본 홀), `statue_*.png`(눈높이에서 본 홀), `eye_*.png`, 각각 `preview`(저해상도)와 `final`, 그리고 비교용 `current_game.png`(현재 픽셀 게임 화면)
- **`.blend` 파일과 Blender 스크립트는 남아 있지 않다.** 같은 장면을 다시 만들려면 `game/layout.js`의 치수(방, 카펫, 단상 `SLOTS`, 로프, 벤치)를 기준으로 스크립트를 새로 짜야 한다
- 렌더에서 보이는 구성: 붉은 격자무늬 카펫과 금색 테두리, 중앙의 어두운 단상 위 흰 조각상과 줄 울타리, 벤치 2개, 나무 패널 벽과 금 몰딩, 액자 12개와 설명판 스탠드, 화분
- 앞으로 이 방향을 이어간다면 선택지: (a) 렌더를 소개·공유용 이미지로 정리, (b) 장면을 `.glb`로 내보내 Three.js에 넣기 (큰 작업, 현재의 코드 생성 텍스처·저해상도 렌더 방식과 방향이 다르다). 사용자의 결정을 먼저 받는다

## 한눈에 보기

| 단계 | 내용 | 상태 |
|---|---|---|
| 0 | 프로젝트 준비 (Three.js 저해상도 3D 뼈대) | 완료, 커밋됨 |
| 1 | 3D 미술관 공간 + 캐릭터 이동/충돌 | 완료, 커밋됨 (`053cc75`) |
| 2 | 전시 슬롯 13개 + 상호작용 | 완료, 로컬 커밋됨 (push 전) |
| 3 | Supabase 연결 + 인증 | 완료 (REST 503은 프로젝트 재시작으로 해결) |
| 4 | 작품 업로드와 전시 | 완료, 실서버 API로 확인함. 주인 계정의 브라우저 확인만 남음 |
| 4+ | 추가 요청 4건: 게스트 업로드, 못생긴 펭귄, 모바일 조작, 방명록 | 완료. 모바일 실기기 확인만 남음 |
| 5~6 | 수정, 방문 | **완료**: 주인의 작품 바꾸기·내리기, 모두에게 한 미술관 공개(`museumId`), 방문자 관람·방명록 |
| 7 | 배포 | **완료**: GitHub Pages로 공개 중 |
| 8 | 디자인 다듬기 | 미착수 |

## 프로젝트 요약

- 이름: 김동구전 (미술관 이름 = 전시 이름)
- 3D(Three.js r160) 저해상도 렌더링으로 픽셀 느낌. 빌드 도구 없음. GitHub Pages 배포 예정 (`https://eskimhub.github.io/pixel_museum/`)
- 확정 결정: 슬롯 13개(벽 액자 12 + 중앙 조각상 1), 미술관 목록 기본 공개, 방 1개로 시작, 로그인은 이메일/비밀번호로 시작
- 작업 지침: [.bob/rules/coding-guidelines.md](.bob/rules/coding-guidelines.md) (가정을 먼저 밝히고, 최소 변경, 검증 기준을 정하고 끝까지 확인)

## 실행과 테스트

```bash
cd ~/Documents/pixel_museum && python3 -m http.server 8000
```

- 화면: `http://localhost:8000` (Chrome에서 WebGL이 막혀 있으면 Safari 사용. 이 Mac의 Chrome은 WebGL이 꺼져 있었다)
- 충돌 테스트: `tests/collision.test.html` (20개 통과)
- 슬롯 테스트: `tests/slots.test.html` (14개 통과)
- 이동 테스트: `tests/movement.test.html` (WebGL 필요, 16개 통과)
- 상호작용 테스트: `tests/interact.test.html` (WebGL 필요, 17개 통과)
- 게스트 입장 테스트: `tests/guest.test.html` (22개, 모의 클라이언트, WebGL 불필요)
- 모바일 조작 테스트: `tests/touch.test.html?touch=1` (21개, WebGL 필요). `?touch=1`을 붙이면 PC에서도 터치 UI가 나타난다
- 방명록 테스트: `tests/guestbook.test.html` (34개, 모의 서버, WebGL 필요)
- 로그인 UI 테스트: `tests/auth.test.html?mode=empty` (3개), `?mode=fake` (13개) (WebGL 필요). 스크린샷은 `?mode=fake&shot=1`
- 헤드리스 Chrome은 연속 실행하면 WebGL 생성이 실패하는 일이 잦다. 테스트 사이에 30초 이상 간격을 두고 한 번에 하나씩 실행한다 (`WebGL을 사용할 수 없습니다`가 보이면 이 문제)
- 스크린샷 확인용 URL
  - `tests/movement.test.html?shot=x,z&face=up|down|left|right` (플레이어를 그 위치에 놓고 렌더)
  - `tests/interact.test.html?slot=<id>` (해당 슬롯의 상세 패널을 연 상태로 렌더)
- 테스트 페이지에서 `js/main.js`를 import하면 `#prompt`, `#panel`, `#panel-*` 요소가 필요하다. 없으면 `panel.js`가 null을 참조해 `running...`에서 멈춘다
- 헤드리스 Chrome 실행 예 (macOS에는 `timeout` 명령이 없다):
  ```bash
  B="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  "$B" --headless=new --no-sandbox --user-data-dir=/tmp/pm_chrome_x --use-gl=angle --use-angle=swiftshader \
    --enable-unsafe-swiftshader --window-size=960,600 --virtual-time-budget=6000 \
    --screenshot="$PWD/.bob/tmp/shot.png" "http://localhost:8000/tests/movement.test.html?shot=0,5&face=up"
  # 결과 확인은 --screenshot 대신 --dump-dom 으로 받아 PASS/FAIL/RESULT 줄을 grep
  ```
  - 스크린샷은 워크스페이스 안(`.bob/tmp/`)에 저장해야 읽을 수 있다 (`.gitignore`로 제외됨)
  - 연속 실행 시 WebGL 생성이 실패하는 경우가 있어, `--user-data-dir`을 매번 다르게 주고 한 번에 하나씩 실행한다
  - 헤드리스는 `requestAnimationFrame`이 돌지 않아, 테스트는 `window.__pm.update(dt)`를 직접 호출한다

## 파일 구조 (js/)

| 파일 | 역할 |
|---|---|
| `main.js` | 렌더러, 장면, 카메라, 메인 루프(`update(dt)`), 근처 슬롯 안내와 패널 연결, `window.__pm`(테스트용) |
| `config.js` | 미술관 이름, `pixelScale: 4`, 슬롯 수 |
| `game/layout.js` | 방 크기, 카펫, 단상, 로프, 벤치, 화분, **슬롯 13개(`SLOTS`)**, `nearestSlot(pos)`, `COLLIDERS`, `BOUNDS`, 스폰 `(0, 5.5)` |
| `game/MuseumScene.js` | 방의 3D 모델(`buildMuseum`)과 조명(`buildLights`) |
| `game/frames.js` | 벽 액자 12개 3D(`buildFrames`). `frames[id].setArtwork(art \| null)`로 이미지 교체 |
| `game/Player.js`, `sprites.js` | 치비 2D 스프라이트 캐릭터 (4방향 x 3프레임, 코드로 그림, 그림자) |
| `game/textures.js` | 16x16 픽셀 텍스처를 코드로 생성 (`NearestFilter`) |
| `game/collision.js` | 축별 이동 충돌 (벽 따라 미끄러짐) |
| `game/Input.js` | 방향키 + WASD, `E`/`Space` 상호작용, `Esc`/`E`/`Space` 닫기, `consume(action)` |
| `game/artworks.js` | **임시 작품 6점** (슬롯 1,3,5,6,9,12). 단계 4에서 Supabase 데이터로 교체 |
| `ui/panel.js` | 상세 패널 `openPanel/closePanel/isPanelOpen`, 안내 문구 `showPrompt` (`textContent`만 사용) |

## 단계 2 결과

- 벽 액자 12개(북 6, 서 3, 동 3) + 중앙 조각상 1개 = 슬롯 13개. 액자 아래 작품 설명판 스탠드
- 슬롯의 `stand`(관람 위치) 반경 1.6 안에 들어가면 "E / Space: 작품 보기" 또는 "빈 자리 보기" 안내가 뜬다
- `E`/`Space`로 상세 패널(이미지, 제목, 작가, 설명)이 열리고, 열려 있는 동안 캐릭터는 움직이지 않는다. `Esc`/`E`/`Space`로 닫는다
- 빈 슬롯은 "비어 있는 액자" / "비어 있는 전시대"로 표시
- 검증: 위 테스트 4종 모두 `RESULT ALL PASS`. 헤드리스 스크린샷으로 북·서·동쪽 벽 액자 방향, 빈 액자와 채워진 액자 구분, 패널 레이아웃을 확인함. 액자가 나무 패널·금 몰딩과 겹치거나 벽에서 눈에 띄게 떠 있지 않음

## 단계 3 현황 (Supabase)

- 프로젝트: `https://aixvmvwdkdsvrskwekii.supabase.co` (리전 ap-northeast-1). URL과 publishable key는 `js/config.js`에 들어 있다(공개 가능한 값). 비밀값은 `.env`(git 제외)에만 있고 코드에는 넣지 않는다
- 이 Mac에 Supabase CLI 3.0.0 설치됨 (`~/homebrew/bin/supabase`, PATH에 `export PATH="$HOME/homebrew/bin:$PATH"` 필요). **로그인은 안 돼 있다**(`supabase login` 필요). 사용자가 "기존 프로젝트를 쓰겠다"고 했지만 로그인 전이라 어떤 프로젝트인지 확인하지 못했다. 사용자가 연결을 잠시 미루고 로그인 방식 먼저 정하라고 해서 코드부터 작성함
- 로그인 방식: 이메일/비밀번호 (사용자가 고르지 않아 기본값으로 정함)
- 작성됨
  - `supabase/schema.sql`: `museums`(사용자당 1개, 기본 이름 김동구전, 기본 공개), `artworks`(슬롯 0~12, 미술관당 슬롯당 1점), RLS(읽기는 공개 또는 내 것, 쓰기는 주인만), 가입 시 미술관 자동 생성 트리거, `artworks` 스토리지 버킷(5MB, png/jpeg/webp)과 자기 폴더에만 쓰기 정책. **아직 어느 DB에도 실행하지 않았다**
  - `js/supabaseClient.js`: 설정이 있을 때만 `vendor/supabase.js`(supabase-js 2.45.4 UMD, MIT)를 불러온다
  - `js/ui/auth.js` + `index.html`/`css/style.css`: 로그인/가입/로그아웃 UI. 창이 열려 있는 동안 캐릭터 이동 입력은 무시한다. 설정이 비어 있으면 UI가 숨겨진다
  - `js/config.js`: `supabaseUrl`, `supabaseAnonKey` (둘 다 빈 문자열)
  - `tests/auth.test.html?mode=empty|fake`: 설정이 비었을 때 3개, 가짜 서버 주소로 UI 흐름 13개 통과. **실제 Supabase 서버와의 가입/로그인은 검증하지 못했다**
- 실제 서버 적용·검증 결과 (이번 세션)
  - 직접 DB 접속(`db.<ref>.supabase.co:5432`)은 IPv6 전용이라 이 Mac에서 안 된다. **세션 풀러 `aws-0-ap-northeast-1.pooler.supabase.com:5432`, 사용자 `postgres.<ref>`** 로 접속된다 (순수 파이썬 `pg8000`, `pip install --user pg8000`)
  - **`.env`의 DB 비밀번호는 `superbaseurl:` 줄의 값이 맞다** (`superbase_password:` 줄 값은 인증 실패). 이름이 헷갈리니 정리를 권한다
  - `supabase/schema.sql`을 한 트랜잭션으로 적용 완료: 테이블 2개(RLS 켬), 정책 9개, 가입 트리거, `artworks` 버킷(5MB)
  - 실제 가입으로 트리거 확인: 가입하자 미술관 "김동구전"(공개)이 자동 생성됨. 검증용 계정은 삭제했다
  - RLS 18개 검사 모두 통과 (롤백되는 트랜잭션 안에서 JWT 역할을 바꿔가며 검사): 남의 미술관에 작품 올리기·수정·삭제·이름 변경 차단, 공개/비공개 읽기, 비로그인 읽기만 가능, 슬롯 중복·범위·빈 제목 차단, 스토리지는 자기 폴더만
  - 브라우저 클라이언트: 설정이 채워지면 로그인 막대가 나타나고 `vendor/supabase.js`가 로드된다. 없는 계정 로그인은 서버가 `Invalid login credentials`로 거절한다 (`tests/auth.live.test.html`)
- **미해결: REST API가 503** (`PGRST002 Could not query the database for the schema cache`). Auth와 Storage는 정상이다. DB 쪽은 모두 정상이다(같은 쿼리를 `authenticator` 역할로 직접 실행하면 0.1초 안에 성공, 잠금·연결 한도 문제 없음, 스키마 재로드 알림과 PostgREST 연결 강제 종료도 시도). PostgREST 컨테이너 쪽 문제로 보이며 **대시보드에서 프로젝트를 Restart(Project Settings > General > Restart project)** 하거나 Supabase 지원에 문의해야 한다. 이게 풀려야 `tests/auth.live.test.html`의 마지막 항목(museums 조회)이 통과하고 단계 4로 갈 수 있다
- 남은 일
  1. 대시보드에서 프로젝트 재시작 후 `tests/auth.live.test.html`이 `ALL PASS`인지 확인 (아래 실행법)
  2. Authentication > URL Configuration에 `http://localhost:8000`과 배포 주소(`https://eskimhub.github.io/pixel_museum/`) 등록. 개발 중 확인 메일을 생략하려면 Email provider의 "Confirm email"을 끌 수 있다 (지금은 켜져 있어 가입 후 메일 확인이 필요하다. 또한 `example.com` 같은 도메인은 서버가 거절한다)
  3. 사람이 Safari에서 실제 가입 -> 확인 메일 -> 로그인 -> 로그아웃을 한 번 해보기
  4. 가입한 사용자의 미술관을 읽어 화면에 연결하는 작업은 단계 4(업로드)와 함께 한다
- 실제 서버 테스트 실행법: 헤드리스 `--virtual-time-budget`은 네트워크 응답을 기다려주지 않는다. 원격 디버깅 포트로 띄워 `#result`에 `RESULT`가 나올 때까지 폴링해야 한다 (이번 세션의 임시 스크립트는 저장소에 넣지 않았다)

## 단계 4 현황 (업로드)

- 흐름: 로그인 -> 내 미술관·작품 읽기(`js/data/museumApi.js`) -> 빈 자리에서 E -> 패널의 "작품 올리기" -> 이미지 선택·제목·설명 -> 긴 변 256px PNG로 축소(`js/data/imageResize.js`) -> Storage 업로드 -> `artworks` 행 저장 -> 액자에 즉시 표시. 행 저장이 실패하면 올린 파일을 지운다
- 로그아웃 상태에서는 데모 작품(코드로 그린 6점)이 보이고, 로그인하면 내 미술관의 작품으로 바뀐다. 올리기 버튼은 내 미술관의 빈 자리에서만 나타난다
- 파일 경로는 `<내 user id>/<슬롯>-<시간>.png` (같은 경로를 다시 쓰지 않아 CDN 캐시 영향이 없다. Supabase는 지운 직후에도 공개 URL이 잠시 응답할 수 있다)
- 테스트 (모두 통과)
  - `tests/museumApi.test.html` 36개: 입력 검증, 조회 질의, 업로드 순서, 실패 시 정리, 오류 메시지, 이미지 축소 (모의 클라이언트, WebGL 불필요)
  - `tests/upload.test.html` 17개: 화면 흐름 (버튼 표시 조건, 폼 안 키 입력이 게임으로 새지 않음, 검증 오류, 서버 오류, 성공 후 액자·패널 갱신) (모의 서버, WebGL 필요). 스크린샷은 `?shot=1`
  - 실제 Storage API를 직접 호출해 검사(임시 계정, 끝에 삭제): 자기 폴더 업로드, 공개 읽기, CORS `*`, 남의 폴더·gif·5MB 초과·덮어쓰기 거절, 내 폴더만 목록 조회, 내 파일 삭제
- 검사 중 발견해 고친 것: Storage의 삭제는 대상 행을 먼저 조회하므로 `select` 정책이 없으면 자기 파일도 못 지웠다. `schema.sql`에 "자기 폴더 select" 정책을 추가하고 실제 DB에 다시 적용했다(멱등)
- **미검증:** REST API(PostgREST)가 계속 503이라 `museums`/`artworks` 테이블을 브라우저에서 읽고 쓰는 실제 end-to-end는 확인하지 못했다. 같은 질의를 DB에서 직접 실행한 RLS 검사(18개)와 모의 서버 테스트로만 확인했다. 재시작 후 `tests/auth.live.test.html`이 통과하면 사람이 Safari에서 가입 -> 업로드 -> 새로고침을 한 번 확인해야 한다
- 가입 메일이 시간당 발송 한도에 걸릴 수 있다(검사 중 `over_email_send_rate_limit`). 기본 메일 서비스는 한도가 매우 낮다

## 추가 요청 4건 (게스트 업로드 / 펭귄 / 모바일 / 방명록)

1. **게스트 업로드** (`js/data/guest.js`): 로그인 없이도 빈 자리에서 "작품 올리기"를 누르면 자동으로 게스트 입장한다. 순서는 (1) 익명 로그인 `signInAnonymously` -> (2) 꺼져 있으면 가상 ID/비밀번호 계정 자동 가입(`guest-<랜덤>@pixelmuseum.app`, 자격 증명은 이 브라우저 localStorage `pixelMuseum.guest`에 저장해 같은 미술관으로 다시 들어옴) -> (3) 그것도 막히면 대시보드에서 바꿀 설정을 화면에 안내. 가입 트리거가 게스트에게도 미술관을 만들어 주므로 기존 RLS가 그대로 적용된다
   - **실서버 현재 상태(확인함):** 익명 로그인 꺼짐(`anonymous_provider_disabled`), 가입 메일 한도 초과(`over_email_send_rate_limit`), "Confirm email" 켜짐. 그래서 지금은 (3)번 안내가 나온다. **사용자가 대시보드에서 둘 중 하나를 해야 한다:** Authentication > Sign In / Providers > "Allow anonymous sign-ins" 켜기(권장), 또는 Email 공급자의 "Confirm email" 끄기
2. **못생긴 펭귄** (`js/game/sprites.js`): 짝짝이 눈, 삐뚤어진 부리, 삐죽 솟은 털, 크기가 다른 발, 한쪽만 처진 날개. 4방향 x 3프레임, 발 기준점·그림자는 그대로
3. **모바일 조작** (`js/ui/touch.js`, `js/game/Input.js`): 터치 기기(`pointer: coarse`)에서 왼쪽 아래 조이스틱(데드존 20%, 당긴 정도에 비례한 속도, 최대 속도는 키보드와 같음)과 오른쪽 아래 "보기" 버튼, 패널의 "닫기" 버튼이 나타난다. 안내 문구도 "보기 버튼"으로 바뀐다. 좁은 화면에서는 상단 안내와 로그인 막대가 겹치지 않게 배치했다. **실기기(아이폰/안드로이드) 터치는 확인하지 못했다.** 합성 포인터 이벤트와 390px 폭 스크린샷으로만 확인했다
4. **방명록** (`supabase/schema.sql` 6), `js/data/guestbookApi.js`, `js/ui/guestbook.js`): 오른쪽 위 "방명록" 버튼 -> 창에서 목록 보기와 한 줄 남기기(이름 20자, 메시지 200자). 읽기는 공개 미술관(또는 내 것), 쓰기는 로그인한 누구나(게스트 포함, 남의 id로는 불가), 삭제는 쓴 사람 또는 미술관 주인, 수정 불가. 표시는 `textContent`만 사용
   - 테이블은 실제 DB에 적용했고 RLS 22개를 롤백되는 트랜잭션에서 검증했다(익명 사용자 포함). 브라우저에서 REST로 읽고 쓰는 것은 **REST 503 때문에 미검증**
   - 방명록은 전시 중인 미술관(`museums.owner_id`)을 기준으로 주인이 삭제 버튼을 본다. 입장 전에도 읽을 수 있다(`getView`)
- **공유 미술관 모드 (2026-11-08):** `js/config.js`의 `museumId`가 있으면 사이트에 들어온 모든 사람에게 그 미술관을 보여 준다(데모 작품 없음). 올리기·바꾸기·내리기는 그 미술관의 주인 계정만 한다. 방문자는 관람과 방명록 읽기, 게스트로 입장하면 방명록 쓰기까지. 주인 계정은 메일 발송 한도 때문에 DB에서 `email_confirmed_at`을 직접 채워 인증했다. `museumId`를 비우면 예전처럼 각자 자기 미술관을 보고 게스트도 올릴 수 있다. 테스트: `tests/shared.test.html`(방문자·다른 게스트·주인), `tests/manage.test.html`(바꾸기·내리기). `interact`·`upload` 테스트는 `museumId`를 비워 데모 모드로 돌린다
- **실서버 확인 완료 (2026-11-08):** 대시보드에서 "Allow anonymous sign-ins"를 켜고 프로젝트를 재시작하자 REST 503이 풀렸다. 익명 로그인 -> 미술관 자동 생성 -> 이미지 업로드 -> 작품 저장·재조회 -> 공개 URL -> 방명록 쓰기·읽기 -> 남의 미술관 작품 올리기 차단까지 실서버 API로 11개 모두 통과했다. 브라우저에서 사람이 하는 확인은 아래 점검만 남았다
- 실서버 확인용 사람 점검(대시보드 설정 후): Safari에서 접속 -> 빈 액자에서 E -> "작품 올리기" -> 이미지·제목 입력 -> 올리기 -> 새로고침해도 유지, "방명록"에서 글 남기기

## 알려진 한계와 남은 차이 (참고 이미지 대비)

- 전시 방식: 참고 이미지 1번은 카펫 위에 흰 전시대 여러 개를 놓는 구성인데, 지금은 벽 액자 + 중앙 단상 구성이다
- 벽 바깥의 어두운 영역이 넓게 보인다 (카메라가 높고 넓게 비춰서). 취향 문제라 보류
- 실제 키보드 조작감과 패널 표시는 사람이 Safari에서 직접 확인하지 못했다 (자동 테스트는 키 이벤트를 흉내 내고, 시각 확인은 헤드리스 Chrome 스크린샷)
- 헤드리스 서버가 세션에 묶여 있어 새 세션에서는 서버를 다시 띄워야 한다

## Git / 인증

- 원격: `origin` = https://github.com/eskimhub/pixel_museum.git, 브랜치 `main`. **push 완료**, GitHub Pages로 공개 중
- Git 사용자: `eskimhub` / `dmstjd914@gmail.com`
- Homebrew는 `~/homebrew`에 설치됨 (Intel Mac은 비공식 지원이라 대부분 소스 빌드)

## 다음 세션 시작 순서

1. 이 파일의 맨 위 "현재 상태 (2026-11-10)"와 "아직 못 한 것"을 읽는다
2. https://eskimhub.github.io/pixel_museum/ 가 열리는지(200) 확인한다
3. 사용자에게 어디서부터 이어갈지 묻는다: 주인 계정 실확인 결과, 휴대폰 확인 결과, Blender 방향(이미지 정리 / `.glb` 도입 / 접기), 디자인 다듬기, 공개 미술관 목록 화면
4. 코드를 바꿨다면 테스트(`shared`, `manage`, `upload`, `interact`, `guestbook`, `museumApi`, `guest`, `auth`, `movement`, `collision`)를 돌리고 push한다. `main`에 push하면 사이트에 바로 반영된다
