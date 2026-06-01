import { PROTOTYPE_SIGNALS } from './signals.js';

const list = document.getElementById('signal-list');

if (list) {
  if (!PROTOTYPE_SIGNALS.length) {
    const li = document.createElement('li');
    li.textContent = '아직 정해둔 신호가 없어요.';
    list.appendChild(li);
  }
  for (const signal of PROTOTYPE_SIGNALS) {
    const li = document.createElement('li');

    const kind = document.createElement('span');
    kind.className = 'kind';
    kind.textContent = signal.kind;

    const label = document.createElement('span');
    label.textContent = signal.label;

    const token = document.createElement('code');
    token.textContent = signal.token;

    li.append(kind, label, token);
    list.appendChild(li);
  }
}
