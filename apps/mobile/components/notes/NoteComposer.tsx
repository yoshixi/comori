import { useState, useCallback } from 'react';
import { View, TextInput } from 'react-native';
import { Text } from '@/components/ui/text';

export interface NoteComposerProps {
  onCreateNote: (text: string) => void;
}

export function NoteComposer({ onCreateNote }: NoteComposerProps) {
  const [text, setText] = useState('');

  const handleSubmit = useCallback(() => {
    if (!text.trim()) return;
    onCreateNote(text.trim());
    setText('');
  }, [text, onCreateNote]);

  return (
    <View className="bg-card border border-border rounded-lg p-3 mb-4">
      <Text className="text-sm font-medium mb-2">Quick Note</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Capture an idea..."
        placeholderTextColor="#9ca3af"
        className="bg-muted px-3 py-2 rounded-md text-foreground native:text-base"
        returnKeyType="done"
        blurOnSubmit
        onSubmitEditing={handleSubmit}
      />
      <Text className="text-xs text-muted-foreground mt-2">
        First line becomes the title
      </Text>
    </View>
  );
}
