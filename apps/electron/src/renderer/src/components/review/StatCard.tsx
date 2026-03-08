import React from 'react'

interface StatCardProps {
  label: string
  value: string
  subtext?: string
}

export function StatCard({ label, value, subtext }: StatCardProps): React.JSX.Element {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold mt-0.5">{value}</div>
      {subtext && <div className="text-xs text-muted-foreground mt-0.5">{subtext}</div>}
    </div>
  )
}
