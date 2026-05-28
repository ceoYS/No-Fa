export default function ScreenSwitcher({ screens, value, onChange }) {
  return (
    <aside className="switcher">
      <div className="switcher-title">NoF · P0 prototype</div>
      {screens.map((s) => (
        <button
          key={s.id}
          type="button"
          data-active={s.id === value}
          onClick={() => onChange(s.id)}
        >
          {s.label}
        </button>
      ))}
      <p className="switcher-note">
        시각 탐색 전용 프로토타입.
        <br />최종 색·UI 확정 아님.
        <br />Ink &amp; Ember 방향 검증용.
      </p>
    </aside>
  );
}
