import { View, Pressable } from 'react-native'
import { Text } from '@/components/ui/text'
import type { PlanLogMode } from '@/hooks/useTodayPlanLogMode'

export function PlanLogToggle({
  mode,
  onChange,
}: {
  mode: PlanLogMode
  onChange: (m: PlanLogMode) => void
}) {
  const pill = (m: PlanLogMode, label: string, sub: string) => {
    const on = mode === m
    return (
      <Pressable
        onPress={() => onChange(m)}
        className={`flex-1 rounded-xl border px-3 py-2.5 ${on ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
      >
        <Text className={`text-center text-sm font-semibold ${on ? 'text-primary' : 'text-foreground'}`}>{label}</Text>
        <Text className="mt-0.5 text-center text-[11px] text-muted-foreground">{sub}</Text>
      </Pressable>
    )
  }

  return (
    <View className="mb-4 flex-row gap-2">
      {pill('plan', 'Plan', 'To-dos for this day')}
      {pill('log', 'Log', 'Posts & capture')}
    </View>
  )
}
