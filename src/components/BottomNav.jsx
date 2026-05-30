const TABS = [
  { id: 'home', label: '홈', icon: HomeIcon },
  { id: 'calendar', label: '기록', icon: CalendarIcon },
  { id: 'checkin', label: '체크인', icon: CheckIcon },
  { id: 'recovery', label: '복기', icon: SparkIcon },
];

export default function BottomNav({ value, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="primary">
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            data-active={active}
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(t.id)}
          >
            <Icon className="bottom-nav-icon" active={active} />
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function HomeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1Z" />
    </svg>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  );
}

function SparkIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2.8 2.8M14.7 14.7l2.8 2.8M6.5 17.5l2.8-2.8M14.7 9.3l2.8-2.8" />
    </svg>
  );
}
