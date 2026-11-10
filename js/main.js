import * as THREE from '../vendor/three.module.js';
import { CONFIG } from './config.js';
import { PLAYER, COLLIDERS, BOUNDS, SLOTS, nearestSlot } from './game/layout.js';
import { moveWithCollision } from './game/collision.js';
import { buildMuseum, buildLights } from './game/MuseumScene.js';
import { buildFrames } from './game/frames.js';
import { sampleArtworks } from './game/artworks.js';
import { loadGlbMuseum } from './game/glbMuseum.js';
import { RoomEnvironment } from '../vendor/three-addons/RoomEnvironment.js';
import { Player } from './game/Player.js';
import { Input } from './game/Input.js';
import { openPanel, closePanel, isPanelOpen, showPrompt } from './ui/panel.js';
import { initAuthUi, isAuthOpen } from './ui/auth.js';
import { initUpload, prepareUpload, resetUpload } from './ui/upload.js';
import { initTouch } from './ui/touch.js';
import { initGuestbook, isGuestbookOpen } from './ui/guestbook.js';
import { getClient } from './supabaseClient.js';
import { loadMyMuseum, loadMuseumById, loadArtworks, describeError } from './data/museumApi.js';
import { ensureGuest, guestHelp } from './data/guest.js';
import { isSupabaseConfigured } from './supabaseClient.js';

const canvas = document.getElementById('game');
const status = document.getElementById('hud-status');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
} catch (e) {
  status.textContent = 'WebGL을 사용할 수 없습니다. 브라우저 설정에서 "하드웨어 가속 사용"을 켜고 다시 열어주세요.';
  status.className = 'hud-error';
  throw e;
}
renderer.setPixelRatio(1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b1015);
const codeMuseum = buildMuseum();
scene.add(codeMuseum);
scene.add(buildLights());

// 전시 작품: 로그아웃 상태에서는 데모 작품, 로그인하면 내 미술관의 작품(Supabase)을 보여준다.
// CONFIG.museumId가 있으면 모두에게 그 미술관을 보여 주고(데모 작품 없음), 올리기는 그 미술관의 주인만 한다.
const demoArtworks = sampleArtworks();
const artworks = {};
const { root: frameRoot, frames } = buildFrames();
scene.add(frameRoot);

/** 지금 전시할 작품 묶음으로 교체하고 액자 그림을 다시 입힌다 */
function showArtworks(map) {
  for (const k of Object.keys(artworks)) delete artworks[k];
  Object.assign(artworks, map);
  for (const [id, frame] of Object.entries(frames)) frame.setArtwork(artworks[id] ?? null);
}
showArtworks(CONFIG.museumId ? {} : demoArtworks);

/**
 * Blender 모델(CONFIG.museumModel)을 불러와 코드로 만든 방과 액자를 바꿔 끼운다.
 * 불러오기에 실패하면 코드로 만든 방을 그대로 쓴다. 모델의 `picture_<id>` 메시가 같은 `frames[id]` 자리를 이어받는다.
 */
async function useBlenderModel(url) {
  try {
    const model = await loadGlbMuseum(url);
    scene.remove(codeMuseum, frameRoot);
    scene.add(model.root);
    // 모델의 PBR 재질(크롬 기둥 등)이 반사할 환경광. 없으면 금속이 검게 보인다.
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.6;
    for (const k of Object.keys(frames)) delete frames[k];
    Object.assign(frames, model.frames);
    showArtworks({ ...artworks });
    renderer.render(scene, camera);
  } catch (e) {
    console.warn('Blender 모델을 불러오지 못해 코드로 만든 방을 씁니다', e);
  }
}

// 로그인한 내 미술관 연결 정보. 없으면(로그아웃·불러오기 실패) 올리기 버튼이 나타나지 않는다.
let connection = null; // { client, museum, userId }
// museumId 모드에서 로그인 전에도 읽을 수 있는 전시 중인 미술관. 방명록을 읽는 데 쓴다.
let view = null; // { client, museum }

/** 지금 이 사람이 작품을 올릴 수 있나: museumId 모드면 그 미술관의 주인만, 아니면 누구나(게스트 포함) */
function canUpload() {
  if (CONFIG.museumId) return Boolean(connection) && connection.userId === connection.museum.owner_id;
  return Boolean(connection) || isSupabaseConfigured();
}

/** 이미 걸린 작품을 바꾸거나 내릴 수 있나: 지금 연결된 미술관의 주인만 */
function canManage() {
  return Boolean(connection) && connection.userId === connection.museum.owner_id;
}

const player = new Player(PLAYER.spawn);
scene.add(player.group);

const input = new Input();
const touchMode = initTouch(input);
const ACT_KEY = touchMode ? '보기 버튼' : 'E / Space';

