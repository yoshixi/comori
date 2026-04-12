import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NoteList } from '@/components/notes/NoteList';

export default function NotesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="flex-1">
        <NoteList />
      </View>
    </SafeAreaView>
  );
}
