import { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useGetApiTasks, useGetApiTimers } from '@/gen/api/endpoints/shuchuAPI.gen';
import type { Task, TaskTimer } from '@/gen/api/schemas';
import { Text } from '@/components/ui/text';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarHeader } from './CalendarHeader';
import { DayColumn } from './DayColumn';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import { addDays, startOfDay, isToday } from '@/lib/time';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export type ViewMode = 'day' | 'week';

export function CalendarView() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');

  const { data: tasksData, isLoading: tasksLoading } = useGetApiTasks();
  const { data: timersData } = useGetApiTimers();

  const tasks = tasksData?.tasks ?? [];
  const timers = timersData?.timers ?? [];

  // Get active timers for coloring
  const activeTimerTaskIds = useMemo(() => {
    return new Set(timers.filter((t) => !t.endTime).map((t) => t.taskId));
  }, [timers]);

  // Filter tasks for the selected date(s)
  const filteredTasks = useMemo(() => {
    const start = startOfDay(selectedDate);
    const end =
      viewMode === 'day' ? addDays(start, 1) : addDays(start, 7);

    return tasks.filter((task) => {
      if (!task.startAt) return false;
      const taskStart = new Date(task.startAt);
      return taskStart >= start && taskStart < end;
    });
  }, [tasks, selectedDate, viewMode]);

  // Group tasks by day (for week view)
  const tasksByDay = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    filteredTasks.forEach((task) => {
      if (!task.startAt) return;
      const dayKey = startOfDay(new Date(task.startAt)).toISOString();
      if (!grouped[dayKey]) grouped[dayKey] = [];
      grouped[dayKey].push(task);
    });
    return grouped;
  }, [filteredTasks]);

  const handlePrevious = useCallback(() => {
    setSelectedDate((d) => addDays(d, viewMode === 'day' ? -1 : -7));
  }, [viewMode]);

  const handleNext = useCallback(() => {
    setSelectedDate((d) => addDays(d, viewMode === 'day' ? 1 : 7));
  }, [viewMode]);

  const handleToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const handleTaskPress = useCallback(
    (task: Task) => {
      router.push(`/task/${task.id}`);
    },
    [router]
  );

  const handleToggleViewMode = useCallback(() => {
    setViewMode((m) => (m === 'day' ? 'week' : 'day'));
  }, []);

  if (tasksLoading) {
    return (
      <View className="flex-1 p-4">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-full w-full" />
      </View>
    );
  }

  const days =
    viewMode === 'day'
      ? [selectedDate]
      : Array.from({ length: 7 }, (_, i) => addDays(startOfDay(selectedDate), i));

  return (
    <View className="flex-1">
      <CalendarHeader
        selectedDate={selectedDate}
        viewMode={viewMode}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
        onToggleViewMode={handleToggleViewMode}
      />

      <ScrollView className="flex-1">
        <View className="flex-row">
          {/* Time labels column */}
          <View className="w-12 pt-2">
            {HOURS.map((hour) => (
              <View key={hour} style={{ height: HOUR_HEIGHT }} className="justify-start">
                <Text className="text-xs text-muted-foreground text-right pr-2">
                  {hour.toString().padStart(2, '0')}:00
                </Text>
              </View>
            ))}
          </View>

          {/* Day columns */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-1"
          >
            {days.map((day) => {
              const dayKey = startOfDay(day).toISOString();
              const dayTasks = tasksByDay[dayKey] || [];
              const columnWidth =
                viewMode === 'day'
                  ? SCREEN_WIDTH - 60
                  : Math.max((SCREEN_WIDTH - 60) / 7, 80);

              return (
                <DayColumn
                  key={dayKey}
                  date={day}
                  tasks={dayTasks}
                  activeTimerTaskIds={activeTimerTaskIds}
                  hourHeight={HOUR_HEIGHT}
                  columnWidth={columnWidth}
                  onTaskPress={handleTaskPress}
                  showDayLabel={viewMode === 'week'}
                />
              );
            })}
          </ScrollView>
        </View>

        {/* Current time indicator for today */}
        {days.some((d) => isToday(d)) && (
          <CurrentTimeIndicator
            hourHeight={HOUR_HEIGHT}
            offsetLeft={48}
          />
        )}
      </ScrollView>
    </View>
  );
}