// 3인칭 추적 카메라: 캐릭터의 뒤쪽 위에서 내려다본다. 방향은 고정이고 위치만 따라간다.
const CAM_OFFSET = { y: 10.5, z: 5.5 };
const LOOK_AHEAD = 2.5; // 캐릭터보다 조금 앞(북쪽)을 바라봐서 전시 공간이 더 보이게 한다
const CAM_MARGIN = 0.6; // 남쪽(뒤) 벽 안쪽에 머물러 벽이 시야를 가리지 않는다
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);

function cameraTarget() {
  return {
    x: player.pos.x,
    z: Math.min(player.pos.z + CAM_OFFSET.z, BOUNDS.maxZ - CAM_MARGIN),
  };
}

function snapCamera() {
  const t = cameraTarget();
  camera.position.set(t.x, CAM_OFFSET.y, t.z);
  camera.lookAt(player.pos.x, 0.8, player.pos.z - LOOK_AHEAD);
}
snapCamera();

function resize() {
  const w = Math.max(1, Math.floor(window.innerWidth / CONFIG.pixelScale));
  const h = Math.max(1, Math.floor(window.innerHeight / CONFIG.pixelScale));
  // 세 번째 인자 false: CSS 크기는 건드리지 않고 내부 해상도만 낮춘다
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

let nearSlot = null;

/** 슬롯 상세 패널을 연다. 내 미술관의 빈 자리면 올리기 버튼을 함께 보여준다 */
function showSlot(slot) {
  const art = artworks[slot.id];
  openPanel(slot, art, !canUpload() ? undefined
    : CONFIG.museumId ? '이 자리에 작품을 올려 보세요.'
    : '이 자리에 작품을 올려 보세요. 로그인하지 않아도 게스트로 바로 올릴 수 있습니다.');
  prepareUpload(slot, art);
}

function update(dt) {
  // 로그인 창이 열려 있으면 게임 입력을 모두 무시한다(입력창에서 친 글자가 이동으로 새지 않게)
  if (isAuthOpen() || isGuestbookOpen()) {
    input.down.clear();
    input.pressed.clear();
    player.animate(dt, 0, 0, false);
    return;
  }

  // 상세 패널이 열려 있으면 닫기 입력만 받고 캐릭터는 움직이지 않는다
  if (isPanelOpen()) {
    if (input.consume('close')) { closePanel(); resetUpload(); }
    input.pressed.clear();
    player.animate(dt, 0, 0, false);
    return;
  }

  const dir = input.axis();
  const dx = dir.x * PLAYER.speed * dt;
  const dz = dir.z * PLAYER.speed * dt;
  const next = moveWithCollision(player.pos, dx, dz, PLAYER.radius, COLLIDERS, BOUNDS);
  const moved = Math.abs(next.x - player.pos.x) + Math.abs(next.z - player.pos.z) > 1e-6;
  player.pos = next;
  player.animate(dt, dir.x, dir.z, moved);

  // 근처 작품 안내 + 상호작용
  nearSlot = nearestSlot(player.pos);
  const label = nearSlot ? (artworks[nearSlot.id] ? '작품 보기' : '빈 자리 보기') : null;
  showPrompt(label && `${ACT_KEY}: ${label}`);
  if (input.consume('interact') && nearSlot) showSlot(nearSlot);
  input.pressed.clear();

  // 카메라 부드럽게 따라가기
  const t = cameraTarget();
  const k = Math.min(1, dt * 6);
  camera.position.x += (t.x - camera.position.x) * k;
  camera.position.z += (t.z - camera.position.z) * k;
  camera.lookAt(player.pos.x, 0.8, player.pos.z - LOOK_AHEAD);
}

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  // 탭이 오래 멈췄다 돌아와도 한 번에 순간이동하지 않도록 dt를 제한한다
  update(Math.min(clock.getDelta(), 0.05));
  renderer.render(scene, camera);
});

status.textContent = touchMode ? '이동: 왼쪽 조이스틱 · 작품 보기: 보기 버튼' : '이동: 방향키 / WASD · 작품 보기: E / Space';

const DEFAULT_STATUS = status.textContent;
function setStatus(text, isError = false) {
  status.textContent = text;
  status.className = isError ? 'hud-error' : '';
}

