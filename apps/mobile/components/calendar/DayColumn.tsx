import { View, Pressable } from 'react-native';
import type { Task } from '@/gen/api/schemas';
import { Text } from '@/components/ui/text';
import { TaskBlock } from './TaskBlock';
import { isToday } from '@/lib/time';

export interface DayColumnProps {
  date: Date;
  tasks: Task[];
  activeTimerTaskIds: Set<string>;
  hourHeight: number;
  columnWidth: number;
  onTaskPress: (task: Task) => void;
  showDayLabel?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DayColumn({
  date,
  tasks,
  activeTimerTaskIds,
  hourHeight,
  columnWidth,
  onTaskPress,
  showDayLabel = false,
}: DayColumnProps) {
  const today = isToday(date);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={{ width: columnWidth }} className="border-l border-border">
      {showDayLabel && (
        <View
          className={`h-10 items-center justify-center border-b border-border ${
            today ? 'bg-primary/10' : ''
          }`}
        >
          <Text className={`text-xs ${today ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
            {dayNames[date.getDay()]}
          </Text>
          <Text className={`text-sm ${today ? 'font-bold text-primary' : ''}`}>
            {date.getDate()}
          </Text>
        </View>
      )}

      <View className="relative">
        {/* Hour grid lines */}
        {HOURS.map((hour) => (
          <View
            key={hour}
            style={{ height: hourHeight }}
            className="border-b border-border/30"
          />
        ))}

        {/* Task blocks */}
        {tasks.map((task) => {
          if (!task.startAt) return null;
          const startTime = new Date(task.startAt);
          const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
          const top = (startMinutes / 60) * hourHeight;
          const duration = 60; // Default 1 hour for display
          const height = (duration / 60) * hourHeight;
          const isActive = activeTimerTaskIds.has(task.id);
          const isCompleted = !!task.completedAt;

          return (
            <TaskBlock
              key={task.id}
              task={task}
              top={top}
              height={Math.max(height, 30)}
              width={columnWidth - 4}
              isActive={isActive}
              isCompleted={isCompleted}
              onPress={() => onTaskPress(task)}
            />
          );
        })}
      </View>
    </View>
  );
}
