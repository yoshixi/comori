import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check, Clock, Plus } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { useTodos } from '@/hooks/useTodos';
import { usePosts } from '@/hooks/usePosts';
import { useTodayPlanLogMode } from '@/hooks/useTodayPlanLogMode';
import type { Todo } from '@/gen/api/schemas';
import { PostRow } from '@/components/posts/PostRow';
import { LogComposerPanel } from '@/components/posts/LogComposerPanel';
import type { PostComposerContext } from '@/lib/postComposerContext';
import { pickRunningTodo } from '@/lib/runningTodo';
import { WeekDayStrip } from '@/components/today/WeekDayStrip';
import { PlanLogToggle } from '@/components/today/PlanLogToggle';
import { PlanComposerSchedule } from '@/components/today/PlanComposerSchedule';
import { dayBoundsUnix, isSameLocalDay, startOfLocalDay } from '@/lib/dayBounds';
import { formatTodoClockTime } from '@/lib/time';
import { getSmartPlanRange, PLAN_DEFAULT_DURATION_MIN } from '@/lib/planDefaultStart';

/** Clock row label — same rules as Electron `TodoView` (start – end, or “No time”). */
function todoScheduleClockLabel(t: Todo): string {
  if (t.starts_at != null) {
    const start = formatTodoClockTime(t.starts_at);
    if (t.ends_at != null) return `${start} – ${formatTodoClockTime(t.ends_at)}`;
    return start;
  }
  return 'No time';
}

function sortTodosForPlan(list: Todo[]): Todo[] {
  return [...list].sort((a, b) => {
    const as = a.starts_at ?? a.created_at;
    const bs = b.starts_at ?? b.created_at;
    return as - bs;
  });
}

