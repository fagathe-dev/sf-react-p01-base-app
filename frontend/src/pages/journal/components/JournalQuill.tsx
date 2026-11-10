import React, { useId } from 'react';
import styled, { keyframes, useTheme } from 'styled-components';

// Trait d'encre redessiné en boucle
const drawWave = keyframes`
  0% { stroke-dashoffset: 400; opacity: 0.2; }
  50% { opacity: 0.9; }
  100% { stroke-dashoffset: 0; opacity: 0.2; }
`;

// La plume suit le trait en oscillant
const floatPen = keyframes`
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(8px, -4px) rotate(4deg); }
  50% { transform: translate(16px, 1px) rotate(-2deg); }
  75% { transform: translate(8px, 5px) rotate(3deg); }
`;

// Respiration de la lueur derrière la plume
const auraGlow = keyframes`
  0%, 100% { transform: scale(0.95); opacity: 0.35; }
  50% { transform: scale(1.15); opacity: 0.7; }
`;

const blink = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`;

const SIZES = { sm: 32, lg: 176 } as const;

const Wrapper = styled.div<{ $size: number }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => Math.round($size * 0.8)}px;
  flex-shrink: 0;
`;

const Aura = styled.span`
  position: absolute;
  width: 75%;
  height: 75%;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primary.base};
  filter: blur(24px);
  opacity: 0.35;
  animation: ${auraGlow} 3.6s ease-in-out infinite alternate;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Svg = styled.svg`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: visible;

  .quill-wave {
    stroke-dasharray: 200;
    animation: ${drawWave} 2.4s cubic-bezier(0.45, 0, 0.55, 1) infinite;
  }

  .quill-pen {
    transform-box: fill-box;
    transform-origin: 30% 70%;
    animation: ${floatPen} 2.4s ease-in-out infinite;
  }

  .quill-ink {
    animation: ${blink} 1.8s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .quill-wave,
    .quill-pen,
    .quill-ink {
      animation: none;
    }

    .quill-wave {
      stroke-dashoffset: 0;
      opacity: 0.6;
    }
  }
`;

// Silhouette de la plume (repère 32 × 36)
const FEATHER_PATH = 'M 28 8 C 22 2, 10 6, 2 16 C 0 20, 2 24, 7 24 L 11 23 L 9 27 C 9 30, 12 33, 16 31 C 26 23, 33 14, 30 8 Z';

interface JournalQuillProps {
  /** `lg` : plume qui écrit, avec trait d'encre et lueur ; `sm` : plume seule, pour un bandeau */
  size?: keyof typeof SIZES;
}

/** Plume animée (SVG + CSS, sans dépendance) : identité visuelle des chargements du journal intime */
export const JournalQuill: React.FC<JournalQuillProps> = ({ size = 'lg' }) => {
  const theme = useTheme();
  const id = useId();
  const featherGradient = `${id}-feather`;
  const inkGradient = `${id}-ink`;
  const { primary } = theme.colors;
  const isLarge = size === 'lg';

  return (
    <Wrapper $size={SIZES[size]} aria-hidden="true">
      {isLarge && <Aura />}
      <Svg viewBox={isLarge ? '0 0 200 160' : '96 46 50 50'} fill="none">
        <defs>
          <linearGradient id={featherGradient} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: primary.dark }} />
            <stop offset="60%" style={{ stopColor: primary.base }} />
            <stop offset="100%" style={{ stopColor: primary.hover }} />
          </linearGradient>
          <linearGradient id={inkGradient} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: primary.base, stopOpacity: 0.05 }} />
            <stop offset="50%" style={{ stopColor: primary.base, stopOpacity: 0.9 }} />
            <stop offset="100%" style={{ stopColor: primary.base, stopOpacity: 0.2 }} />
          </linearGradient>
        </defs>

        {isLarge && (
          <>
            <path
              className="quill-wave"
              d="M 25 115 C 60 95, 80 135, 115 110 C 145 90, 165 125, 185 115"
              stroke={`url(#${inkGradient})`}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle className="quill-ink" cx="115" cy="110" r="3.5" style={{ fill: primary.base }} />
          </>
        )}

        <g transform="translate(100, 48)">
          <g className="quill-pen">
            <path d={FEATHER_PATH} transform="scale(1.3)" fill={`url(#${featherGradient})`} />
            <path d="M 26 12 L 14 24" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.2" strokeLinecap="round" />
            <path
              d="M 5 28 L 2 35 L 9 32"
              style={{ stroke: primary.base }}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>
      </Svg>
    </Wrapper>
  );
};
