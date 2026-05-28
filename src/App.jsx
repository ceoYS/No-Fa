import { useState } from 'react';
import HomeScreen from './screens/HomeScreen.jsx';
import CheckinScreen from './screens/CheckinScreen.jsx';
import UrgeScreen from './screens/UrgeScreen.jsx';
import CalendarScreen from './screens/CalendarScreen.jsx';
import RecoveryScreen from './screens/RecoveryScreen.jsx';
import PetRewardScreen from './screens/PetRewardScreen.jsx';
import DisciplineScreen from './screens/DisciplineScreen.jsx';
import BottomNav from './components/BottomNav.jsx';
import ScreenSwitcher from './components/ScreenSwitcher.jsx';

const SCREENS = [
  { id: 'home', label: '홈', Component: HomeScreen },
  { id: 'checkin', label: '체크인', Component: CheckinScreen },
  { id: 'urge', label: '잠깐 멈춤', Component: UrgeScreen },
  { id: 'discipline', label: '나의 규율', Component: DisciplineScreen },
  { id: 'calendar', label: '최근 기록', Component: CalendarScreen },
  { id: 'recovery', label: '회복', Component: RecoveryScreen },
  { id: 'reward', label: '오늘의 보상', Component: PetRewardScreen },
];

// Discipline rules — P0.1 prototype state lifted to App so Home summary stays
// in sync after add/delete. Production persistence (storage, sync, templates)
// remains P1 (PRD §0.5.9). In-memory only; no backend, no localStorage.
const INITIAL_RULES = [
  {
    id: 'night_phone',
    label: '밤 11시 이후 침대에서 휴대폰 보지 않기',
    category: '밤 시간',
    status: '지키는 중',
    note: '오늘 밤 기준 아직 잘 지키고 있어요',
  },
  {
    id: 'pause_first',
    label: '충동이 오면 5분 멈춤 먼저 누르기',
    category: '충동',
    status: '이번 주 실천',
    note: '이번 주 4회 사용',
  },
  {
    id: 'no_stim_search',
    label: '자극 검색하지 않기',
    category: '검색',
    status: '지키는 중',
    note: '보호 모드가 함께 돕고 있어요',
  },
  {
    id: 'short_form',
    label: 'SNS/숏폼은 하루 15분까지만',
    category: 'SNS/숏폼',
    status: '오늘 확인 필요',
    note: '오늘 17분 — 잠깐 멈춰볼까요?',
  },
  {
    id: 'phone_off_desk',
    label: '잠들기 전 휴대폰은 책상 위에 두기',
    category: '수면',
    status: '지키는 중',
    note: '어제도 책상 위에 뒀어요',
  },
  {
    id: 'lonely_swap',
    label: '외로울 때 바로 검색하지 않고 대체 행동 1개 하기',
    category: '충동',
    status: '이번 주 실천',
    note: '이번 주 2회 대체 행동 선택',
  },
];

export default function App() {
  const [screenId, setScreenId] = useState('home');
  const [rules, setRules] = useState(INITIAL_RULES);

  const current = SCREENS.find((s) => s.id === screenId) ?? SCREENS[0];
  const Screen = current.Component;

  const addRule = ({ label, category }) => {
    if (!label.trim()) return;
    const id = `rule_${Date.now()}`;
    setRules((prev) => [
      ...prev,
      {
        id,
        label: label.trim(),
        category: category ?? null,
        status: '오늘 확인 필요',
        note: '새 규율 — 오늘 확인 필요',
      },
    ]);
  };

  const deleteRule = (id) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="app-shell">
      <ScreenSwitcher screens={SCREENS} value={screenId} onChange={setScreenId} />
      <div className="device-frame">
        <div className="device-status-bar">
          <span>9:41</span>
          <span className="device-notch" />
          <span>● ● ●</span>
        </div>
        <main className="device-viewport" key={screenId}>
          <Screen
            onNavigate={setScreenId}
            rules={rules}
            onAddRule={addRule}
            onDeleteRule={deleteRule}
          />
        </main>
        <BottomNav value={screenId} onChange={setScreenId} />
      </div>
    </div>
  );
}