export default function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDay, setSelectedDay] = useState(() => startOfLocalDay(new Date()));
  const { mode, setMode } = useTodayPlanLogMode();

  const bounds = useMemo(() => dayBoundsUnix(selectedDay), [selectedDay]);
  const viewingToday = isSameLocalDay(selectedDay, new Date());

  const {
    todos,
    isLoading: todosLoading,
    toggleDone,
    createTodo,
    mutate: mutateTodos,
  } = useTodos({
    from: bounds.from,
    to: bounds.to,
    includeCompletedInRange: false,
  });

  const {
    posts,
    isLoading: postsLoading,
    createPost,
    deletePost,
    mutate: mutatePosts,
  } = usePosts({ from: bounds.from, to: bounds.to });

  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [logComposerContext, setLogComposerContext] = useState<PostComposerContext>(null);
  const prevModeRef = useRef(mode);
  const [todoDraft, setTodoDraft] = useState('');
  const [todoSubmitting, setTodoSubmitting] = useState(false);
  const [planAllDay, setPlanAllDay] = useState(false);
  const [planStartAt, setPlanStartAt] = useState(() => {
    const b = dayBoundsUnix(startOfLocalDay(new Date()));
    return getSmartPlanRange(true, b.from, b.to, [], Date.now(), PLAN_DEFAULT_DURATION_MIN).start;
  });
  const [planEndAt, setPlanEndAt] = useState(() => {
    const b = dayBoundsUnix(startOfLocalDay(new Date()));
    return getSmartPlanRange(true, b.from, b.to, [], Date.now(), PLAN_DEFAULT_DURATION_MIN).end;
  });
  const [refreshing, setRefreshing] = useState(false);

  /** Stable key so SWR identity changes do not reset times; updates when day / today flag / open timed tasks on day change. */
  const planTimeDefaultsKey = useMemo(() => {
    const parts: string[] = [];
    for (const t of todos) {
      if (t.done !== 0) continue;
      if (t.is_all_day === 1) continue;
      if (t.starts_at == null) continue;
      if (t.starts_at < bounds.from || t.starts_at >= bounds.to) continue;
      parts.push(`${t.id}:${t.starts_at}:${t.ends_at ?? ''}`);
    }
    parts.sort();
    return `${bounds.from}:${bounds.to}:${viewingToday ? 1 : 0}:${parts.join('|')}`;
  }, [todos, bounds.from, bounds.to, viewingToday]);

  useEffect(() => {
    const { start, end } = getSmartPlanRange(
      viewingToday,
      bounds.from,
      bounds.to,
      todos,
      Date.now(),
      PLAN_DEFAULT_DURATION_MIN
    );
    setPlanStartAt(start);
    setPlanEndAt(end);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- planTimeDefaultsKey encodes day, viewingToday, and open timed tasks (avoids SWR array identity resets)
  }, [planTimeDefaultsKey]);

  /** API includes unscheduled (`starts_at` null) on every day; scope Plan + header to this calendar day. */
  const dayScopedTodos = useMemo(() => {
    return todos.filter((t) => {
      if (t.starts_at == null) return viewingToday;
      return t.starts_at >= bounds.from && t.starts_at < bounds.to;
    });
  }, [todos, bounds.from, bounds.to, viewingToday]);

  const sortedTodos = useMemo(() => sortTodosForPlan(dayScopedTodos), [dayScopedTodos]);

  const todosForPostHash = useMemo(() => todos.filter((t) => t.done === 0), [todos]);

  const applyRunningTodoContext = useCallback(() => {
    const nowSec = Math.floor(Date.now() / 1000);
    const running = pickRunningTodo(todos, nowSec);
    if (running) {
      setLogComposerContext({ type: 'todo', id: running.id, title: running.title });
    }
  }, [todos]);

  useEffect(() => {
    const enteredLog = prevModeRef.current === 'plan' && mode === 'log';
    prevModeRef.current = mode;
    if (!enteredLog) return;
    applyRunningTodoContext();
  }, [mode, applyRunningTodoContext]);

  const sortedPosts = useMemo(
    () => [...posts].sort((a, b) => b.posted_at - a.posted_at),
    [posts]
  );

  const nextUp = useMemo(() => {
    const open = sortedTodos;
    const timed = open.filter((t) => t.starts_at != null);
    if (timed.length === 0) return open[0] ?? null;
    return timed.sort((a, b) => (a.starts_at ?? 0) - (b.starts_at ?? 0))[0] ?? null;
  }, [sortedTodos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([mutateTodos(), mutatePosts()]);
    setRefreshing(false);
  }, [mutateTodos, mutatePosts]);

  const onSubmitPost = useCallback(async () => {
    const body = draft.trim();
    if (!body) return;
    const eventIds: number[] =
      logComposerContext?.type === 'event' ? [logComposerContext.id] : [];
    const todoIds: string[] =
      logComposerContext?.type === 'todo' ? [logComposerContext.id] : [];
    setSubmitting(true);
    try {
      await createPost(body, eventIds, todoIds);
      setDraft('');
    } finally {
      setSubmitting(false);
    }
  }, [draft, createPost, logComposerContext]);

  const onSubmitPlanTodo = useCallback(async () => {
    const title = todoDraft.trim();
    if (!title) return;
    setTodoSubmitting(true);
    try {
      if (planAllDay) {
        await createTodo(title, bounds.from, undefined, 1);
      } else {
        const startSec = Math.floor(planStartAt.getTime() / 1000);
        let endSec = Math.floor(planEndAt.getTime() / 1000);
        if (endSec <= startSec) {
          endSec = startSec + PLAN_DEFAULT_DURATION_MIN * 60;
        }
        await createTodo(title, startSec, endSec);
      }
      setTodoDraft('');
    } finally {
      setTodoSubmitting(false);
    }
  }, [todoDraft, planAllDay, bounds.from, planStartAt, planEndAt, createTodo]);

  const applyPlanStart = useCallback((date: Date) => {
    setPlanStartAt(date);
    setPlanEndAt((prev) => {
      if (prev.getTime() <= date.getTime()) {
        const next = new Date(date);
        next.setMinutes(next.getMinutes() + PLAN_DEFAULT_DURATION_MIN);
        return next;
      }
      return prev;
    });
  }, []);

  const applyPlanEnd = useCallback(
    (date: Date) => {
      const startMs = planStartAt.getTime();
      if (date.getTime() <= startMs) {
        const next = new Date(planStartAt);
        next.setMinutes(next.getMinutes() + PLAN_DEFAULT_DURATION_MIN);
        setPlanEndAt(next);
      } else {
        setPlanEndAt(date);
      }
    },
    [planStartAt]
  );

  const openTodo = useCallback(
    (t: Todo) => {
      router.push(`/todo/${t.id}`);
    },
    [router]
  );

  const headerTitle = selectedDay.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const statsLine =
    dayScopedTodos.length === 0 && posts.length === 0
      ? 'Nothing on this page yet'
      : `${dayScopedTodos.length} open to-do${dayScopedTodos.length === 1 ? '' : 's'} · ${posts.length} log ${posts.length === 1 ? 'entry' : 'entries'}`;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View className="flex-row items-start justify-between px-4 pt-1 pb-2">
          <View className="min-w-0 flex-1 pr-2">
            <Text className="text-2xl font-semibold text-foreground">{headerTitle}</Text>
            <Text className="mt-1 text-xs text-muted-foreground">{statsLine}</Text>
          </View>
          {!viewingToday ? (
            <Pressable
              onPress={() => setSelectedDay(startOfLocalDay(new Date()))}
              className="rounded-full border border-primary bg-primary/10 px-3 py-1.5"
            >
              <Text className="text-xs font-medium text-primary">Today</Text>
            </Pressable>
          ) : null}
        </View>

        <View className="px-4">
          <WeekDayStrip selected={selectedDay} onSelectDay={setSelectedDay} />
          <PlanLogToggle mode={mode} onChange={setMode} />
        </View>

        {mode === 'plan' ? (
          <View className="flex-1">
            <ScrollView
              className="flex-1 px-4"
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
            >
              {nextUp && viewingToday ? (
                <Pressable
                  onPress={() => openTodo(nextUp)}
                  className="mb-4 rounded-2xl border border-amber-500/40 bg-amber-500/5 px-3 py-3"
                >
                  <Text className="text-[11px] font-medium uppercase tracking-wide text-amber-800">
                    Next up
                  </Text>
                  <View className="mt-1 flex-row flex-wrap items-center gap-2">
                    <Text className="text-base font-medium text-foreground">{nextUp.title}</Text>
                    {nextUp.is_all_day === 1 ? (
                      <Text className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        All day
                      </Text>
                    ) : null}
                  </View>
                  <View className="mt-1 flex-row items-center gap-1">
                    <Clock size={12} className="text-muted-foreground" />
                    <Text className="text-xs tabular-nums text-muted-foreground">
                      {todoScheduleClockLabel(nextUp)}
                    </Text>
                  </View>
                </Pressable>
              ) : null}

              {todosLoading ? (
                <ActivityIndicator className="py-8" />
              ) : sortedTodos.length === 0 ? (
                <Text className="py-6 text-sm text-muted-foreground">
                  No to-dos for this day. Add one below — turn off All day for start/end time.
                  {!viewingToday ? ' Unscheduled items stay on Today only.' : ''}
                </Text>
              ) : (
                <View className="gap-2">
                  {sortedTodos.map((t) => (
                    <View
                      key={t.id}
                      className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
                    >
                      <Pressable
                        onPress={() => void toggleDone(t.id, t.done)}
                        className="h-9 w-9 items-center justify-center rounded-full border border-border"
                      >
                        {t.done === 1 ? <Check size={18} className="text-green-600" /> : null}
                      </Pressable>
                      <Pressable onPress={() => openTodo(t)} className="min-w-0 flex-1">
                        <View className="flex-row flex-wrap items-center gap-2">
                          <Text className="text-sm text-foreground">{t.title}</Text>
                          {t.is_all_day === 1 ? (
                            <Text className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              All day
                            </Text>
                          ) : null}
                        </View>
                        <View className="mt-1 flex-row items-center gap-1">
                          <Clock size={12} className="text-muted-foreground" />
                          <Text className="text-xs tabular-nums text-muted-foreground">
                            {todoScheduleClockLabel(t)}
                          </Text>
                        </View>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View
              className="border-t border-border bg-card px-4 pt-2"
              style={{ paddingBottom: Math.max(insets.bottom, 10) }}
            >
              <View className="flex-row items-center gap-2.5">
                <TextInput
                  value={todoDraft}
                  onChangeText={setTodoDraft}
                  placeholder={
                    viewingToday
                      ? planAllDay
                        ? 'New to-do (all day)…'
                        : 'New to-do…'
                      : planAllDay
                        ? 'All-day on this date…'
                        : 'Timed to-do…'
                  }
                  placeholderTextColor="#9ca3af"
                  className="min-h-[44px] flex-1 rounded-2xl border border-border bg-background px-3.5 py-2.5 text-[15px] leading-5 text-foreground"
                  returnKeyType="done"
                  onSubmitEditing={() => void onSubmitPlanTodo()}
                />
                <Pressable
                  onPress={() => void onSubmitPlanTodo()}
                  disabled={todoSubmitting || !todoDraft.trim()}
                  accessibilityLabel={todoSubmitting ? 'Saving to-do' : 'Add to-do'}
                  className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary disabled:opacity-40"
                >
                  {todoSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Plus size={22} className="text-primary-foreground" strokeWidth={2.5} />
                  )}
                </Pressable>
              </View>

              <PlanComposerSchedule
                dayAnchor={selectedDay}
                allDay={planAllDay}
                onAllDayChange={setPlanAllDay}
                startAt={planStartAt}
                endAt={planEndAt}
                onStartChange={applyPlanStart}
                onEndChange={applyPlanEnd}
              />
            </View>
          </View>
        ) : (
          <View className="flex-1">
            <FlatList
              data={sortedPosts}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={
                postsLoading ? (
                  <ActivityIndicator className="py-4" />
                ) : sortedPosts.length === 0 ? (
                  <Text className="py-4 text-center text-sm text-muted-foreground">
                    No log entries for this day yet.
                  </Text>
                ) : null
              }
              renderItem={({ item }) => (
                <View className="px-4">
                  <PostRow post={item} onDelete={deletePost} />
                </View>
              )}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={{ paddingBottom: 12, flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            />
            <View className="border-t border-border bg-card px-4 pt-3">
              <LogComposerPanel
                draft={draft}
                onDraftChange={setDraft}
                onSubmit={() => void onSubmitPost()}
                submitting={submitting}
                logContext={logComposerContext}
                onLogContextChange={setLogComposerContext}
                todosForSuggestion={todosForPostHash}
                showStatusLine={viewingToday}
                todosForStatus={todos}
                bottomInset={insets.bottom}
              />
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
