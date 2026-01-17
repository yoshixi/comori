import { useState, useCallback, useRef } from 'react';
import { View, Modal, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import { useSWRConfig } from 'swr';
import { usePostApiTasks, getGetApiTasksKey } from '@/gen/api/endpoints/shuchuAPI.gen';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface CreateTaskSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateTaskSheet({ visible, onClose }: CreateTaskSheetProps) {
  const { mutate } = useSWRConfig();
  const [title, setTitle] = useState('');
  const { trigger: createTask, isMutating } = usePostApiTasks();

  const handleCreate = useCallback(async () => {
    if (!title.trim()) return;

    try {
      await createTask({ title: title.trim() });
      await mutate(getGetApiTasksKey());
      setTitle('');
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  }, [title, createTask, mutate, onClose]);

  const handleClose = useCallback(() => {
    setTitle('');
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-background"
      >
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <Pressable onPress={handleClose} hitSlop={10}>
            <X size={24} className="text-muted-foreground" />
          </Pressable>
          <Text className="font-semibold text-lg">New Task</Text>
          <View className="w-6" />
        </View>

        <View className="flex-1 p-4">
          <Text className="text-sm text-muted-foreground mb-2">Title</Text>
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder="What needs to be done?"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
        </View>

        <View className="p-4 border-t border-border">
          <Button onPress={handleCreate} disabled={!title.trim() || isMutating}>
            <Text className="text-primary-foreground font-medium">
              {isMutating ? 'Creating...' : 'Create Task'}
            </Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
