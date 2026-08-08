import { useEffect, useRef, useCallback } from 'react';
import type { Emotion } from '../types';
import { playEmotionSound } from '../utils/sounds';

interface RobotAssistantProps {
  emotion: Emotion;
  speechText?: string;
  className?: string;
  dark?: boolean;
}

interface FaceConfig {
  leftOpen: number; rightOpen: number;
  leftPupilX: number; leftPupilY: number;
  rightPupilX: number; rightPupilY: number;
  pupilSize: number; irisColor: string;
  eyeColor: string;
  extra: string;
}

const LIGHT_FACES: Record<Emotion, FaceConfig> = {
  happy: {
    leftOpen: 0.95, rightOpen: 0.95,
    leftPupilX: 0, leftPupilY: -2,
    rightPupilX: 0, rightPupilY: -2,
    pupilSize: 18, irisColor: '#8b7fc7', eyeColor: '#2d2d4e',
    extra: `
      <circle cx="130" cy="125" r="8" fill="#ffb3c6" opacity="0.6" />
      <circle cx="270" cy="125" r="8" fill="#ffb3c6" opacity="0.6" />
      <path d="M 185 170 Q 200 190 215 170" stroke="#ffb3c6" stroke-width="4" fill="none" stroke-linecap="round" />
      <path d="M 145 128 L 148 125 L 151 128" fill="#fff9f0" opacity="0.6" />
      <path d="M 249 128 L 252 125 L 255 128" fill="#fff9f0" opacity="0.6" />
    `
  },
  sleepy: {
    leftOpen: 0.25, rightOpen: 0.25,
    leftPupilX: 0, leftPupilY: 0,
    rightPupilX: 0, rightPupilY: 0,
    pupilSize: 12, irisColor: '#a89bc9', eyeColor: '#2d2d4e',
    extra: `
      <text x="300" y="100" font-size="18" fill="#c8b0ff" opacity="0.6" font-weight="bold">z</text>
      <text x="315" y="85" font-size="14" fill="#c8b0ff" opacity="0.4" font-weight="bold">Z</text>
      <text x="325" y="72" font-size="10" fill="#c8b0ff" opacity="0.3" font-weight="bold">Z</text>
      <line x1="190" y1="170" x2="210" y2="170" stroke="#b8a8d0" stroke-width="3" stroke-linecap="round" />
    `
  },
  thirsty: {
    leftOpen: 0.9, rightOpen: 0.9,
    leftPupilX: 0, leftPupilY: 4,
    rightPupilX: 0, rightPupilY: 4,
    pupilSize: 16, irisColor: '#b8a0d0', eyeColor: '#2d2d4e',
    extra: `
      <ellipse cx="155" cy="152" rx="4" ry="7" fill="#7ec8e3" opacity="0.8" />
      <ellipse cx="155" cy="150" rx="2" ry="3" fill="white" opacity="0.5" />
      <path d="M 280 120 Q 284 130 280 135 Q 276 130 280 120" fill="#7ec8e3" opacity="0.5" />
      <path d="M 190 175 Q 200 165 210 175" stroke="#b8a8d0" stroke-width="3" fill="none" stroke-linecap="round" />
    `
  },
  inspired: {
    leftOpen: 1.0, rightOpen: 1.0,
    leftPupilX: 0, leftPupilY: -3,
    rightPupilX: 0, rightPupilY: -3,
    pupilSize: 20, irisColor: '#b8a0ff', eyeColor: '#2d2d4e',
    extra: `
      <circle cx="200" cy="140" r="25" fill="url(#eyeGlow)" opacity="0.6" />
      <path d="M 200 165 L 204 172 L 213 174 L 207 180 L 208 189 L 200 184 L 192 189 L 193 180 L 187 174 L 196 172 Z" fill="#ffd700" opacity="0.9" />
    `
  },
  neutral: {
    leftOpen: 0.8, rightOpen: 0.8,
    leftPupilX: 0, leftPupilY: 0,
    rightPupilX: 0, rightPupilY: 0,
    pupilSize: 15, irisColor: '#9b8fc0', eyeColor: '#2d2d4e',
    extra: `<circle cx="200" cy="170" r="4" fill="#b8a8d0" />`
  },
  love: {
    leftOpen: 0.9, rightOpen: 0.9,
    leftPupilX: 0, leftPupilY: -2,
    rightPupilX: 0, rightPupilY: -2,
    pupilSize: 16, irisColor: '#ff8da1', eyeColor: '#2d2d4e',
    extra: `
      <path d="M 135 132 A 6 6 0 0 1 147 132 A 6 6 0 0 1 159 132 Q 159 140 147 148 Q 135 140 135 132" fill="#ff4d6d" />
      <path d="M 235 132 A 6 6 0 0 1 247 132 A 6 6 0 0 1 259 132 Q 259 140 247 148 Q 235 140 235 132" fill="#ff4d6d" />
      <text x="80" y="100" font-size="20">❤️</text>
      <text x="310" y="100" font-size="20">❤️</text>
      <text x="100" y="210" font-size="16">💕</text>
      <text x="290" y="210" font-size="16">💕</text>
      <path d="M 190 170 Q 200 177 210 170" stroke="#ff8da1" stroke-width="3" fill="none" stroke-linecap="round" />
    `
  },
  thinking: {
    leftOpen: 0.6, rightOpen: 0.6,
    leftPupilX: 4, leftPupilY: -2,
    rightPupilX: -4, rightPupilY: -2,
    pupilSize: 14, irisColor: '#a89bc9', eyeColor: '#2d2d4e',
    extra: `
      <circle cx="190" cy="175" r="3" fill="#b8a8d0" />
      <circle cx="200" cy="175" r="3" fill="#b8a8d0" />
      <circle cx="210" cy="175" r="3" fill="#b8a8d0" />
      <text x="300" y="90" font-size="22" opacity="0.4">⚙️</text>
    `
  },
  mischievous: {
    leftOpen: 0.42, rightOpen: 0.42,
    leftPupilX: 0, leftPupilY: 3,
    rightPupilX: 0, rightPupilY: 3,
    pupilSize: 13, irisColor: '#b8a0ff', eyeColor: '#2d2d4e',
    extra: `
      <path d="M 128 128 Q 138 116 148 126" stroke="#b8a0ff" stroke-width="3" fill="none" stroke-linecap="round" />
      <circle cx="140" cy="130" r="3" fill="#7ec8e3" opacity="0.9" />
      <path d="M 272 128 Q 262 116 252 126" stroke="#b8a0ff" stroke-width="3" fill="none" stroke-linecap="round" />
      <circle cx="260" cy="130" r="3" fill="#7ec8e3" opacity="0.9" />
      <path d="M 185 168 Q 200 182 215 168" stroke="#b8a0ff" stroke-width="3" fill="none" stroke-linecap="round" />
      <path d="M 196 174 L 199 182 L 202 174 Z" fill="#fff" opacity="0.85" />
    `
  },
  sassy: {
    leftOpen: 1.0, rightOpen: 1.0,
    leftPupilX: 0, leftPupilY: -1,
    rightPupilX: 0, rightPupilY: -1,
    pupilSize: 17, irisColor: '#00c2ff', eyeColor: '#2d2d4e',
    extra: `
      <circle cx="145" cy="128" r="4" fill="#fff" opacity="0.9" />
      <circle cx="255" cy="128" r="4" fill="#fff" opacity="0.9" />
      <path d="M 128 112 L 158 116" stroke="#b8a0ff" stroke-width="3" stroke-linecap="round" />
      <path d="M 272 112 L 242 116" stroke="#b8a0ff" stroke-width="3" stroke-linecap="round" />
      <path d="M 182 168 Q 200 190 218 168" stroke="#b8a0ff" stroke-width="4" fill="none" stroke-linecap="round" />
      <path d="M 190 176 L 195 186 L 200 176" fill="#fff" opacity="0.9" />
      <path d="M 206 178 L 211 186 L 216 178" fill="#fff" opacity="0.9" />
    `
  },
  sarcastic: {
    leftOpen: 0.32, rightOpen: 0.32,
    leftPupilX: 2, leftPupilY: 2,
    rightPupilX: -2, rightPupilY: 2,
    pupilSize: 11, irisColor: '#a89bc9', eyeColor: '#2d2d4e',
    extra: `
      <path d="M 130 118 L 160 112" stroke="#b8a0ff" stroke-width="3" stroke-linecap="round" />
      <path d="M 270 118 L 240 112" stroke="#b8a0ff" stroke-width="3" stroke-linecap="round" />
      <path d="M 192 166 Q 200 176 208 166" stroke="#b8a0ff" stroke-width="3" fill="none" stroke-linecap="round" />
    `
  },
  strict: {
    leftOpen: 0.85, rightOpen: 0.85,
    leftPupilX: 0, leftPupilY: 0,
    rightPupilX: 0, rightPupilY: 0,
    pupilSize: 15, irisColor: '#c88a98', eyeColor: '#2d2d4e',
    extra: `
      <path d="M 132 122 L 160 122" stroke="#c88a98" stroke-width="3" stroke-linecap="round" />
      <path d="M 268 122 L 240 122" stroke="#c88a98" stroke-width="3" stroke-linecap="round" />
      <path d="M 188 175 L 212 175" stroke="#c88a98" stroke-width="3" stroke-linecap="round" />
      <circle cx="200" cy="155" r="34" fill="#c88a98" opacity="0.1" />
    `
  },
  fauxcute: {
    leftOpen: 1.0, rightOpen: 1.0,
    leftPupilX: 0, leftPupilY: -3,
    rightPupilX: 0, rightPupilY: -3,
    pupilSize: 20, irisColor: '#b8a0ff', eyeColor: '#2d2d4e',
    extra: `
      <circle cx="145" cy="128" r="6" fill="#fff" opacity="0.9" />
      <circle cx="255" cy="128" r="6" fill="#fff" opacity="0.9" />
      <circle cx="130" cy="158" r="7" fill="#ffb3c6" opacity="0.5" />
      <circle cx="270" cy="158" r="7" fill="#ffb3c6" opacity="0.5" />
      <path d="M 188 172 Q 200 182 212 172" stroke="#b8a0ff" stroke-width="3" fill="none" stroke-linecap="round" />
    `
  }
};

