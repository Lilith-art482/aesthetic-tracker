import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSynced } from '../hooks/useSynced';
import './LofiPlayer.css';

type SoundId = 'rain' | 'piano' | 'evening' | 'nature' | 'coffee' | 'fire';

interface SoundDef {
  id: SoundId;
  icon: string;
  name: string;
  url: string;
}

const SOUNDS: SoundDef[] = [
  { id: 'rain', icon: '☔', name: 'Дождь', url: 'https://cdn.pixabay.com/download/audio/2025/12/28/audio_738b7c2f2e.mp3?filename=lofi_music_library-lofi-rain-lofi-music-458077.mp3' },
  { id: 'piano', icon: '🎹', name: 'Пианино', url: 'https://cdn.pixabay.com/download/audio/2024/10/20/audio_bc27d37a27.mp3?filename=hauntsync-relaxing-piano-lofi-for-studying-253086.mp3' },
  { id: 'evening', icon: '🌙', name: 'Вечерний', url: 'https://cdn.pixabay.com/download/audio/2024/10/06/audio_d013332329.mp3?filename=lp-studio-music-soft-evening-hues-lo-fi-247667.mp3' },
  { id: 'nature', icon: '🌊', name: 'Природа', url: 'https://cdn.pixabay.com/download/audio/2024/09/30/audio_4283761bfa.mp3?filename=dbsound-morning-nature-sounds-246034.mp3' },
  { id: 'coffee', icon: '☕', name: 'Кофейня', url: 'https://cdn.pixabay.com/download/audio/2026/06/16/audio_912babebe1.mp3?filename=alex-morgan-chillhop-jazz-coffee-shop-552792.mp3' },
  { id: 'fire', icon: '🔥', name: 'Камин', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_2c362dfa75.mp3?filename=freesound_community-aachen_burning-fireplace-crackling-fire-soundswav-14561.mp3' },
];

interface SavedState {
  currentSound: SoundId;
  isPlaying: boolean;
  volume: number;
  isCompact: boolean;
  pos: { x: number; y: number } | null;
}

export default function LofiPlayer() {
  const [saved, setSaved] = useSynced<SavedState | null>('lofi_player', null);
  const [currentSound, setCurrentSound] = useState<SoundId>('rain');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.25);
  const [isCompact, setIsCompact] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);
  const movedRef = useRef(false);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  const play = useCallback((type: SoundId, vol: number) => {
    stop();
    const sound = SOUNDS.find(s => s.id === type);
    if (!sound) return;
    const audio = new Audio(sound.url);
    audio.volume = vol;
    audio.loop = true;
    audio.play().catch(() => {});
    audioRef.current = audio;
    setCurrentSound(type);
    setIsPlaying(true);
  }, [stop]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play(currentSound, volume);
    }
  }, [isPlaying, currentSound, volume, play, stop]);

  const selectSound = useCallback((type: SoundId) => {
    if (isPlaying) {
      play(type, volume);
    } else {
      setCurrentSound(type);
    }
  }, [isPlaying, volume, play]);

  const adjustVolume = useCallback((val: number) => {
    const v = Math.max(0, Math.min(1, val));
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  }, []);

  // Restore saved state (local first, cloud may override later)
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (!saved) {
      setAudioReady(true);
      timeoutRef.current = window.setTimeout(() => {
        play('rain', 0.25);
      }, 1500);
      return;
    }
    setIsCompact(saved.isCompact);
    setVolume(saved.volume);
    setCurrentSound(saved.currentSound);
    setPos(saved.pos ?? null);
    lastPosRef.current = saved.pos ?? null;
    setAudioReady(true);
    if (saved.isPlaying && !audioRef.current) {
      timeoutRef.current = window.setTimeout(() => play(saved.currentSound, saved.volume), 500);
    }
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [saved, play]);

  // Stop audio on unmount
  useEffect(() => {
    return () => stop();
  }, [stop]);

  // Persist state
  useEffect(() => {
    if (!audioReady) return;
    setSaved({ currentSound, isPlaying, volume, isCompact, pos: lastPosRef.current });
  }, [currentSound, isPlaying, volume, isCompact, audioReady, setSaved]);

  const soundInfo = SOUNDS.find(s => s.id === currentSound)!;

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, input')) return;
    const el = playerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      moved: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch { }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
    drag.moved = true;
    setIsDragging(true);
    const el = playerRef.current;
    const margin = 12;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const elW = el?.offsetWidth ?? 210;
    const elH = el?.offsetHeight ?? 100;
    const x = Math.min(Math.max(margin, e.clientX - drag.offsetX), Math.max(margin, w - elW - margin));
    const y = Math.min(Math.max(margin, e.clientY - drag.offsetY), Math.max(margin, h - elH - margin));
    lastPosRef.current = { x, y };
    setPos(lastPosRef.current);
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag && e.pointerId === drag.pointerId) {
      if (drag.moved) {
        movedRef.current = true;
        setSaved({ currentSound, isPlaying, volume, isCompact, pos: lastPosRef.current });
      }
      dragRef.current = null;
    }
    setIsDragging(false);
  }, [currentSound, isPlaying, volume, isCompact, setSaved]);

  return (
    <motion.div
      ref={playerRef}
      className={`lofi-player ${isCompact ? 'compact' : ''} ${pos ? 'custom-pos' : ''} ${isDragging ? 'dragging' : ''}`}
      style={pos ? { left: pos.x, top: pos.y } : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
    >
      <div
        className={`lofi-header ${isDragging ? 'dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={() => {
          if (movedRef.current) {
            movedRef.current = false;
            return;
          }
          setIsCompact(c => !c);
        }}
      >
        <span className="lofi-title">🎵 Lo-Fi атмосфера</span>
        <button
          className="lofi-header-toggle"
          onClick={(e) => {
            e.stopPropagation();
            if (movedRef.current) {
              movedRef.current = false;
              return;
            }
            setIsCompact(c => !c);
          }}
        >
          {isCompact ? '+' : '−'}
        </button>
      </div>

      {isCompact && (
        <div className="lofi-compact">
          <span className="compact-icon">{soundInfo.icon}</span>
          <span className="compact-name">{soundInfo.name}</span>
          <button className="lofi-play-btn compact" onClick={(e) => { e.stopPropagation(); toggle(); }}>
            {isPlaying ? '⏸️' : '▶️'}
          </button>
        </div>
      )}

      <div className="lofi-sound-list">
        {SOUNDS.map(s => (
          <div
            key={s.id}
            className={`lofi-sound-item ${currentSound === s.id ? 'active' : ''}`}
            onClick={() => selectSound(s.id)}
          >
            <motion.span
              className="sound-icon"
              animate={currentSound === s.id && isPlaying ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {s.icon}
            </motion.span>
            <span className="sound-name">{s.name}</span>
            <span className="sound-status">
              {currentSound === s.id && isPlaying ? '●' : currentSound === s.id ? '⏸' : ''}
            </span>
            <button
              className={`lofi-play-btn ${currentSound === s.id && isPlaying ? 'playing' : ''}`}
              onClick={(e) => { e.stopPropagation(); if (currentSound === s.id) toggle(); else play(s.id, volume); }}
            >
              {currentSound === s.id && isPlaying ? '⏸️' : '▶️'}
            </button>
          </div>
        ))}
      </div>

      <div className="lofi-volume-row">
        <label>🔊</label>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(volume * 100)}
          onChange={e => adjustVolume(parseInt(e.target.value) / 100)}
          className="lofi-volume-slider"
        />
        <span className="lofi-vol-value">{Math.round(volume * 100)}%</span>
      </div>
    </motion.div>
  );
}
