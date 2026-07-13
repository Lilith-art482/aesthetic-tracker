import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import './LofiPlayer.css';

type SoundId = 'rain' | 'piano' | 'evening' | 'nature' | 'coffee' | 'fire';

interface SoundDef {
  id: SoundId;
  icon: string;
  name: string;
}

const SOUNDS: SoundDef[] = [
  { id: 'rain', icon: '☔', name: 'Дождь' },
  { id: 'piano', icon: '🎹', name: 'Пианино' },
  { id: 'evening', icon: '🌙', name: 'Вечерний' },
  { id: 'nature', icon: '🌊', name: 'Природа' },
  { id: 'coffee', icon: '☕', name: 'Кофейня' },
  { id: 'fire', icon: '🔥', name: 'Камин' },
];

interface SavedState {
  currentSound: SoundId;
  isPlaying: boolean;
  volume: number;
  isCompact: boolean;
}

function loadState(): SavedState | null {
  try {
    const raw = localStorage.getItem('lofi_player');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(s: SavedState) {
  try {
    localStorage.setItem('lofi_player', JSON.stringify(s));
  } catch { }
}

export default function LofiPlayer() {
  const [currentSound, setCurrentSound] = useState<SoundId>('rain');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.25);
  const [isCompact, setIsCompact] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<Record<string, any> | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const restoreRef = useRef<SavedState | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const cleanup = useCallback(() => {
    if (nodesRef.current) {
      ['tickInterval', 'interval', 'birdInterval', 'jazzInterval', 'crackleInterval', 'padInterval'].forEach(k => {
        if (nodesRef.current[k]) clearInterval(nodesRef.current[k]);
      });
      if (nodesRef.current.masterGain) nodesRef.current.masterGain.disconnect();
      nodesRef.current = null;
    }
  }, []);

  const startSound = useCallback((type: SoundId, vol: number) => {
    cleanup();

    const ctx = getCtx();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(vol, ctx.currentTime);
    masterGain.connect(ctx.destination);
    masterRef.current = masterGain;

    const nodes: Record<string, any> = { masterGain };

    switch (type) {
      case 'rain': {
        const buf = ctx.createBuffer(1, 2 * ctx.sampleRate, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.3;

        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        filter.Q.value = 0.7;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol * 0.6, ctx.currentTime);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        const tickGain = ctx.createGain();
        tickGain.gain.setValueAtTime(vol * 0.15, ctx.currentTime);
        tickGain.connect(masterGain);

        const ti = setInterval(() => {
          if (!nodesRef.current) return;
          const t = ctx.createBufferSource();
          const tb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.02), ctx.sampleRate);
          const td = tb.getChannelData(0);
          for (let i = 0; i < td.length; i++) td[i] = (Math.random() * 2 - 1) * 0.5 * Math.exp(-i / 100);
          t.buffer = tb;
          t.connect(tickGain);
          t.start(ctx.currentTime);
        }, 200 + Math.random() * 400);

        nodes.source = src;
        nodes.filter = filter;
        nodes.gain = gain;
        nodes.tickInterval = ti;
        src.start(ctx.currentTime);
        break;
      }

      case 'piano': {
        const notes = [523, 587, 659, 784, 880, 988, 1175];
        let idx = 0;
        const pi = setInterval(() => {
          if (!nodesRef.current) return;
          const n = notes[idx % notes.length];
          [n, n * 1.25].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            g.gain.setValueAtTime(vol * 0.04, ctx.currentTime + i * 0.1);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.8);
            osc.connect(g);
            g.connect(masterGain);
            osc.start(ctx.currentTime + i * 0.1);
            osc.stop(ctx.currentTime + i * 0.1 + 0.8);
          });
          idx++;
        }, 400);

        nodes.interval = pi;
        break;
      }

      case 'evening': {
        const chords = [[261, 329, 392], [293, 369, 440], [329, 415, 494], [349, 440, 523]];
        let ci = 0;
        const ei = setInterval(() => {
          if (!nodesRef.current) return;
          const chord = chords[ci % chords.length];
          chord.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            g.gain.setValueAtTime(vol * 0.03, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
            osc.connect(g);
            g.connect(masterGain);
            osc.start(ctx.currentTime + i * 0.08);
            osc.stop(ctx.currentTime + 2 + i * 0.08);
          });
          ci++;
        }, 3000);

        nodes.interval = ei;
        break;
      }

      case 'nature': {
        const buf = ctx.createBuffer(1, 3 * ctx.sampleRate, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.2 * (0.5 + 0.5 * Math.sin(i / 1000));

        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 600;
        filter.Q.value = 0.5;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol * 0.3, ctx.currentTime);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        const birdGain = ctx.createGain();
        birdGain.gain.setValueAtTime(vol * 0.1, ctx.currentTime);
        birdGain.connect(masterGain);

        const bi = setInterval(() => {
          if (!nodesRef.current) return;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          const freq = 800 + Math.random() * 2000;
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.2, ctx.currentTime + 0.2);
          g.gain.setValueAtTime(vol * 0.06, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc.connect(g);
          g.connect(birdGain);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.5);
        }, 1500 + Math.random() * 3000);

        nodes.source = src;
        nodes.filter = filter;
        nodes.gain = gain;
        nodes.birdInterval = bi;
        src.start(ctx.currentTime);
        break;
      }

      case 'coffee': {
        const buf = ctx.createBuffer(1, 2 * ctx.sampleRate, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.1 * (0.7 + 0.3 * Math.sin(i / 2000));

        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol * 0.2, ctx.currentTime);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        const jazzChord = [349, 440, 523, 659];
        let ji = 0;
        const jz = setInterval(() => {
          if (!nodesRef.current) return;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = jazzChord[ji % jazzChord.length];
          g.gain.setValueAtTime(vol * 0.02, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 1.2);
          ji++;
        }, 1800);

        nodes.source = src;
        nodes.filter = filter;
        nodes.gain = gain;
        nodes.jazzInterval = jz;
        src.start(ctx.currentTime);
        break;
      }

      case 'fire': {
        const crackleGain = ctx.createGain();
        crackleGain.gain.setValueAtTime(vol * 0.15, ctx.currentTime);
        crackleGain.connect(masterGain);

        const cr = setInterval(() => {
          if (!nodesRef.current) return;
          const c = ctx.createBufferSource();
          const cb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
          const cd = cb.getChannelData(0);
          for (let i = 0; i < cd.length; i++) cd[i] = (Math.random() * 2 - 1) * 0.3 * Math.exp(-i / 200);
          c.buffer = cb;
          c.connect(crackleGain);
          c.start(ctx.currentTime);
        }, 80 + Math.random() * 200);

        const padNotes = [220, 277, 330, 440];
        let pi = 0;
        const pd = setInterval(() => {
          if (!nodesRef.current) return;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.value = padNotes[pi % padNotes.length];
          g.gain.setValueAtTime(vol * 0.02, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 3);
          pi++;
        }, 2800);

        nodes.crackleInterval = cr;
        nodes.padInterval = pd;
        break;
      }
    }

    nodesRef.current = nodes;
  }, [cleanup, getCtx]);

  const stopSound = useCallback(() => {
    cleanup();
    nodesRef.current = null;
    masterRef.current = null;
  }, [cleanup]);

  const play = useCallback((type: SoundId, vol: number) => {
    startSound(type, vol);
    setIsPlaying(true);
    setCurrentSound(type);
  }, [startSound]);

  const stop = useCallback(() => {
    stopSound();
    setIsPlaying(false);
  }, [stopSound]);

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
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setValueAtTime(v, ctxRef.current.currentTime);
    }
  }, []);

  // Restore saved state on mount
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      restoreRef.current = saved;
      setIsCompact(saved.isCompact);
      setVolume(saved.volume);
      setCurrentSound(saved.currentSound);
      setAudioReady(true);
      if (saved.isPlaying) {
        setTimeout(() => play(saved.currentSound, saved.volume), 500);
      }
    } else {
      setAudioReady(true);
      setTimeout(() => {
        play('rain', 0.25);
      }, 1500);
    }
    return () => {
      stopSound();
      if (ctxRef.current) ctxRef.current.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist state
  useEffect(() => {
    if (!audioReady) return;
    saveState({ currentSound, isPlaying, volume, isCompact });
  }, [currentSound, isPlaying, volume, isCompact, audioReady]);

  const soundInfo = SOUNDS.find(s => s.id === currentSound)!;

  return (
    <motion.div
      className={`lofi-player ${isCompact ? 'compact' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
    >
      <div className="lofi-header" onClick={() => setIsCompact(c => !c)}>
        <span className="lofi-title">🎵 Lo-Fi атмосфера</span>
        <button className="lofi-header-toggle" onClick={(e) => { e.stopPropagation(); setIsCompact(c => !c); }}>
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
              onClick={(e) => { e.stopPropagation(); selectSound(s.id); if (currentSound === s.id) toggle(); else play(s.id, volume); }}
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
