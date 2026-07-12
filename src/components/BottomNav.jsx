// Persistent bottom navigation — v13 Final Handoff nav() structure:
// 홈 · 캘린더 · 기록 · 미래일기 · 내 방, each item a rounded-square indicator
// (.bottom-nav-nd) above a small label; the active item fills ink. 잠깐 멈춤
// stays one tap away via the Home hero CTA (and every screen's existing
// routes) — the v13 nav carries surfaces, not the panic action.
const TABS = [
  { id: 'home', label: '홈' },
  { id: 'calendar', label: '캘린더' },
  { id: 'checkin', label: '기록' },
  { id: 'diary', label: '미래일기' },
  { id: 'reward', label: '내 방' },
];

export default function BottomNav({ value, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="primary">
      {TABS.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            data-active={active}
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(t.id)}
          >
            <span className="bottom-nav-nd" aria-hidden="true" />
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
