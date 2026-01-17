import { Pressable, View } from 'react-native';
import type { Task } from '@/gen/api/schemas';
import { Text } from '@/components/ui/text';

export interface TaskBlockProps {
  task: Task;
  top: number;
  height: number;
  width: number;
  isActive: boolean;
  isCompleted: boolean;
  onPress: () => void;
}

export function TaskBlock({
  task,
  top,
  height,
  width,
  isActive,
  isCompleted,
  onPress,
}: TaskBlockProps) {
  const bgColor = isActive
    ? 'bg-green-500'
    : isCompleted
      ? 'bg-gray-400'
      : 'bg-primary';

  return (
    <Pressable
      onPress={onPress}
      style={{
        position: 'absolute',
        top,
        left: 2,
        height,
        width,
      }}
      className={`rounded px-2 py-1 active:opacity-70 ${bgColor}`}
    >
      <Text
        className="text-white text-xs font-medium"
        numberOfLines={height > 40 ? 2 : 1}
      >
        {task.title}
      </Text>
      {height > 50 && task.tags.length > 0 && (
        <Text className="text-white/70 text-xs" numberOfLines={1}>
          {task.tags.map((t) => t.name).join(', ')}
        </Text>
      )}
    </Pressable>
  );
}
