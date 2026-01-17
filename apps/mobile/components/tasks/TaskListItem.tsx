import { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Check, Circle, Clock } from 'lucide-react-native';
import { useSWRConfig } from 'swr';
import type { Task, TaskTimer } from '@/gen/api/schemas';
import { usePutApiTasksId, getGetApiTasksKey } from '@/gen/api/endpoints/shuchuAPI.gen';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { useTimer } from '@/hooks/useTimer';
import { formatDate, getRelativeTime } from '@/lib/time';

export interface TaskListItemProps {
  task: Task;
  activeTimer?: TaskTimer;
  onPress: () => void;
}

export function TaskListItem({ task, activeTimer, onPress }: TaskListItemProps) {
  const { mutate } = useSWRConfig();
  const { trigger: updateTask } = usePutApiTasksId(task.id);

  const { formattedTime, isRunning } = useTimer({
    startTime: activeTimer?.startTime,
    isActive: !!activeTimer && !activeTimer.endTime,
  });

  const isCompleted = !!task.completedAt;

  const handleToggleComplete = useCallback(async () => {
    await updateTask({
      completedAt: isCompleted ? null : new Date().toISOString(),
    });
    await mutate(getGetApiTasksKey());
  }, [isCompleted, updateTask, mutate]);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-start gap-3 py-3 px-2 bg-card rounded-lg mb-2 border border-border active:opacity-70"
    >
      <Pressable
        onPress={handleToggleComplete}
        className="mt-1"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {isCompleted ? (
          <View className="h-5 w-5 rounded-full bg-primary items-center justify-center">
            <Check size={12} color="white" />
          </View>
        ) : (
          <Circle size={20} className="text-muted-foreground" />
        )}
      </Pressable>

      <View className="flex-1">
        <Text
          className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {task.description && (
          <Text className="text-sm text-muted-foreground mt-1" numberOfLines={1}>
            {task.description}
          </Text>
        )}

        <View className="flex-row flex-wrap items-center gap-2 mt-2">
          {task.tags.map((tag) => (
            <Badge key={tag.id} label={tag.name} variant="secondary" />
          ))}

          {task.startAt && (
            <View className="flex-row items-center gap-1">
              <Clock size={12} className="text-muted-foreground" />
              <Text className="text-xs text-muted-foreground">
                {getRelativeTime(task.startAt)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {isRunning && (
        <View className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
          <Text className="text-green-700 dark:text-green-300 text-sm font-mono">
            {formattedTime}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
