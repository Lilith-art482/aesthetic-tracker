import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CloudRain, VinylRecord, Play, Pause } from '@phosphor-icons/react';
import { toggleRainNoise } from '../utils/sounds';
import './LofiPlayer.css';

export default function LofiPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const intervalRef = useRef<number | undefined>(undefined);

  const toggle = () => {
    const nowPlaying = toggleRainNoise();
    setIsPlaying(nowPlaying);
  };

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setCurrentTime(t => (t + 1) % 180);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      setCurrentTime(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="lofi-player">
      <div className="lofi-content">
        <motion.div
          className="vinyl"
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{ duration: 4, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
        >
          <VinylRecord size={40} weight="fill" color="#5a4a6b" />
          <div className="vinyl-hole" />
        </motion.div>

        <div className="lofi-info">
          <span className="lofi-title">Lo-Fi дождь</span>
          <span className="lofi-time">{formatTime(currentTime)}</span>
        </div>

        <motion.button
          className="lofi-toggle"
          onClick={toggle}
          whileTap={{ scale: 0.9 }}
        >
          {isPlaying ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
        </motion.button>
      </div>

      {isPlaying && (
        <motion.div
          className="rain-visualizer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="rain-drop"
              animate={{
                y: [0, 60],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 0.8 + Math.random() * 0.6,
                repeat: Infinity,
                delay: Math.random() * 0.8,
                ease: 'easeIn',
              }}
              style={{ left: `${Math.random() * 100}%` }}
            />
          ))}
        </motion.div>
      )}

      {isPlaying && (
        <div className="lofi-volume">
          <CloudRain size={14} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            className="volume-slider"
          />
        </div>
      )}
    </div>
  );
}
