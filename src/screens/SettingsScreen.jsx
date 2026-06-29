import { SUPPORTED_LOCALES } from '../constants/locale.js';

/*
 * SettingsScreen — 환경 설정 / Settings.
 *
 * The smallest honest settings shell. Its one working control is the language
 * toggle, which writes the chosen locale through App's handleSetLocale (normalized,
 * no-network, persisted in the same localStorage bundle as every other slice —
 * src/utils/storage.js). ko is the product default and stays the default.
 *
 * HONESTY NOTE (prime directive): this screen claims nothing it does not do.
 *   - There is NO account, NO cloud sync, NO login, NO server — the copy says so
 *     plainly and the toggle only touches local state.
 *   - Translation coverage is partial and the copy is honest about it: switching to
 *     English re-renders THIS screen's own strings, and the note states that other
 *     screens are still shown in Korean. It never claims the whole app is translated.
 * No stage vocabulary (준비 중 / 프로토타입 / MVP) — the toggle genuinely works, so it
 * carries no placeholder label.
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
    back: '홈으로 돌아가기',
  },
  en: {
    greeting: 'Make the app yours',
    title: 'Settings',
    languageLabel: 'Language',
    languageGroup: 'Choose language',
    localNote: 'Your language choice is saved on this device only. There is no account or cloud.',
    coverageNote: 'For now, only this settings screen is shown in English. Other screens are still in Korean.',
    back: 'Back to home',
  },
};

export default function SettingsScreen({ onNavigate, locale = 'ko', onSetLocale }) {
  // Fall back to the Korean copy for any unexpected value — the screen never renders
  // a half-empty shell even if locale somehow arrives unnormalized.
  const t = STRINGS[locale] ?? STRINGS.ko;

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">{t.greeting}</p>
          <h1 className="screen-title">{t.title}</h1>
        </div>
      </header>

      <section className="card">
        <span className="card-label">{t.languageLabel}</span>
        <div className="chip-grid" role="group" aria-label={t.languageGroup}>
          {SUPPORTED_LOCALES.map((code) => {
            const selected = locale === code;
            return (
              <button
                key={code}
                type="button"
                className="chip"
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
        <p className="hairline-note text-quiet">{t.localNote}</p>
        <p className="hairline-note text-quiet">{t.coverageNote}</p>
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
