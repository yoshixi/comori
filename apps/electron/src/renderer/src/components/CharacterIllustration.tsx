import React from 'react'
import { cn } from '../lib/utils'

type Mood = 'idle' | 'working' | 'celebrating' | 'resting' | 'encouraging' | 'thinking'
type Size = 'sm' | 'md' | 'lg'

interface CharacterIllustrationProps {
  mood: Mood
  size?: Size
  className?: string
}

const sizeMap: Record<Size, number> = {
  sm: 48,
  md: 80,
  lg: 120
}

const moodAnimations: Record<Mood, string> = {
  idle: 'animate-breathe',
  working: 'animate-gentle-bounce',
  celebrating: 'animate-soft-glow',
  resting: '',
  encouraging: 'animate-breathe',
  thinking: 'animate-breathe'
}

function getExpression(mood: Mood): { eyes: string; mouth: string } {
  switch (mood) {
    case 'idle':
      return { eyes: '• •', mouth: '‿' }
    case 'working':
      return { eyes: '◦ ◦', mouth: '⌒' }
    case 'celebrating':
      return { eyes: '★ ★', mouth: '▽' }
    case 'resting':
      return { eyes: '– –', mouth: '‿' }
    case 'encouraging':
      return { eyes: '◠ ◠', mouth: '◡' }
    case 'thinking':
      return { eyes: '• •', mouth: '~' }
  }
}

export function CharacterIllustration({
  mood,
  size = 'md',
  className
}: CharacterIllustrationProps): React.JSX.Element {
  const px = sizeMap[size]
  const animation = moodAnimations[mood]
  const expression = getExpression(mood)
  const bodyRadius = px * 0.35
  const earSize = px * 0.12
  const faceScale = size === 'sm' ? 0.55 : size === 'md' ? 0.7 : 0.85

  return (
    <div className={cn('inline-flex items-center justify-center', animation, className)}>
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left ear */}
        <circle
          cx={px * 0.5 - bodyRadius * 0.7}
          cy={px * 0.35 - bodyRadius * 0.5}
          r={earSize}
          className="fill-primary/60"
        />
        {/* Right ear */}
        <circle
          cx={px * 0.5 + bodyRadius * 0.7}
          cy={px * 0.35 - bodyRadius * 0.5}
          r={earSize}
          className="fill-primary/60"
        />
        {/* Body */}
        <circle
          cx={px * 0.5}
          cy={px * 0.5}
          r={bodyRadius}
          className="fill-primary/20 stroke-primary/40"
          strokeWidth={1.5}
        />
        {/* Face text */}
        <text
          x={px * 0.5}
          y={px * 0.47}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={px * 0.13 * faceScale}
          fontFamily="sans-serif"
        >
          {expression.eyes}
        </text>
        <text
          x={px * 0.5}
          y={px * 0.58}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={px * 0.15 * faceScale}
          fontFamily="sans-serif"
        >
          {expression.mouth}
        </text>
      </svg>
    </div>
  )
}
