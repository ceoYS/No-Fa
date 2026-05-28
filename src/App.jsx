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

export default function App() {
  const [screenId, setScreenId] = useState('home');
  const current = SCREENS.find((s) => s.id === screenId) ?? SCREENS[0];
  const Screen = current.Component;

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
          <Screen onNavigate={setScreenId} />
        </main>
        <BottomNav value={screenId} onChange={setScreenId} />
      </div>
    </div>
  );
}
