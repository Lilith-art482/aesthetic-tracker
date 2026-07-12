import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarBlank,
  Wallet,
  Flower,
  Robot,
  Bell
} from '@phosphor-icons/react';
import type { Emotion, Tab } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import RobotAssistant from './components/RobotAssistant';
import Planner from './components/Planner';
import Finances from './components/Finances';
import Habits from './components/Habits';
import LofiPlayer from './components/LofiPlayer';
import Tutorial from './components/Tutorial';
import './App.css';

const WATER_INTERVALS = [
  { label: '30 мин', value: 30 },
  { label: '45 мин', value: 45 },
  { label: '60 мин', value: 60 },
];

const EYE_INTERVALS = [
  { label: '20 мин', value: 20 },
  { label: '30 мин', value: 30 },
  { label: '45 мин', value: 45 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('planner');
  const [robotEmotion, setRobotEmotion] = useState<Emotion>('neutral');
  const [showTutorial, setShowTutorial] = useLocalStorage('tutorial_done', true);
  const [waterInterval, setWaterInterval] = useLocalStorage<number | null>('water_interval', null);
  const [eyeInterval, setEyeInterval] = useLocalStorage<number | null>('eye_interval', null);
  const [waterTimer, setWaterTimer] = useState(0);
  const [eyeTimer, setEyeTimer] = useState(0);
  const [showWaterAlert, setShowWaterAlert] = useState(false);
  const [showEyeAlert, setShowEyeAlert] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ water: '', eye: '' });

  const updateTimers = useCallback(() => {
    if (waterInterval) {
      const elapsed = Math.floor((Date.now() - waterTimer) / 1000);
      const remaining = waterInterval * 60 - elapsed;
      if (remaining <= 0) {
        setShowWaterAlert(true);
        setRobotEmotion('thirsty');
        setWaterTimer(Date.now());
      } else {
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        setTimeLeft(prev => ({ ...prev, water: `${m}:${String(s).padStart(2, '0')}` }));
      }
    }
    if (eyeInterval) {
      const elapsed = Math.floor((Date.now() - eyeTimer) / 1000);
      const remaining = eyeInterval * 60 - elapsed;
      if (remaining <= 0) {
        setShowEyeAlert(true);
        setRobotEmotion('sleepy');
        setEyeTimer(Date.now());
      } else {
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        setTimeLeft(prev => ({ ...prev, eye: `${m}:${String(s).padStart(2, '0')}` }));
      }
    }
  }, [waterInterval, eyeInterval, waterTimer, eyeTimer]);

  useEffect(() => {
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [updateTimers]);

  const startWaterTimer = (minutes: number) => {
    setWaterInterval(minutes);
    setWaterTimer(Date.now());
    setShowWaterAlert(false);
    setRobotEmotion('neutral');
  };

  const startEyeTimer = (minutes: number) => {
    setEyeInterval(minutes);
    setEyeTimer(Date.now());
    setShowEyeAlert(false);
    setRobotEmotion('neutral');
  };

  const dismissWater = () => {
    setShowWaterAlert(false);
    setRobotEmotion('neutral');
    setWaterInterval(null);
  };

  const dismissEye = () => {
    setShowEyeAlert(false);
    setRobotEmotion('neutral');
    setEyeInterval(null);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setRobotEmotion('neutral');
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'planner', label: 'Планер', icon: <CalendarBlank size={22} weight="fill" /> },
    { id: 'finances', label: 'Финансы', icon: <Wallet size={22} weight="fill" /> },
    { id: 'habits', label: 'Привычки', icon: <Flower size={22} weight="fill" /> },
  ];

  return (
    <div className="app">
      <AnimatePresence>
        {showTutorial && (
          <Tutorial onFinish={() => setShowTutorial(false)} />
        )}
      </AnimatePresence>

      <div className="app-bg">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      <header className="app-header">
        <h1 className="app-logo">
          <Robot size={28} weight="fill" color="#CFBAE1" />
          Эстетичный трекер
        </h1>
        <div className="header-right">
          <LofiPlayer />
        </div>
      </header>

      <nav className="app-nav">
        {tabs.map(tab => (
          <motion.button
            key={tab.id}
            className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
            whileTap={{ scale: 0.95 }}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                className="nav-indicator"
                layoutId="nav-indicator"
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            )}
          </motion.button>
        ))}
      </nav>

      <main className="app-main">
        <div className="main-grid">
          <div className="content-area">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'planner' && <Planner />}
                {activeTab === 'finances' && <Finances />}
                {activeTab === 'habits' && <Habits />}
              </motion.div>
            </AnimatePresence>
          </div>

          <aside className="sidebar">
            <RobotAssistant
              emotion={robotEmotion}
              onEmotionChange={setRobotEmotion}
            />

            <div className="reminder-section">
              <h4 className="reminder-title">
                <Bell size={16} weight="fill" />
                Напоминания
              </h4>

              <div className="reminder-card">
                <div className="reminder-header">
                  <span>💧 Вода</span>
                  {waterInterval && (
                    <span className="reminder-time">{timeLeft.water}</span>
                  )}
                </div>
                {!waterInterval ? (
                  <div className="reminder-options">
                    {WATER_INTERVALS.map(int => (
                      <button
                        key={int.value}
                        className="reminder-btn"
                        onClick={() => startWaterTimer(int.value)}
                      >
                        {int.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button className="reminder-stop" onClick={dismissWater}>
                    Отключить
                  </button>
                )}
              </div>

              <div className="reminder-card">
                <div className="reminder-header">
                  <span>👁️ Разминка</span>
                  {eyeInterval && (
                    <span className="reminder-time">{timeLeft.eye}</span>
                  )}
                </div>
                {!eyeInterval ? (
                  <div className="reminder-options">
                    {EYE_INTERVALS.map(int => (
                      <button
                        key={int.value}
                        className="reminder-btn"
                        onClick={() => startEyeTimer(int.value)}
                      >
                        {int.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button className="reminder-stop" onClick={dismissEye}>
                    Отключить
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <AnimatePresence>
        {showWaterAlert && (
          <motion.div
            className="alert-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissWater}
          >
            <motion.div
              className="alert-card"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={e => e.stopPropagation()}
            >
              <span className="alert-icon">💧</span>
              <h3>Пора пить воду!</h3>
              <p>Не забывай увлажнять себя 💙</p>
              <div className="alert-actions">
                <button className="alert-btn primary" onClick={() => startWaterTimer(waterInterval || 30)}>
                  Выпил(а)! Ещё {waterInterval || 30} мин
                </button>
                <button className="alert-btn secondary" onClick={dismissWater}>
                  Отключить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showEyeAlert && (
          <motion.div
            className="alert-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissEye}
          >
            <motion.div
              className="alert-card"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={e => e.stopPropagation()}
            >
              <span className="alert-icon">👁️</span>
              <h3>Время разминки!</h3>
              <p>Сделай упражнения для глаз или спины 🧘</p>
              <div className="alert-actions">
                <button className="alert-btn primary" onClick={() => startEyeTimer(eyeInterval || 20)}>
                  Сделал(а)! Ещё {eyeInterval || 20} мин
                </button>
                <button className="alert-btn secondary" onClick={dismissEye}>
                  Отключить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
