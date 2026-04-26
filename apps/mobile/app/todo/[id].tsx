import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TodoDetailContent } from '@/components/todos/TodoDetailContent';

export default function TodoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const numericId = id != null ? Number(id) : NaN;

  if (id == null || Number.isNaN(numericId)) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1">
        <TodoDetailContent todoId={numericId} />
      </View>
    </SafeAreaView>
  );
}
