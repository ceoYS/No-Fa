import { SUPPORTED_LOCALES } from '../constants/locale.js';

/*
 * SettingsScreen — 환경 설정 / Settings.
 *
 * P0 app shell layout grammar: iOS-style grouped settings rows with a segmented
 * language control. The grammar (grouped rows, trailing control, group footer,
 * chevron navigation rows) is benchmark-informed; every visual value stays on the
 * NoF Ink & Ember tokens.
 *
 * Its one working control is the language toggle, which writes the chosen locale
 * through App's handleSetLocale (normalized, no-network, persisted in the same
 * localStorage bundle as every other slice — src/utils/storage.js). ko is the
 * product default and stays the default.
 *
 * HONESTY NOTE (prime directive): this screen claims nothing it does not do.
 *   - There is NO account, NO cloud sync, NO login, NO server — the copy says so
 *     plainly and the toggle only touches local state.
 *   - Translation coverage is partial and the copy is honest about it: switching to
 *     English re-renders THIS screen's own strings, and the note states that other
 *     screens are still shown in Korean. It never claims the whole app is translated.
 *   - The shortcut rows navigate to screens that really exist; the blocking row
 *     keeps its 준비 중 label because the in-app planner does not enforce anything.
 */

// Native language names, recognizable regardless of the current locale. Driven off
// SUPPORTED_LOCALES so the toggle always mirrors the locale primitive exactly.
const LOCALE_NAMES = { ko: '한국어', en: 'English' };

// This screen's own copy, per locale. Deliberately small and self-contained — this
// is the settings shell's honest, supported string set, NOT an app-wide i18n layer.
const STRINGS = {
  ko: {
    greeting: '앱을 내게 맞게',
    title: '설정',
    languageLabel: '언어',
    languageGroup: '언어 선택',
    localNote: '언어 설정은 이 기기에만 저장돼요. 계정이나 클라우드는 없어요.',
    coverageNote: '지금은 설정 화면만 영어로 보여요. 다른 화면은 아직 한국어로 표시돼요.',
    shortcutsLabel: '바로가기',
    protectionRow: '보호 설정',
    shieldRow: '차단 설정 (준비 중)',
    back: '홈으로 돌아가기',
  },
  en: {
    greeting: 'Make the app yours',
    title: 'Settings',
    languageLabel: 'Language',
    languageGroup: 'Choose language',
    localNote: 'Your language choice is saved on this device only. There is no account or cloud.',
    coverageNote: 'For now, only this settings screen is shown in English. Other screens are still in Korean.',
    shortcutsLabel: 'Shortcuts',
    protectionRow: 'Protection plan',
    shieldRow: 'Blocking setup (not ready yet)',
    back: 'Back to home',
  },
};

export default function SettingsScreen({ onNavigate, locale = 'ko', onSetLocale }) {
  // Fall back to the Korean copy for any unexpected value — the screen never renders
  // a half-empty shell even if locale somehow arrives unnormalized.
  const t = STRINGS[locale] ?? STRINGS.ko;

  return (
    <div className="screen">
      {/* v13 settings (screen 72): plain app-bar title, grouped white row cards.
          No plan/Pro/subscription rows — the repo ships no paywall (guard-pinned). */}
      <div className="v13-appbar">
        <h1 className="v13-appbar-title">{t.title}</h1>
      </div>

      <section className="settings-block" aria-label={t.languageGroup}>
        <div className="settings-group">
          <div className="settings-row">
            <span className="settings-row-label">{t.languageLabel}</span>
            <div className="segmented" role="group" aria-label={t.languageGroup}>
              {SUPPORTED_LOCALES.map((code) => {
                const selected = locale === code;
                return (
                  <button
                    key={code}
                    type="button"
                    className="segmented-btn"
                    lang={code}
                    data-selected={selected}
                    aria-pressed={selected}
                    onClick={() => onSetLocale?.(code)}
                  >
                    {LOCALE_NAMES[code] ?? code}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="settings-group-footer">
          <p className="hairline-note text-quiet">{t.localNote}</p>
          <p className="hairline-note text-quiet">{t.coverageNote}</p>
        </div>
      </section>

      <section className="settings-block" aria-label={t.shortcutsLabel}>
        <span className="settings-group-title">{t.shortcutsLabel}</span>
        <div className="settings-group">
          <button
            type="button"
            className="settings-row"
            onClick={() => onNavigate?.('protection')}
          >
            <span className="settings-row-label">{t.protectionRow}</span>
            <ChevronIcon />
          </button>
          <button
            type="button"
            className="settings-row"
            onClick={() => onNavigate?.('shield')}
          >
            <span className="settings-row-label">{t.shieldRow}</span>
            <ChevronIcon />
          </button>
        </div>
      </section>

      <button
        type="button"
        className="btn btn-ghost btn-block"
        onClick={() => onNavigate?.('home')}
      >
        {t.back}
      </button>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="settings-row-chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}
