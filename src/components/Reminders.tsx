import { Bell } from '@phosphor-icons/react';
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
  return (
    <div className="reminders-page">
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
      </div>
    </div>
  );
}
