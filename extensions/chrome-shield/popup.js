import { TEST_SIGNAL } from './signals.js';

const signalEl = document.getElementById('test-signal');
if (signalEl) signalEl.textContent = TEST_SIGNAL;

const optionsBtn = document.getElementById('open-options');
if (optionsBtn) {
  optionsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
}