const DARK_FACES: Record<Emotion, FaceConfig> = {
  happy: {
    leftOpen: 0.95, rightOpen: 0.95,
    leftPupilX: 0, leftPupilY: -2,
    rightPupilX: 0, rightPupilY: -2,
    pupilSize: 18, irisColor: '#B44B8E', eyeColor: '#1a0a1a',
    extra: `
      <circle cx="130" cy="125" r="8" fill="#7928CA" opacity="0.4" />
      <circle cx="270" cy="125" r="8" fill="#7928CA" opacity="0.4" />
      <g id="mouth">
        <g id="teeth-wrapper" transform="translate(0, -3)">
          <path d="M 190 183 L 194 200 L 198 183 Z" fill="#FDE2E4" opacity="1" />
          <path d="M 202 183 L 206 200 L 210 183 Z" fill="#FDE2E4" opacity="1" />
        </g>
        <path d="M 185 170 Q 200 190 215 170" stroke="#B44B8E" stroke-width="4" fill="none" stroke-linecap="round" />
      </g>
      <path d="M 145 126 L 149 123 L 153 126" fill="#00D4FF" opacity="0.7" />
      <path d="M 247 126 L 251 123 L 255 126" fill="#00D4FF" opacity="0.7" />
      <path d="M 130 115 L 160 112" stroke="#B44B8E" stroke-width="3" stroke-linecap="round" />
      <path d="M 270 115 L 240 112" stroke="#B44B8E" stroke-width="3" stroke-linecap="round" />
    `
  },
  sleepy: {
    leftOpen: 0.2, rightOpen: 0.2,
    leftPupilX: 0, leftPupilY: 0,
    rightPupilX: 0, rightPupilY: 0,
    pupilSize: 10, irisColor: '#7928CA', eyeColor: '#1a0a1a',
    extra: `
      <text x="300" y="100" font-size="18" fill="#B44B8E" opacity="0.5" font-weight="bold">z</text>
      <text x="315" y="85" font-size="14" fill="#B44B8E" opacity="0.3" font-weight="bold">Z</text>
      <text x="325" y="72" font-size="10" fill="#B44B8E" opacity="0.2" font-weight="bold">Z</text>
      <line x1="190" y1="170" x2="210" y2="170" stroke="#7928CA" stroke-width="3" stroke-linecap="round" />
      <path d="M 135 118 L 160 120" stroke="#7928CA" stroke-width="2" stroke-linecap="round" />
      <path d="M 265 118 L 240 120" stroke="#7928CA" stroke-width="2" stroke-linecap="round" />
    `
  },
  thirsty: {
    leftOpen: 0.9, rightOpen: 0.9,
    leftPupilX: 0, leftPupilY: 4,
    rightPupilX: 0, rightPupilY: 4,
    pupilSize: 16, irisColor: '#7928CA', eyeColor: '#1a0a1a',
    extra: `
      <ellipse cx="155" cy="152" rx="4" ry="7" fill="#00D4FF" opacity="0.6" />
      <ellipse cx="155" cy="150" rx="2" ry="3" fill="white" opacity="0.3" />
      <path d="M 280 120 Q 284 130 280 135 Q 276 130 280 120" fill="#00D4FF" opacity="0.4" />
      <path d="M 190 175 Q 200 165 210 175" stroke="#7928CA" stroke-width="3" fill="none" stroke-linecap="round" />
      <path d="M 130 115 L 160 115" stroke="#B44B8E" stroke-width="3" stroke-linecap="round" />
      <path d="M 270 115 L 240 115" stroke="#B44B8E" stroke-width="3" stroke-linecap="round" />
    `
  },
  inspired: {
    leftOpen: 1.0, rightOpen: 1.0,
    leftPupilX: 0, leftPupilY: -3,
    rightPupilX: 0, rightPupilY: -3,
    pupilSize: 22, irisColor: '#B44B8E', eyeColor: '#1a0a1a',
    extra: `
      <circle cx="200" cy="140" r="30" fill="url(#eyeGlow)" opacity="0.5" />
      <path d="M 200 165 L 204 172 L 213 174 L 207 180 L 208 189 L 200 184 L 192 189 L 193 180 L 187 174 L 196 172 Z" fill="#B44B8E" opacity="0.9" />
      <circle cx="145" cy="133" r="6" fill="#00D4FF" opacity="0.6" />
      <circle cx="255" cy="133" r="6" fill="#00D4FF" opacity="0.6" />
      <path d="M 130 110 L 160 108" stroke="#B44B8E" stroke-width="3" stroke-linecap="round" />
      <path d="M 270 110 L 240 108" stroke="#B44B8E" stroke-width="3" stroke-linecap="round" />
    `
  },
  neutral: {
    leftOpen: 0.8, rightOpen: 0.8,
    leftPupilX: 0, leftPupilY: 0,
    rightPupilX: 0, rightPupilY: 0,
    pupilSize: 15, irisColor: '#7928CA', eyeColor: '#1a0a1a',
    extra: `
      <circle cx="200" cy="170" r="4" fill="#B44B8E" />
      <path d="M 130 115 L 160 118" stroke="#B44B8E" stroke-width="3" stroke-linecap="round" />
      <path d="M 270 115 L 240 112" stroke="#B44B8E" stroke-width="3" stroke-linecap="round" />
    `
  },
  love: {
    leftOpen: 0.9, rightOpen: 0.9,
    leftPupilX: 0, leftPupilY: -2,
    rightPupilX: 0, rightPupilY: -2,
    pupilSize: 16, irisColor: '#ff4d6d', eyeColor: '#1a0a1a',
    extra: `
      <path d="M 135 132 A 6 6 0 0 1 147 132 A 6 6 0 0 1 159 132 Q 159 140 147 148 Q 135 140 135 132" fill="#ff4d6d" />
      <path d="M 235 132 A 6 6 0 0 1 247 132 A 6 6 0 0 1 259 132 Q 259 140 247 148 Q 235 140 235 132" fill="#ff4d6d" />
      <text x="80" y="100" font-size="20">❤️</text>
      <text x="310" y="100" font-size="20">❤️</text>
      <text x="100" y="210" font-size="16">💕</text>
      <text x="290" y="210" font-size="16">💕</text>
      <path d="M 190 170 Q 200 177 210 170" stroke="#ff4d6d" stroke-width="3" fill="none" stroke-linecap="round" />
      <path d="M 130 125 L 160 125" stroke="#B44B8E" stroke-width="2" stroke-linecap="round" />
      <path d="M 270 125 L 240 125" stroke="#B44B8E" stroke-width="2" stroke-linecap="round" />
    `
  },
  thinking: {
    leftOpen: 0.5, rightOpen: 0.5,
    leftPupilX: 4, leftPupilY: -2,
    rightPupilX: -4, rightPupilY: -2,
    pupilSize: 14, irisColor: '#7928CA', eyeColor: '#1a0a1a',
    extra: `
      <circle cx="190" cy="175" r="3" fill="#B44B8E" />
      <circle cx="200" cy="175" r="3" fill="#B44B8E" />
      <circle cx="210" cy="175" r="3" fill="#B44B8E" />
      <text x="300" y="90" font-size="22" opacity="0.4">⚙️</text>
      <path d="M 130 115 L 155 120" stroke="#B44B8E" stroke-width="3" stroke-linecap="round" />
      <path d="M 270 115 L 245 120" stroke="#B44B8E" stroke-width="3" stroke-linecap="round" />
    `
  },
  mischievous: {
    leftOpen: 0.42, rightOpen: 0.42,
    leftPupilX: 0, leftPupilY: 3,
    rightPupilX: 0, rightPupilY: 3,
    pupilSize: 13, irisColor: '#B44B8E', eyeColor: '#1a0a1a',
    extra: `
      <path d="M 128 128 Q 138 116 148 124" stroke="#B44B8E" stroke-width="3" fill="none" stroke-linecap="round" />
      <circle cx="140" cy="130" r="3" fill="#00D4FF" opacity="0.9" />
      <path d="M 272 128 Q 262 116 252 124" stroke="#B44B8E" stroke-width="3" fill="none" stroke-linecap="round" />
      <circle cx="260" cy="130" r="3" fill="#00D4FF" opacity="0.9" />
      <path d="M 185 168 Q 200 182 215 168" stroke="#B44B8E" stroke-width="3" fill="none" stroke-linecap="round" />
      <path d="M 196 174 L 199 182 L 202 174 Z" fill="#fff" opacity="0.85" />
    `
  },
  sassy: {
    leftOpen: 1.0, rightOpen: 1.0,
    leftPupilX: 0, leftPupilY: -1,
    rightPupilX: 0, rightPupilY: -1,
    pupilSize: 17, irisColor: '#00D4FF', eyeColor: '#1a0a1a',
    extra: `
      <circle cx="145" cy="128" r="4" fill="#fff" opacity="0.9" />
      <circle cx="255" cy="128" r="4" fill="#fff" opacity="0.9" />
      <path d="M 128 112 L 158 116" stroke="#B44B8E" stroke-width="3" stroke-linecap="round" />
      <path d="M 272 112 L 242 116" stroke="#B44B8E" stroke-width="3" stroke-linecap="round" />
      <path d="M 182 168 Q 200 190 218 168" stroke="#B44B8E" stroke-width="4" fill="none" stroke-linecap="round" />
      <path d="M 190 176 L 195 186 L 200 176" fill="#fff" opacity="0.9" />
      <path d="M 206 178 L 211 186 L 216 178" fill="#fff" opacity="0.9" />
    `
  },
  sarcastic: {
    leftOpen: 0.32, rightOpen: 0.32,
    leftPupilX: 2, leftPupilY: 2,
    rightPupilX: -2, rightPupilY: 2,
    pupilSize: 11, irisColor: '#9A8BA8', eyeColor: '#1a0a1a',
    extra: `
      <path d="M 130 118 L 160 112" stroke="#B44B8E" stroke-width="3" stroke-linecap="round" />
      <path d="M 270 118 L 240 112" stroke="#B44B8E" stroke-width="3" stroke-linecap="round" />
      <path d="M 192 166 Q 200 176 208 166" stroke="#B44B8E" stroke-width="3" fill="none" stroke-linecap="round" />
      <ellipse cx="200" cy="236" rx="60" ry="10" fill="#B44B8E" opacity="0.08" />
    `
  },
  strict: {
    leftOpen: 0.85, rightOpen: 0.85,
    leftPupilX: 0, leftPupilY: 0,
    rightPupilX: 0, rightPupilY: 0,
    pupilSize: 15, irisColor: '#ff4d6d', eyeColor: '#1a0a1a',
    extra: `
      <path d="M 132 122 L 160 122" stroke="#ff4d6d" stroke-width="3" stroke-linecap="round" />
      <path d="M 268 122 L 240 122" stroke="#ff4d6d" stroke-width="3" stroke-linecap="round" />
      <path d="M 188 175 L 212 175" stroke="#ff4d6d" stroke-width="3" stroke-linecap="round" />
      <circle cx="200" cy="155" r="34" fill="#ff4d6d" opacity="0.1" />
    `
  },
  fauxcute: {
    leftOpen: 1.0, rightOpen: 1.0,
    leftPupilX: 0, leftPupilY: -3,
    rightPupilX: 0, rightPupilY: -3,
    pupilSize: 20, irisColor: '#B44B8E', eyeColor: '#1a0a1a',
    extra: `
      <circle cx="145" cy="128" r="6" fill="#fff" opacity="0.9" />
      <circle cx="255" cy="128" r="6" fill="#fff" opacity="0.9" />
      <path d="M 128 104 L 162 100" stroke="#FDE2E4" stroke-width="3" stroke-linecap="round" />
      <path d="M 272 104 L 238 100" stroke="#FDE2E4" stroke-width="3" stroke-linecap="round" />
      <circle cx="130" cy="158" r="7" fill="#ffb3c6" opacity="0.5" />
      <circle cx="270" cy="158" r="7" fill="#ffb3c6" opacity="0.5" />
      <path d="M 188 172 Q 200 182 212 172" stroke="#B44B8E" stroke-width="3" fill="none" stroke-linecap="round" />
    `
  }
};

