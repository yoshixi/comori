import React, { useEffect, useState } from 'react'
import { CharacterIllustration } from './CharacterIllustration'

interface CompletionCelebrationProps {
  show: boolean
  message?: string
  onComplete?: () => void
}

export function CompletionCelebration({
  show,
  message = 'Nice work!',
  onComplete
}: CompletionCelebrationProps): React.JSX.Element | null {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!show) return
    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, 1500)
    return () => clearTimeout(timer)
  }, [show, onComplete])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <div className="animate-soft-glow rounded-full p-4">
          <CharacterIllustration mood="celebrating" size="lg" />
        </div>
        <p className="text-lg font-semibold text-celebration animate-slide-up">
          {message}
        </p>
      </div>
    </div>
  )
}
