import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Trash, Timer, Clock, Play, Pause } from '@phosphor-icons/react';
import type { Reminder, ReminderMode, ReminderPriority } from '../types';
import { REMINDER_PRIORITIES } from '../types';
import { useSynced } from '../hooks/useSynced';
import { getNotificationPermission, sendNotification } from '../utils/notifications';
import './Reminders.css';

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

const TIMER_PRESETS = [5, 10, 15, 20, 30, 45, 60, 90, 120];

const PRIORITY_TONE: Record<ReminderPriority, string> = {
  high: 'danger',
  medium: 'accent',
  low: 'green',
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function reminderBody(r: Reminder): string {
  return r.mode === 'timer'
    ? `Прошло ${r.timerMinutes} мин — пора выполнить «${r.name}»!`
    : `Напоминание «${r.name}» — пора!`;
}

interface RemindersProps {
  waterInterval: number | null;
  eyeInterval: number | null;
  timeLeft: { water: string; eye: string };
  onStartWater: (minutes: number) => void;
  onStartEye: (minutes: number) => void;
  onDismissWater: () => void;
  onDismissEye: () => void;
}

export default function Reminders({
  waterInterval,
  eyeInterval,
  timeLeft,
  onStartWater,
  onStartEye,
  onDismissWater,
  onDismissEye,
}: RemindersProps) {
  const [reminders, setReminders] = useSynced<Reminder[]>('custom_reminders', []);
  const [name, setName] = useState('');
  const [priority, setPriority] = useState<ReminderPriority>('medium');
  const [mode, setMode] = useState<ReminderMode>('timer');
  const [timerMinutes, setTimerMinutes] = useState(30);
  const [timeValue, setTimeValue] = useState('08:00');
  const [firedReminder, setFiredReminder] = useState<Reminder | null>(null);
  const [, setTick] = useState(0);
  const notifPermission = getNotificationPermission();

  const fireReminder = (r: Reminder) => {
    sendNotification(r.name, reminderBody(r));
    setFiredReminder(r);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
      const now = Date.now();
      setReminders(prev => {
        const fired: Reminder[] = [];
        const next = prev.map(r => {
          if (!r.active) return r;
          if (r.mode === 'timer') {
            const last = r.lastFiredAt ?? now;
            const intervalMs = (r.timerMinutes || 1) * 60_000;
            if (now - last >= intervalMs) {
              fired.push(r);
              return { ...r, lastFiredAt: now };
            }
            return r;
          }
          if (r.time) {
            const [h, m] = r.time.split(':').map(Number);
            const fireAt = new Date();
            fireAt.setHours(h, m, 0, 0);
            if (now >= fireAt.getTime()) {
              fired.push(r);
              return { ...r, active: false };
            }
          }
          return r;
        });
        if (fired.length > 0) {
          setTimeout(() => fired.forEach(f => fireReminder(f)), 0);
          return next;
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addReminder = () => {
    if (!name.trim()) return;
    const reminder: Reminder = {
      id: generateId(),
      name: name.trim(),
      priority,
      mode,
      timerMinutes: mode === 'timer' ? timerMinutes : undefined,
      time: mode === 'time' ? timeValue : undefined,
      lastFiredAt: mode === 'timer' ? Date.now() : undefined,
      active: true,
      createdAt: new Date().toISOString(),
    };
    setReminders(prev => [...prev, reminder]);
    setName('');
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => {
      if (r.id !== id) return r;
      const activating = !r.active;
      return {
        ...r,
        active: activating,
        lastFiredAt: activating && r.mode === 'timer' ? Date.now() : r.lastFiredAt,
      };
    }));
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const dismissFiredModal = () => setFiredReminder(null);

  const now = Date.now();

  return (
    <div className="reminders-page">
      <h2 className="section-title">
        <Bell size={28} weight="fill" />
        Напоминания
      </h2>

      {notifPermission === 'denied' && (
        <div className="rem-notif-hint">
          🔕 Браузерные уведомления отключены — напоминания будут показываться только внутри
          приложения. Разреши их в настройках браузера, чтобы получать уведомления на устройство.
        </div>
      )}

      <div className="reminders-layout">
        <section className="reminders-section">
          <h3 className="reminders-title">Мои напоминания</h3>

          <div className="rem-form">
            <div className="rem-form-row">
              <input
                type="text"
                className="rem-input"
                placeholder="Название напоминания..."
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addReminder()}
              />
              <motion.button
                className="rem-add-btn"
                onClick={addReminder}
                whileTap={{ scale: 0.9 }}
                title="Добавить напоминание"
              >
                <Plus size={20} weight="bold" />
              </motion.button>
            </div>

            <div className="rem-form-row">
              <div className="rem-mode-toggle">
                <button
                  className={`rem-mode-btn ${mode === 'timer' ? 'active' : ''}`}
                  onClick={() => setMode('timer')}
                >
                  <Timer size={16} />
                  Таймер
                </button>
                <button
                  className={`rem-mode-btn ${mode === 'time' ? 'active' : ''}`}
                  onClick={() => setMode('time')}
                >
                  <Clock size={16} />
                  Время
                </button>
              </div>

              <select
                className="rem-select"
                value={priority}
                onChange={e => setPriority(e.target.value as ReminderPriority)}
                title="Приоритет"
              >
                {REMINDER_PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>
                    {p.icon} {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rem-form-row">
              {mode === 'timer' ? (
                <div className="rem-presets">
                  {TIMER_PRESETS.map(m => (
                    <button
                      key={m}
                      className={`rem-preset-btn ${timerMinutes === m ? 'active' : ''}`}
                      onClick={() => setTimerMinutes(m)}
                    >
                      {m} мин
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="time"
                  className="rem-input rem-time-input"
                  value={timeValue}
                  onChange={e => setTimeValue(e.target.value)}
                />
              )}
            </div>
          </div>

          <div className="reminders-list">
            <AnimatePresence>
              {reminders.map(r => {
                const secondsLeft =
                  r.mode === 'timer'
                    ? (r.timerMinutes || 1) * 60 - Math.floor((now - (r.lastFiredAt ?? now)) / 1000)
                    : 0;
                return (
                  <motion.div
                    key={r.id}
                    className={`rem-item ${r.active ? '' : 'paused'} ${PRIORITY_TONE[r.priority]}`}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <button
                      className="rem-toggle"
                      onClick={() => toggleReminder(r.id)}
                      title={r.active ? 'Пауза' : 'Продолжить'}
                    >
                      {r.active ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
                    </button>
                    <div className="rem-info">
                      <span className="rem-name">{r.name}</span>
                      <span className="rem-badge">
                        {REMINDER_PRIORITIES.find(p => p.value === r.priority)?.icon}{' '}
                        {REMINDER_PRIORITIES.find(p => p.value === r.priority)?.label}
                      </span>
                    </div>
                    <span className="rem-countdown">
                      {r.mode === 'timer'
                        ? (r.active ? formatCountdown(secondsLeft) : 'пауза')
                        : `в ${r.time}`}
                    </span>
                    <button
                      className="rem-delete"
                      onClick={() => deleteReminder(r.id)}
                      title="Удалить"
                    >
                      <Trash size={16} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {reminders.length === 0 && (
              <div className="rem-empty">Пока нет напоминаний — добавь первое!</div>
            )}
          </div>
        </section>

        <section className="reminders-section">
          <h3 className="reminders-title">Био-таймеры</h3>

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
                    onClick={() => onStartWater(int.value)}
                  >
                    {int.label}
                  </button>
                ))}
              </div>
            ) : (
              <button className="reminder-stop" onClick={onDismissWater}>
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
                    onClick={() => onStartEye(int.value)}
                  >
                    {int.label}
                  </button>
                ))}
              </div>
            ) : (
              <button className="reminder-stop" onClick={onDismissEye}>
                Отключить
              </button>
            )}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {firedReminder && (
          <motion.div
            className="alert-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissFiredModal}
          >
            <motion.div
              className="alert-card"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={e => e.stopPropagation()}
            >
              <span className="alert-icon">⏰</span>
              <h3>{firedReminder.name}</h3>
              <p>{reminderBody(firedReminder)}</p>
              <div className="alert-actions">
                {firedReminder.mode === 'timer' && (
                  <button
                    className="alert-btn primary"
                    onClick={() => {
                      dismissFiredModal();
                      setReminders(prev => prev.map(r =>
                        r.id === firedReminder.id ? { ...r, lastFiredAt: Date.now() } : r
                      ));
                    }}
                  >
                    Ок! Ещё {firedReminder.timerMinutes} мин
                  </button>
                )}
                <button className="alert-btn secondary" onClick={dismissFiredModal}>
                  Закрыть
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}