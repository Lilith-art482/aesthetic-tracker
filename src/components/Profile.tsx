import { motion } from 'framer-motion';
import type { User } from 'firebase/auth';

interface ProfileProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
}

export default function Profile({ user, onBack, onLogout }: ProfileProps) {
  const initial = (user.email?.[0] || 'П').toUpperCase();

  return (
    <motion.div
      className="profile-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="profile-card"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <button className="profile-back" onClick={onBack} title="Назад">
          ←
        </button>

        <div className="profile-avatar">{initial}</div>

        <h2 className="profile-name">Мой профиль</h2>
        <p className="profile-email">{user.email}</p>

        <div className="profile-info">
          <div className="profile-info-row">
            <span>Аккаунт</span>
            <strong>Активен</strong>
          </div>
          <div className="profile-info-row">
            <span>Синхронизация</span>
            <strong>Облако включено</strong>
          </div>
        </div>

        <button className="profile-logout" onClick={onLogout}>
          ⎋ Выйти из аккаунта
        </button>
      </motion.div>
    </motion.div>
  );
}
