import { useState, useRef } from 'react';
import { UserCircle, Camera, Trash, LockSimple, CheckCircle } from '@phosphor-icons/react';
import type { User } from 'firebase/auth';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { useSynced } from '../hooks/useSynced';
import './Profile.css';

interface ProfileProps {
  user: User;
  onLogout: () => void;
}

interface PlannedAchievement {
  icon: string;
  title: string;
  description: string;
}

const PLANNED_ACHIEVEMENTS: PlannedAchievement[] = [
  { icon: '⭐', title: 'Идеальная неделя', description: 'Выполни все задачи в планнере за неделю' },
  { icon: '🏅', title: 'Первая тренировка', description: 'Проведи первую запись в спорте' },
  { icon: '🔥', title: 'Зарядка 3 дня подряд', description: 'Три дня регулярных тренировок без пропусков' },
  { icon: '💧', title: 'Водный баланс', description: 'Следи за био-таймерами целую неделю' },
];

function readAndResizeAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const size = 256;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('canvas');
          const side = Math.min(img.width, img.height);
          ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = reject;
      img.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Profile({ user, onLogout }: ProfileProps) {
  const [avatar, setAvatar] = useSynced<string>('profile_avatar', '');
  const [displayName, setDisplayName] = useSynced<string>('profile_name', '');
  const [editName, setEditName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const name = displayName || user.displayName || 'Пользователь';
  const initial = (name || user.email || 'П')[0].toUpperCase();
  const email = user.email || '';

  const onAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const dataUrl = await readAndResizeAvatar(file);
      setAvatar(dataUrl);
      setAvatarError(false);
    } catch {
      setAvatarError(true);
    }
  };

  const removeAvatar = () => {
    setAvatar('');
  };

  const startEdit = () => {
    setEditName(name);
    setEditing(true);
    setSaved(false);
  };

  const saveName = async () => {
    const next = editName.trim() || 'Пользователь';
    setSaving(true);
    setDisplayName(next);
    try {
      await updateProfile(auth.currentUser!, { displayName: next });
    } catch {
      // сохраняем локально, даже если облачный профиль недоступен
    }
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="profile-page">
      <h2 className="section-title">
        <UserCircle size={28} weight="fill" />
        Мой профиль
      </h2>

      <div className="profile-layout">
        <section className="profile-card-sec">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {avatar ? (
                <img src={avatar} alt="Аватар" />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="profile-file-input"
              onChange={onAvatarPick}
            />
            <button
              className="profile-avatar-edit"
              onClick={() => fileRef.current?.click()}
              title="Загрузить аватар"
            >
              <Camera size={18} weight="fill" />
            </button>
            {avatar && (
              <button
                className="profile-avatar-remove"
                onClick={removeAvatar}
                title="Убрать аватар"
              >
                <Trash size={16} weight="fill" />
              </button>
            )}
          </div>
          {avatarError && (
            <p className="profile-error">Не получилось загрузить изображение — попробуй другое.</p>
          )}

          <div className="profile-edit-block">
            {!editing ? (
              <div className="profile-name-row">
                <div>
                  <h3 className="profile-name">{name}</h3>
                  <p className="profile-email">{email}</p>
                </div>
                <button className="profile-edit-btn" onClick={startEdit}>
                  ✏️ Изменить имя
                </button>
              </div>
            ) : (
              <div className="profile-edit-form">
                <input
                  type="text"
                  className="profile-input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveName()}
                  placeholder="Твоё имя"
                  maxLength={40}
                />
                <button className="profile-save-btn" onClick={saveName} disabled={saving}>
                  {saving ? 'Сохраняем...' : 'Сохранить'}
                </button>
                <button className="profile-cancel-btn" onClick={() => setEditing(false)}>
                  Отмена
                </button>
              </div>
            )}
            {saved && <p className="profile-saved">Имя сохранено ✅</p>}
          </div>

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
        </section>

        <section className="profile-card-sec">
<h3 className="ach-title">
            <CheckCircle size={20} weight="fill" />
            Достижения
          </h3>
          <p className="ach-subtitle">Награды за твои успехи — скоро здесь появятся первые!</p>
          <div className="ach-list">
            {PLANNED_ACHIEVEMENTS.map(ach => (
              <div key={ach.title} className="ach-item">
                <span className="ach-icon">{ach.icon}</span>
                <div className="ach-info">
                  <span className="ach-name">{ach.title}</span>
                  <span className="ach-desc">{ach.description}</span>
                </div>
                <LockSimple size={18} weight="fill" className="ach-lock" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}