import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NoteDetailContent } from '@/components/notes/NoteDetailContent';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1">
        <NoteDetailContent noteId={Number(id)} />
      </View>
    </SafeAreaView>
  );
}
