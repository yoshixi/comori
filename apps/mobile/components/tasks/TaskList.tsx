import { useCallback, useMemo, useState } from 'react';
import { View, FlatList, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useSWRConfig } from 'swr';
import { useGetApiTasks, useGetApiTimers, getGetApiTasksKey } from '@/gen/api/endpoints/shuchuAPI.gen';
import type { Task, TaskTimer } from '@/gen/api/schemas';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskListItem } from './TaskListItem';
import { TaskFilters, type FilterState, type SortState } from './TaskFilters';
import { InProgressSection } from './InProgressSection';
import { CreateTaskSheet } from './CreateTaskSheet';

export function TaskList() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    showCompleted: false,
    selectedTagIds: [],
  });
  const [sort, setSort] = useState<SortState>({
    sortBy: 'startAt',
    order: 'asc',
  });

  const { data: tasksData, isLoading, error, isValidating } = useGetApiTasks({
    completed: filters.showCompleted ? undefined : 'false',
    tags: filters.selectedTagIds.length > 0 ? filters.selectedTagIds : undefined,
    sortBy: sort.sortBy,
    order: sort.order,
  });

  const { data: timersData } = useGetApiTimers();

  const tasks = tasksData?.tasks ?? [];
  const timers = timersData?.timers ?? [];

  // Find active timers (no endTime)
  const activeTimers = useMemo(() => {
    return timers.filter((timer) => !timer.endTime);
  }, [timers]);

  // Map of taskId to active timer
  const activeTimerByTaskId = useMemo(() => {
    const map: Record<string, TaskTimer> = {};
    activeTimers.forEach((timer) => {
      map[timer.taskId] = timer;
    });
    return map;
  }, [activeTimers]);

  // Tasks with active timers
  const inProgressTasks = useMemo(() => {
    return tasks.filter((task) => activeTimerByTaskId[task.id]);
  }, [tasks, activeTimerByTaskId]);

  // Other tasks
  const otherTasks = useMemo(() => {
    return tasks.filter((task) => !activeTimerByTaskId[task.id]);
  }, [tasks, activeTimerByTaskId]);

  const handleRefresh = useCallback(async () => {
    await mutate(getGetApiTasksKey());
  }, [mutate]);

  const handleTaskPress = useCallback(
    (task: Task) => {
      router.push(`/task/${task.id}`);
    },
    [router]
  );

  const handleCreatePress = useCallback(() => {
    setShowCreateSheet(true);
  }, []);

  const handleCreateClose = useCallback(() => {
    setShowCreateSheet(false);
  }, []);

  const renderTask = useCallback(
    ({ item }: { item: Task }) => (
      <TaskListItem
        task={item}
        activeTimer={activeTimerByTaskId[item.id]}
        onPress={() => handleTaskPress(item)}
      />
    ),
    [activeTimerByTaskId, handleTaskPress]
  );

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-destructive mb-2">Failed to load tasks</Text>
        <Button onPress={handleRefresh}>
          <Text>Retry</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <TaskFilters
        filters={filters}
        sort={sort}
        onFiltersChange={setFilters}
        onSortChange={setSort}
      />

      {isLoading ? (
        <View className="p-4 gap-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </View>
      ) : (
        <FlatList
          data={otherTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isValidating} onRefresh={handleRefresh} />
          }
          ListHeaderComponent={
            inProgressTasks.length > 0 ? (
              <InProgressSection
                tasks={inProgressTasks}
                activeTimerByTaskId={activeTimerByTaskId}
                onTaskPress={handleTaskPress}
              />
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-8">
              <Text className="text-muted-foreground">No tasks yet</Text>
              <Text className="text-muted-foreground text-sm mt-1">
                Tap the + button to create one
              </Text>
            </View>
          }
        />
      )}

      <Pressable
        onPress={handleCreatePress}
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-primary items-center justify-center shadow-lg active:opacity-80"
      >
        <Plus size={24} color="white" />
      </Pressable>

      <CreateTaskSheet visible={showCreateSheet} onClose={handleCreateClose} />
    </View>
  );
}
