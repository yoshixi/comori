import { useCallback, useRef, useState } from 'react';
import { View, Pressable, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Archive, Trash2 } from 'lucide-react-native';
import type { Note } from '@/gen/api/schemas';
import { Text } from '@/components/ui/text';
import { getRelativeTime } from '@/lib/time';

const FADE_OUT_DURATION = 300;

export interface NoteListItemProps {
  note: Note;
  onPress: () => void;
  onArchive: (noteId: number) => Promise<void>;
  onDelete: (noteId: number) => Promise<void>;
}

export function NoteListItem({ note, onPress, onArchive, onDelete }: NoteListItemProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const [isHiding, setIsHiding] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const heightAnim = useRef(new Animated.Value(1)).current;

  const isArchived = !!note.archivedAt;

  const animateOut = useCallback(
    (action: () => Promise<void>) => {
      swipeableRef.current?.close();
      setIsHiding(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: FADE_OUT_DURATION,
          useNativeDriver: false,
        }),
        Animated.timing(heightAnim, {
          toValue: 0,
          duration: FADE_OUT_DURATION,
          useNativeDriver: false,
        }),
      ]).start(() => {
        action();
      });
    },
    [fadeAnim, heightAnim]
  );

  const handleArchive = useCallback(() => {
    animateOut(() => onArchive(note.id));
  }, [animateOut, onArchive, note.id]);

  const handleDelete = useCallback(() => {
    animateOut(() => onDelete(note.id));
  }, [animateOut, onDelete, note.id]);

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });
    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.8, 0],
      extrapolate: 'clamp',
    });

    return (
      <Pressable
        onPress={handleArchive}
        className="bg-orange-500 justify-center items-center rounded-lg mb-2 px-6"
      >
        <Animated.View style={{ transform: [{ scale }], opacity }} className="items-center">
          <Archive size={24} color="white" />
          <Text className="text-white text-xs mt-1 font-medium">Archive</Text>
        </Animated.View>
      </Pressable>
    );
  };

  const renderLeftActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0.5, 1],
      extrapolate: 'clamp',
    });
    const opacity = dragX.interpolate({
      inputRange: [0, 50, 100],
      outputRange: [0, 0.8, 1],
      extrapolate: 'clamp',
    });

    return (
      <Pressable
        onPress={handleDelete}
        className="bg-destructive justify-center items-center rounded-lg mb-2 px-6"
      >
        <Animated.View style={{ transform: [{ scale }], opacity }} className="items-center">
          <Trash2 size={24} color="white" />
          <Text className="text-white text-xs mt-1 font-medium">Delete</Text>
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scaleY: heightAnim }],
        marginBottom: heightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-8, 0],
        }),
      }}
    >
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
        onSwipeableOpen={(direction) => {
          if (direction === 'left') handleArchive();
          else handleDelete();
        }}
        overshootRight={false}
        overshootLeft={false}
        friction={2}
        enabled={!isHiding}
      >
        <Pressable
          onPress={onPress}
          disabled={isHiding}
          className={`py-3 px-3 bg-card rounded-lg mb-2 border border-border active:opacity-70 ${isArchived ? 'opacity-50' : ''}`}
        >
          <Text className="font-medium" numberOfLines={1}>
            {note.title}
          </Text>
          {note.content && (
            <Text className="text-sm text-muted-foreground mt-1" numberOfLines={2}>
              {note.content}
            </Text>
          )}
          <Text className="text-xs text-muted-foreground mt-2">
            {getRelativeTime(note.updatedAt)}
          </Text>
        </Pressable>
      </Swipeable>
    </Animated.View>
  );
}
