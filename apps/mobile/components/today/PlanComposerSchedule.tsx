import { useState, useCallback } from 'react';
import { View, Pressable, Modal, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from '@/components/ui/text';
import { Switch } from '@/components/ui/switch';
import { isSameLocalDay } from '@/lib/dayBounds';
import { Clock } from 'lucide-react-native';
import { formatTime, formatDateTime } from '@/lib/time';

function formatPlanRowInstant(d: Date, dayAnchor: Date): string {
  return isSameLocalDay(d, dayAnchor) ? formatTime(d) : formatDateTime(d);
}

/** One-line summary for the time-range chip (same day → short times). */
function summarizeRange(start: Date, end: Date, dayAnchor: Date): string {
  if (isSameLocalDay(start, dayAnchor) && isSameLocalDay(end, dayAnchor)) {
    return `${formatTime(start)} – ${formatTime(end)}`;
  }
  return `${formatPlanRowInstant(start, dayAnchor)} → ${formatPlanRowInstant(end, dayAnchor)}`;
}

type PickerTarget = 'start' | 'end';

export interface PlanComposerScheduleProps {
  dayAnchor: Date;
  allDay: boolean;
  onAllDayChange: (v: boolean) => void;
  startAt: Date;
  endAt: Date;
  onStartChange: (d: Date) => void;
  onEndChange: (d: Date) => void;
}

export function PlanComposerSchedule({
  dayAnchor,
  allDay,
  onAllDayChange,
  startAt,
  endAt,
  onStartChange,
  onEndChange,
}: PlanComposerScheduleProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const [picking, setPicking] = useState<PickerTarget | null>(null);

  const closePicker = useCallback(() => setPicking(null), []);

  const onPickerChange = useCallback(
    (target: PickerTarget, event: { type?: string }, date?: Date) => {
      if (Platform.OS === 'android' && event.type === 'dismissed') {
        closePicker();
        return;
      }
      if (!date) return;
      if (target === 'start') {
        onStartChange(date);
      } else {
        onEndChange(date);
      }
      if (Platform.OS === 'android') {
        closePicker();
      }
    },
    [onStartChange, onEndChange, closePicker]
  );

  const pickerValue = picking === 'start' ? startAt : picking === 'end' ? endAt : startAt;

  return (
    <>
      <View className="mt-2 flex-row items-center justify-between gap-2">
        <View className="flex-shrink-0 flex-row items-center gap-2">
          <Text className="text-xs text-muted-foreground">All day</Text>
          <Switch checked={allDay} onCheckedChange={onAllDayChange} />
        </View>
        {!allDay ? (
          <Pressable
            onPress={() => setPicking('start')}
            accessibilityRole="button"
            accessibilityLabel="Edit start and end time"
            className="max-w-[64%] flex-row items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3 py-2 active:bg-primary/10"
          >
            <Clock size={15} className="text-primary" />
            <Text
              className="text-[13px] font-semibold tabular-nums text-foreground"
              numberOfLines={1}
            >
              {summarizeRange(startAt, endAt, dayAnchor)}
            </Text>
          </Pressable>
        ) : (
          <View className="flex-1" />
        )}
      </View>

      <Modal
        visible={picking !== null}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
      >
        <Pressable
          className="flex-1 justify-end bg-black/45"
          onPress={closePicker}
        >
          <Pressable
            className="rounded-t-3xl bg-card shadow-lg"
            style={{ paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 16) }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
              <Pressable onPress={closePicker} hitSlop={12} className="py-1">
                <Text className="text-base text-muted-foreground">Cancel</Text>
              </Pressable>
              <Text className="text-base font-semibold text-foreground">Time</Text>
              <Pressable onPress={closePicker} hitSlop={12} className="py-1">
                <Text className="text-base font-semibold text-primary">Done</Text>
              </Pressable>
            </View>
            <View className="flex-row justify-center gap-2 border-b border-border px-4 py-2.5">
              <Pressable
                onPress={() => setPicking('start')}
                className={`rounded-full px-4 py-2 ${picking === 'start' ? 'bg-primary/15' : 'bg-muted/50'}`}
              >
                <Text
                  className={`text-sm font-semibold ${picking === 'start' ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  Start
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPicking('end')}
                className={`rounded-full px-4 py-2 ${picking === 'end' ? 'bg-primary/15' : 'bg-muted/50'}`}
              >
                <Text
                  className={`text-sm font-semibold ${picking === 'end' ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  End
                </Text>
              </Pressable>
            </View>
            {picking !== null ? (
              <DateTimePicker
                value={pickerValue}
                mode="datetime"
                display="spinner"
                themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
                onChange={(event, date) => onPickerChange(picking, event, date)}
              />
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
