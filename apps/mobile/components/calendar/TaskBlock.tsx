import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import type { CalendarTimedItem } from '@/lib/todoCalendar';
import { Text } from '@/components/ui/text';

export interface TaskBlockProps {
  task: CalendarTimedItem;
  top: number;
  height: number;
  width: number;
  /** Left position for lane-based layout */
  left?: number;
  /** Hour height for calculating time from drag offset */
  hourHeight: number;
  isActive: boolean;
  isCompleted: boolean;
  onPress: () => void;
  /** Called when task is dragged to a new time */
  onMove?: (task: CalendarTimedItem, deltaMinutes: number) => void;
}

export function TaskBlock({
  task,
  top,
  height,
  width,
  left = 2,
  hourHeight,
  isActive,
  isCompleted,
  onPress,
  onMove,
}: TaskBlockProps) {
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const scale = useSharedValue(1);

  const bgColor = isActive
    ? 'bg-green-700'
    : isCompleted
      ? 'bg-gray-400'
      : 'bg-primary';

  const handleMove = (deltaY: number) => {
    if (!onMove) return;
    const minutesPerPixel = 60 / hourHeight;
    const deltaMinutes = Math.round((deltaY * minutesPerPixel) / 15) * 15;
    if (deltaMinutes !== 0) {
      onMove(task, deltaMinutes);
    }
  };

  // Tap gesture for opening task detail
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      'worklet';
      runOnJS(onPress)();
    });

  // Long press + pan for dragging
  const panGesture = Gesture.Pan()
    .activateAfterLongPress(200)
    .onStart(() => {
      'worklet';
      isDragging.value = true;
      scale.value = withSpring(1.05);
    })
    .onUpdate((event) => {
      'worklet';
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      'worklet';
      if (Math.abs(event.translationY) > 10) {
        runOnJS(handleMove)(event.translationY);
      }
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      isDragging.value = false;
    })
    .onFinalize(() => {
      'worklet';
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      isDragging.value = false;
    });

  const composed = Gesture.Exclusive(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: isDragging.value ? 100 : 1,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top,
            left,
            height,
            width,
          },
          animatedStyle,
        ]}
        className={`rounded px-2 py-1 ${bgColor}`}
      >
        <Text
          className="text-white text-xs font-medium"
          numberOfLines={height > 40 ? 2 : 1}
        >
          {task.title}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}
