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