function eyePath(cx: number, cy: number, r: number, open: number) {
  const top = cy - r * open;
  const bottom = cy + r * open;
  return `M ${cx - r} ${top} Q ${cx} ${cy - r * 1.2 * open} ${cx + r} ${top} Q ${cx} ${cy + r * 1.2 * open} ${cx - r} ${bottom} Z`;
}

function drawRobotSVG(emotion: Emotion, blink: boolean, dark: boolean): string {
  const faces = dark ? DARK_FACES : LIGHT_FACES;
  const em = faces[emotion] || faces.happy;

  const leftOpen = blink ? 0.05 : em.leftOpen;
  const rightOpen = blink ? 0.05 : em.rightOpen;
  const eyeY = 135;
  const lx = 145;
  const rx = 255;

  const bodyTop = dark ? '#3a2a4a' : '#fdf6ef';
  const bodyBottom = dark ? '#1a0a22' : '#f5e4d8';
  const bodyColor = dark ? '#2a1a32' : '#f9efe6';
  const bodyStroke = dark ? '#4a2a5a' : '#e8d5cc';
  const screenColor = dark ? '#0a0a12' : '#1a1a2e';
  const glow = dark ? '#B44B8E' : '#c8b0ff';
  const innerStroke = dark ? 'rgba(180,75,142,0.25)' : 'rgba(255,255,255,0.3)';
  const eyeStroke = dark ? '#7928CA' : '#4a4a7a';
  const highlight = dark ? 0.25 : 0.4;
  const glassGlare = dark ? 0.04 : 0.08;
  const glassGlare2 = dark ? 0.03 : 0.05;
  const antennaColor = dark ? '#B44B8E' : '#d4c4b8';
  const antennaTipFill = dark ? '#7928CA' : '#f5c8d0';
  const antennaTipStroke = dark ? '#B44B8E' : '#e8b8c0';
  const antennaShine = dark ? 0.3 : 0.6;

  return `
    <defs>
      <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${dark ? '#2a1a3a' : '#4a4a7a'}" stop-opacity="0.2" />
        <stop offset="100%" stop-color="${dark ? '#0a0a12' : '#2a2a4e'}" stop-opacity="0.5" />
      </linearGradient>
      <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${glow}" stop-opacity="0.35" />
        <stop offset="100%" stop-color="${glow}" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bodyTop}" />
        <stop offset="100%" stop-color="${bodyBottom}" />
      </linearGradient>
    </defs>
    <rect x="60" y="40" width="280" height="260" rx="40" fill="url(#bodyGrad)" stroke="${bodyStroke}" stroke-width="4" />
    <rect x="68" y="48" width="264" height="244" rx="34" fill="none" stroke="${innerStroke}" stroke-width="2" />
    <rect x="80" y="60" width="240" height="200" rx="24" fill="${screenColor}" />
    <rect x="80" y="60" width="240" height="200" rx="24" fill="url(#screenGrad)" opacity="0.4" />
    <ellipse cx="140" cy="85" rx="60" ry="20" fill="white" opacity="${glassGlare}" transform="rotate(-20 140 85)" />
    <ellipse cx="280" cy="230" rx="40" ry="12" fill="white" opacity="${glassGlare2}" transform="rotate(-25 280 230)" />
    <g id="face">
      <circle cx="145" cy="135" r="30" fill="url(#eyeGlow)" />
      <circle cx="255" cy="135" r="30" fill="url(#eyeGlow)" />
      <path d="${eyePath(lx, eyeY, 22, leftOpen)}" fill="${em.eyeColor}" stroke="${eyeStroke}" stroke-width="1.5" />
      <circle cx="${lx + em.leftPupilX}" cy="${eyeY + em.leftPupilY}" r="${em.pupilSize}" fill="${em.irisColor}" opacity="0.9" />
      <circle cx="${lx + em.leftPupilX - 4}" cy="${eyeY + em.leftPupilY - 5}" r="5" fill="white" opacity="${highlight}" />
      <path d="${eyePath(rx, eyeY, 22, rightOpen)}" fill="${em.eyeColor}" stroke="${eyeStroke}" stroke-width="1.5" />
      <circle cx="${rx + em.rightPupilX}" cy="${eyeY + em.rightPupilY}" r="${em.pupilSize}" fill="${em.irisColor}" opacity="0.9" />
      <circle cx="${rx + em.rightPupilX - 4}" cy="${eyeY + em.rightPupilY - 5}" r="5" fill="white" opacity="${highlight}" />
      ${em.extra}
    </g>
    <rect x="160" y="305" width="80" height="12" rx="6" fill="${bodyColor}" stroke="${bodyStroke}" stroke-width="2" />
    <rect x="140" y="318" width="120" height="16" rx="8" fill="${bodyColor}" stroke="${bodyStroke}" stroke-width="2" />
    <line x1="200" y1="40" x2="200" y2="20" stroke="${antennaColor}" stroke-width="3" stroke-linecap="round" />
    <circle cx="200" cy="18" r="6" fill="${antennaTipFill}" stroke="${antennaTipStroke}" stroke-width="1.5" />
    <circle cx="200" cy="18" r="2" fill="white" opacity="${antennaShine}" />
  `;
}