// 로그인 상태가 바뀌면 내 미술관을 읽어 전시를 바꾼다. 오래 걸리는 요청이 겹쳐도 마지막 요청만 반영한다.
let sessionSeq = 0;
let loadedFor; // 처음에는 undefined: 로그아웃 상태(null)의 첫 알림도 한 번은 불러오기를 시작해야 한다
let loading = Promise.resolve();
function onSession(session) {
  const userId = session?.user?.id ?? null;
  if (userId === loadedFor) return loading; // 토큰 갱신·중복 알림은 무시(진행 중인 불러오기를 돌려준다)
  loading = loadSession(session);
  return loading;
}
async function loadSession(session) {
  const userId = session?.user?.id ?? null;
  const mine = ++sessionSeq;
  loadedFor = userId;
  connection = null;
  view = null;
  if (CONFIG.museumId) return loadSharedMuseum(userId, mine);
  if (!userId) {
    resetUpload();
    showArtworks(demoArtworks);
    setStatus(DEFAULT_STATUS);
    return;
  }
  showArtworks({});
  setStatus('내 미술관을 불러오는 중...');
  try {
    const client = await getClient();
    const museum = await loadMyMuseum(client, userId);
    if (!museum) {
      // 서버에서 계정이 지워졌는데 브라우저에 세션만 남은 경우: 낡은 세션을 버리면 다음 게스트 입장이 새로 시작된다
      const { error: userError } = await client.auth.getUser();
      if (userError) {
        await client.auth.signOut({ scope: 'local' });
        return;
      }
      throw new Error('내 미술관을 찾지 못했습니다. 잠시 뒤 다시 로그인해 주세요.');
    }
    const mine_ = await loadArtworks(client, museum);
    if (mine !== sessionSeq) return;
    connection = { client, museum, userId };
    showArtworks(mine_);
    setStatus(DEFAULT_STATUS);
  } catch (err) {
    if (mine !== sessionSeq) return;
    loadedFor = null; // 다시 로그인 상태 알림이 오면 재시도할 수 있게 한다
    console.error('미술관 불러오기 실패', err);
    setStatus(describeError(err), true);
  }
}

/** museumId 모드: 로그인 여부와 상관없이 정해진 미술관을 읽는다. 로그인했으면 그 미술관에 대한 연결(connection)도 만든다 */
async function loadSharedMuseum(userId, mine) {
  resetUpload();
  setStatus('미술관을 불러오는 중...');
  try {
    const client = await getClient();
    if (userId) {
      const { error: userError } = await client.auth.getUser();
      if (userError) { // 서버에서 계정이 지워진 낡은 세션: 버리면 로그아웃 상태로 다시 불러온다
        await client.auth.signOut({ scope: 'local' });
        return;
      }
    }
    const museum = await loadMuseumById(client, CONFIG.museumId);
    if (!museum) throw new Error('미술관을 찾지 못했습니다. 주소 설정(museumId)을 확인해 주세요.');
    const shown = await loadArtworks(client, museum);
    if (mine !== sessionSeq) return;
    view = { client, museum };
    if (userId) connection = { client, museum, userId };
    showArtworks(shown);
    setStatus(DEFAULT_STATUS);
  } catch (err) {
    if (mine !== sessionSeq) return;
    loadedFor = undefined; // 다시 알림이 오면 재시도할 수 있게 한다
    console.error('미술관 불러오기 실패', err);
    setStatus(describeError(err), true);
  }
}

document.getElementById('panel-close-btn')?.addEventListener('click', () => input.pressVirtual('close'));

/** 로그인 없이 올리려 할 때 호출된다: 게스트로 입장하고 내 미술관을 불러온 뒤 연결 정보를 돌려준다 */
async function enterAsGuest() {
  if (connection) return connection;
  const client = await getClient();
  if (!client) throw new Error('서버 설정이 없어 게스트로 입장할 수 없습니다.');
  const { session } = await ensureGuest(client);
  await onSession(session);
  if (!connection) throw new Error('내 미술관을 불러오지 못했습니다. 화면 위쪽 안내를 확인해 주세요.');
  return connection;
}

let guestEnter = enterAsGuest; // 테스트에서 교체할 수 있다

initUpload({
  getConnection: () => connection,
  canUpload,
  canManage,
  enterAsGuest: () => guestEnter(),
  guestHelp,
  isSlotEmpty: (id) => !artworks[id],
  onSlotTaken: (id) => showSlot(SLOTS.find((s) => s.id === id)),
  onUploaded(slotId, art) {
    artworks[slotId] = art;
    frames[slotId]?.setArtwork(art);
    showSlot(SLOTS.find((s) => s.id === slotId)); // 올린 작품을 패널에서 바로 보여준다
  },
  onRemoved(slotId) {
    delete artworks[slotId];
    frames[slotId]?.setArtwork(null);
    showSlot(SLOTS.find((s) => s.id === slotId)); // 비어 있는 자리로 바뀐 패널을 보여준다
  },
});

initGuestbook({
  getConnection: () => connection,
  getView: () => view,
  enterAsGuest: () => guestEnter(),
  guestHelp,
  getUserLabel: () => '',
});

// Supabase 설정이 있을 때만 로그인 UI가 나타난다(설정이 비어 있으면 아무 일도 하지 않는다)
initAuthUi(onSession).catch((e) => console.error('로그인 초기화 실패', e));
if (CONFIG.museumModel) useBlenderModel(CONFIG.museumModel);

// 자동 테스트용: 헤드리스 브라우저는 requestAnimationFrame이 돌지 않아 update를 직접 호출한다
window.__pm = {
  player, input, camera, update, render: () => renderer.render(scene, camera), artworks, frames,
  setConnection: (c) => { connection = c; }, // 테스트에서 모의 서버 연결을 주입한다
  setView: (v) => { view = v; },
  setGuestEnter: (fn) => { guestEnter = fn; }, // 테스트에서 게스트 입장을 대체한다
};
