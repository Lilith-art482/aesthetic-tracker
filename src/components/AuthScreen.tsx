import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './AuthScreen.css';

type Mode = 'login' | 'signup';

export default function AuthScreen() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await signup(email.trim(), password);
      }
    } catch (err) {
      const code = (err as { code?: string }).code;
      const messages: Record<string, string> = {
        'auth/invalid-email': 'Проверь формат email 😅',
        'auth/user-not-found': 'Пользователь не найден. Попробуй зарегистрироваться',
        'auth/wrong-password': 'Неверный пароль',
        'auth/email-already-in-use': 'Такой email уже зарегистрирован. Войди',
        'auth/weak-password': 'Пароль слишком короткий (минимум 6 символов)',
        'auth/too-many-requests': 'Слишком много попыток. Подожди немного',
        'auth/invalid-credential': 'Неверный email или пароль',
      };
      setError(messages[code] || 'Что-то пошло не так. Попробуй ещё раз');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="auth-logo">🌸</div>
        <h2 className="auth-title">Aesthetic Tracker</h2>
        <p className="auth-subtitle">
          {mode === 'login' ? 'С возвращением! Войди, чтобы продолжить' : 'Создай аккаунт, чтобы сохранить прогресс'}
        </p>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Вход
          </button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => switchMode('signup')}
          >
            Регистрация
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />

          {error && <p className="auth-error">{error}</p>}

          <motion.button
            className="auth-submit"
            type="submit"
            disabled={busy}
            whileTap={{ scale: 0.97 }}
          >
            {busy ? 'Секундочку...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </motion.button>
        </form>

        <p className="auth-hint">
          Данные синхронизируются между устройствами через облако ☁️
        </p>
      </motion.div>
    </div>
  );
}
