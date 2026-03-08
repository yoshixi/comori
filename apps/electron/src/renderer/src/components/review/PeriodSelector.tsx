import React from 'react'

export type ReviewPeriod = 'today' | 'yesterday' | 'week' | '14days'

interface PeriodSelectorProps {
  value: ReviewPeriod
  onChange: (period: ReviewPeriod) => void
}

const periods: { value: ReviewPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: '14days', label: '14 Days' }
]

export function PeriodSelector({ value, onChange }: PeriodSelectorProps): React.JSX.Element {
  return (
    <div className="inline-flex items-center rounded-lg border bg-muted p-0.5 gap-0.5">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            value === p.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