export default function RobotAssistant({ emotion, speechText, className, dark = false }: RobotAssistantProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const currentEmotionRef = useRef(emotion);
  const darkRef = useRef(dark);
  const blinkTimeoutRef = useRef<number | undefined>(undefined);

  currentEmotionRef.current = emotion;
  darkRef.current = dark;

  const draw = useCallback((blink = false) => {
    if (!svgRef.current) return;
    svgRef.current.innerHTML = drawRobotSVG(currentEmotionRef.current, blink, darkRef.current);
  }, []);

  const doBlink = useCallback(() => {
    draw(true);
    if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    blinkTimeoutRef.current = window.setTimeout(() => draw(false), 120);
  }, [draw]);

  useEffect(() => {
    draw(false);
    const blinkInterval = setInterval(doBlink, 4000);
    return () => {
      clearInterval(blinkInterval);
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    };
  }, [draw, doBlink]);

  useEffect(() => {
    draw(false);
    playEmotionSound();
  }, [emotion, draw]);

  useEffect(() => {
    draw(false);
  }, [dark, draw]);

  return (
    <div className={`robot-assistant ${className || ''}`}>
      {speechText && (
        <div className="robot-speech">
          <span className="speech-text">{speechText}</span>
        </div>
      )}
      <div className="robot-card">
        <div className="robot-wrapper">
          <div className="robot-monitor">
            <svg ref={svgRef} className="robot-svg" viewBox="0 0 400 420" />
            <svg className="horns" viewBox="0 0 140 80" aria-hidden="true">
              <path d="M35 70 Q15 30 40 5 Q48 20 50 40 Q42 55 35 70Z" />
              <path d="M105 70 Q125 30 100 5 Q92 20 90 40 Q98 55 105 70Z" />
              <path d="M38 60 Q28 35 42 18 Q46 28 46 45 Q42 55 38 60Z" fill="rgba(255,255,255,0.15)" />
              <path d="M102 60 Q112 35 98 18 Q94 28 94 45 Q98 55 102 60Z" fill="rgba(255,255,255,0.15)" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}