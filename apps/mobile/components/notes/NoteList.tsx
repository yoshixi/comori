import { useCallback, useState } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import type { Note } from '@/gen/api/schemas';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useNotesData } from '@/hooks/useNotesData';
import { NoteComposer } from './NoteComposer';
import { NoteListItem } from './NoteListItem';

export function NoteList() {
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);

  const {
    notes,
    notesLoading,
    notesError,
    handleCreateNote,
    handleDeleteNote,
    handleArchiveNote,
    refreshNotes,
  } = useNotesData({ includeArchived: showArchived });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshNotes();
    setIsRefreshing(false);
  }, [refreshNotes]);

  const handleNotePress = useCallback(
    (note: Note) => {
      router.push(`/note/${note.id}`);
    },
    [router]
  );

  const renderNote = useCallback(
    ({ item }: { item: Note }) => (
      <NoteListItem
        note={item}
        onPress={() => handleNotePress(item)}
        onArchive={handleArchiveNote}
        onDelete={handleDeleteNote}
      />
    ),
    [handleNotePress, handleArchiveNote, handleDeleteNote]
  );

  if (notesError) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-destructive mb-2">Failed to load notes</Text>
        <Button onPress={handleRefresh}>
          <Text>Retry</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {notesLoading ? (
        <View className="p-4 gap-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderNote}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListHeaderComponent={
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-lg font-semibold">Notes</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm text-muted-foreground">Archived</Text>
                  <Switch checked={showArchived} onCheckedChange={setShowArchived} />
                </View>
              </View>
              <NoteComposer onCreateNote={handleCreateNote} />
            </View>
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-8">
              <Text className="text-muted-foreground">No notes yet</Text>
              <Text className="text-muted-foreground text-sm mt-1">
                Type above to capture an idea
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
