import React from 'react'

interface CharacterIllustrationProps {
  mood?: 'idle' | 'thinking' | 'happy'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = { sm: 'w-12 h-12', md: 'w-16 h-16', lg: 'w-24 h-24' }

export function CharacterIllustration({
  mood = 'idle',
  size = 'md',
  className = ''
}: CharacterIllustrationProps): React.JSX.Element {
  const emoji = mood === 'thinking' ? '\u{1F914}' : mood === 'happy' ? '\u{1F60A}' : '\u{1F4DD}'
  return (
    <div className={`flex items-center justify-center ${sizeMap[size]} ${className}`}>
      <span className="text-3xl">{emoji}</span>
    </div>
  )
}
