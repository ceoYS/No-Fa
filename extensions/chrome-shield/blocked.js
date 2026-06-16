/*
 * blocked.js — NoF 멈춤 페이지의 로컬 5분 타이머. 외부 이동·네트워크 없음.
 * 방문하려던 대상(주소/검색어)은 일부러 읽지도 보여주지도 않는다.
 */
const PAUSE_SECONDS = 5 * 60;

const startBtn = document.getElementById('pause');
const timerWrap = document.getElementById('timer-wrap');
const timerEl = document.getElementById('timer');
const doneEl = document.getElementById('done');
const closeBtn = document.getElementById('close');

/*
 * RC-10 — honest return path into the NoF web app. After this local pause the user can
 * continue into the app's 잠깐 멈춤 (to=urge) or 오늘 기록 (to=record). The deep link carries
 * ONLY from=shield + a coarse destination — never the blocked target (we never read, store,
 * or send the address/search the user was headed to). Default target is the production app;
 * a localStorage override (set only by the extension smoke against a local preview) lets the
 * handoff be verified end-to-end. These are user-clicked navigations, not network calls —
 * no fetch, no remote code.
 */
const APP_BASE_DEFAULT = 'https://nof-mauve.vercel.app';
const APP_BASE_OVERRIDE_KEY = 'nof.shieldAppBase';

function appBase() {
  try {
    const override = localStorage.getItem(APP_BASE_OVERRIDE_KEY);
    if (override && override.trim()) return override.trim().replace(/\/+$/, '');
  } catch {
    /* localStorage unavailable — fall back to the default app target */
  }
  return APP_BASE_DEFAULT;
}
function appDeepLink(to) {
  return `${appBase()}/?from=shield&to=${to}`;
}

const goRecord = document.getElementById('go-record');
const goUrge = document.getElementById('go-urge');
if (goRecord) goRecord.href = appDeepLink('record');
if (goUrge) goUrge.href = appDeepLink('urge');

let remaining = PAUSE_SECONDS;
let handle = null;

function format(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function tick() {
  remaining -= 1;
  if (remaining <= 0) {
    clearInterval(handle);
    handle = null;
    timerEl.textContent = '00:00';
    doneEl.hidden = false;
    return;
  }
  timerEl.textContent = format(remaining);
}

startBtn.addEventListener('click', () => {
  if (handle) return;
  remaining = PAUSE_SECONDS;
  timerEl.textContent = format(remaining);
  timerWrap.hidden = false;
  doneEl.hidden = true;
  startBtn.hidden = true;
  handle = setInterval(tick, 1000);
});

closeBtn.addEventListener('click', () => window.close());
