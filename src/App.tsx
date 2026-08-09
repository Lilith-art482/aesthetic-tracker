import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarBlank,
  Wallet,
  Flower,
  ForkKnife,
  BookOpen,
  Barbell,
  Bell,
  UserCircle
} from '@phosphor-icons/react';
import type { Emotion, Tab } from './types';
import { useSynced } from './hooks/useSynced';
import {
  notificationsSupported,
  requestNotificationPermission,
  sendNotification,
} from './utils/notifications';
import { useAuth, AuthProvider } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';
import RobotAssistant from './components/RobotAssistant';
import Reminders from './components/Reminders';
import Planner from './components/Planner';
import Finances from './components/Finances';
import Habits from './components/Habits';
import Nutrition from './components/Nutrition';
import Recipes from './components/Recipes';
import Sport from './components/Sport';
import LofiPlayer from './components/LofiPlayer';
import Tutorial from './components/Tutorial';
import Profile from './components/Profile';
import { DARK_PHRASES, LIGHT_PHRASES, pickPhrase, type PhraseMap } from './data/phrases';
import './App.css';

const IDLE_TIMEOUT = 120_000;

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

function AppInner() {
  const { user, status, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('planner');
  const [robotEmotion, setRobotEmotion] = useState<Emotion>('neutral');
  const [robotSpeech, setRobotSpeech] = useState<string | undefined>();
  const [showTutorial, setShowTutorial] = useSynced('tutorial_done', true);
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'dark';
    } catch {
      return false;
    }
  });
  const [waterInterval, setWaterInterval] = useSynced<number | null>('water_interval', null);
  const [eyeInterval, setEyeInterval] = useSynced<number | null>('eye_interval', null);
  const [waterTimer, setWaterTimer] = useState(0);
  const [eyeTimer, setEyeTimer] = useState(0);
  const [showWaterAlert, setShowWaterAlert] = useState(false);
  const [showEyeAlert, setShowEyeAlert] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ water: '', eye: '' });

  const idleTimerRef = useRef<number | undefined>(undefined);
  const lastActivityRef = useRef(Date.now());
  const greetedRef = useRef(false);

  useEffect(() => {
    document.body.classList.toggle('dark-theme', isDark);
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch { }
  }, [isDark]);

  const pickPhraseText = useCallback((event: keyof PhraseMap) => {
    return pickPhrase(isDark ? DARK_PHRASES : LIGHT_PHRASES, event);
  }, [isDark]);

  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = window.setTimeout(() => {
      if (robotEmotion === 'neutral') {
        setRobotEmotion('thinking');
        setRobotSpeech(pickPhraseText('idle'));
        setTimeout(() => {
          setRobotEmotion('neutral');
          setRobotSpeech(undefined);
        }, 6000);
      }
    }, IDLE_TIMEOUT);
  }, [robotEmotion, pickPhraseText]);

  const setEmotion = useCallback((emotion: Emotion, speech?: string) => {
    setRobotEmotion(emotion);
    if (speech) {
      setRobotSpeech(speech);
      setTimeout(() => setRobotSpeech(undefined), 5000);
    } else {
      setRobotSpeech(undefined);
    }
    resetIdleTimer();
  }, [resetIdleTimer]);

  const updateTimers = useCallback(() => {
    if (waterInterval) {
      const elapsed = Math.floor((Date.now() - waterTimer) / 1000);
      const remaining = waterInterval * 60 - elapsed;
      if (remaining <= 0) {
        setShowWaterAlert(true);
        setEmotion('thirsty', pickPhraseText('waterReminder'));
        sendNotification('Пора пить воду! 💧', 'Не забывай увлажнять себя 💙');
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
        setEmotion('sleepy', pickPhraseText('eyeReminder'));
        sendNotification('Время разминки! 👁️', 'Сделай упражнения для глаз или спины 🧘');
        setEyeTimer(Date.now());
      } else {
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        setTimeLeft(prev => ({ ...prev, eye: `${m}:${String(s).padStart(2, '0')}` }));
      }
    }
  }, [waterInterval, eyeInterval, waterTimer, eyeTimer, setEmotion, pickPhraseText]);

  useEffect(() => {
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [updateTimers]);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  const startWaterTimer = (minutes: number) => {
    setWaterInterval(minutes);
    setWaterTimer(Date.now());
    setShowWaterAlert(false);
    setEmotion('neutral');
  };

  const startEyeTimer = (minutes: number) => {
    setEyeInterval(minutes);
    setEyeTimer(Date.now());
    setShowEyeAlert(false);
    setEmotion('neutral');
  };

  const dismissWater = () => {
    setShowWaterAlert(false);
    setWaterInterval(null);
    setEmotion('neutral');
  };

  const dismissEye = () => {
    setShowEyeAlert(false);
    setEyeInterval(null);
    setEmotion('neutral');
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setEmotion('neutral');
  };

  const handleTaskCompleted = () => {
    setEmotion('inspired', pickPhraseText('taskComplete'));
  };

  const handleHabitChecked = () => {
    setEmotion('happy', pickPhraseText('habitDone'));
  };

  const handleIncomeAdded = () => {
    setEmotion('love', pickPhraseText('incomeAdded'));
  };

  const handleExpenseAdded = () => {
    setEmotion('neutral', pickPhraseText('expenseAdded'));
  };

  useEffect(() => {
    if (!user || showTutorial || greetedRef.current) return;
    greetedRef.current = true;
    const t = window.setTimeout(() => {
      setEmotion('happy', pickPhraseText('morningGreeting'));
    }, 1200);
    return () => clearTimeout(t);
  }, [user, showTutorial, pickPhraseText, setEmotion]);

  useEffect(() => {
    if (!user || showTutorial) return;
    if (!notificationsSupported() || Notification.permission !== 'default') return;
    const t = window.setTimeout(() => setShowNotifPrompt(true), 2500);
    return () => clearTimeout(t);
  }, [user, showTutorial]);

  const allowNotifications = async () => {
    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        sendNotification('Уведомления включены!', 'Теперь трекер будет напоминать тебе обо всём 💌');
      }
    } catch {
      // ignore
    }
    setShowNotifPrompt(false);
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      setEmotion('mischievous', 'Вот теперь тёмная сторона силы. Нравится?');
    } else {
      setEmotion('happy', 'О, ты вернулся на светлую сторону! 🌸');
    }
  };

  if (status === 'loading') {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-logo">🌸</div>
          <p className="auth-subtitle">Подключаемся к облаку...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'planner', label: 'Планер', icon: <CalendarBlank size={22} weight="fill" /> },
    { id: 'finances', label: 'Финансы', icon: <Wallet size={22} weight="fill" /> },
    { id: 'habits', label: 'Привычки', icon: <Flower size={22} weight="fill" /> },
    { id: 'nutrition', label: 'Питание', icon: <ForkKnife size={22} weight="fill" /> },
    { id: 'recipes', label: 'Рецепты', icon: <BookOpen size={22} weight="fill" /> },
    { id: 'sport', label: 'Спорт', icon: <Barbell size={22} weight="fill" /> },
    { id: 'reminders', label: 'Напоминания', icon: <Bell size={22} weight="fill" /> },
    { id: 'profile', label: 'Профиль', icon: <UserCircle size={22} weight="fill" /> },
  ];

  return (
    <div className="app" onClick={resetIdleTimer} onKeyDown={resetIdleTimer}>
      <AnimatePresence>
        {showTutorial && (
          <Tutorial onFinish={() => {
            setShowTutorial(false);
            setEmotion('happy', pickPhraseText('morningGreeting'));
          }} />
        )}
      </AnimatePresence>

      <div className="app-bg">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
        <div className="stars" />
      </div>

      <div className="lofi-corner">
        <LofiPlayer />
      </div>

      <button
        className="theme-toggle"
        onClick={toggleTheme}
        title={isDark ? 'Светлая тема' : 'Тёмная тема'}
      >
        <span>{isDark ? '☀️' : '🌙'}</span>
        <span className="theme-toggle-text">{isDark ? 'Светлая тема' : 'Тёмная тема'}</span>
      </button>

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
                {activeTab === 'planner' && <Planner onTaskCompleted={handleTaskCompleted} />}
                {activeTab === 'finances' && (
                  <Finances
                    onIncomeAdded={handleIncomeAdded}
                    onExpenseAdded={handleExpenseAdded}
                  />
                )}
                {activeTab === 'habits' && <Habits onHabitChecked={handleHabitChecked} />}
                {activeTab === 'nutrition' && <Nutrition />}
                {activeTab === 'recipes' && <Recipes />}
                {activeTab === 'sport' && <Sport />}
                {activeTab === 'reminders' && (
                  <Reminders
                    waterInterval={waterInterval}
                    eyeInterval={eyeInterval}
                    timeLeft={timeLeft}
                    onStartWater={startWaterTimer}
                    onStartEye={startEyeTimer}
                    onDismissWater={dismissWater}
                    onDismissEye={dismissEye}
                  />
                )}
                {activeTab === 'profile' && <Profile user={user} onLogout={logout} />}
              </motion.div>
            </AnimatePresence>
          </div>

          <aside className="sidebar">
            <RobotAssistant
              emotion={robotEmotion}
              speechText={robotSpeech}
              dark={isDark}
            />
          </aside>
        </div>
      </main>

      <AnimatePresence>
        {showNotifPrompt && (
          <motion.div
            className="alert-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="alert-card"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <span className="alert-icon">🔔</span>
              <h3>Показывать уведомления?</h3>
              <p>
                Разреши трекеру присылать уведомления на устройство — тогда напоминания придут,
                даже когда ты на другом сайте или в другом приложении 💌
              </p>
              <div className="alert-actions">
                <button className="alert-btn primary" onClick={allowNotifications}>
                  Разрешить
                </button>
                <button className="alert-btn secondary" onClick={() => setShowNotifPrompt(false)}>
                  Не сейчас
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
