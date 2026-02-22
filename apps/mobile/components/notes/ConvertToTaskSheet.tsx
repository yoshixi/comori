import { useState, useCallback } from 'react';
import { View, Modal, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { Note } from '@/gen/api/schemas';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/time';

export interface ConvertToTaskSheetProps {
  visible: boolean;
  note: Note | null;
  onClose: () => void;
  onConvert: (noteId: number, schedule?: { startAt?: string; endAt?: string }) => Promise<void>;
}

export function ConvertToTaskSheet({ visible, note, onClose, onConvert }: ConvertToTaskSheetProps) {
  const [startAt, setStartAt] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = useCallback(async (withSchedule: boolean) => {
    if (!note || isConverting) return;
    setIsConverting(true);
    try {
      const schedule = withSchedule && startAt
        ? { startAt: startAt.toISOString() }
        : undefined;
      await onConvert(note.id, schedule);
      setStartAt(null);
      onClose();
    } catch (error) {
      console.error('Failed to convert note:', error);
    } finally {
      setIsConverting(false);
    }
  }, [note, startAt, isConverting, onConvert, onClose]);

  const handleClose = useCallback(() => {
    setStartAt(null);
    onClose();
  }, [onClose]);

  const handleDateChange = useCallback((_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setStartAt(selectedDate);
    }
  }, []);

  if (!note) return null;

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
          <Text className="font-semibold text-lg">Convert to Task</Text>
          <View className="w-6" />
        </View>

        <View className="flex-1 p-4">
          <View className="bg-muted/30 rounded-lg p-4 mb-6">
            <Text className="font-medium" numberOfLines={1}>{note.title}</Text>
            {note.content && (
              <Text className="text-sm text-muted-foreground mt-1" numberOfLines={3}>
                {note.content}
              </Text>
            )}
          </View>

          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2">Schedule (optional)</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm">Start Time</Text>
              <View className="flex-row items-center gap-2">
                {startAt && (
                  <Pressable onPress={() => setStartAt(null)}>
                    <X size={16} className="text-muted-foreground" />
                  </Pressable>
                )}
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  className="flex-row items-center gap-2 bg-muted px-3 py-2 rounded"
                >
                  <Calendar size={14} className="text-muted-foreground" />
                  <Text className="text-sm">
                    {startAt ? formatDateTime(startAt.toISOString()) : 'Set start time'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <View className="p-4 border-t border-border gap-2">
          {startAt && (
            <Button onPress={() => handleConvert(true)} disabled={isConverting}>
              <Text className="text-primary-foreground font-medium">
                {isConverting ? 'Converting...' : 'Convert with Schedule'}
              </Text>
            </Button>
          )}
          <Button
            onPress={() => handleConvert(false)}
            disabled={isConverting}
            variant="outline"
          >
            <Text className="font-medium">
              {isConverting ? 'Converting...' : 'Convert without Schedule'}
            </Text>
          </Button>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={startAt || new Date()}
            mode="datetime"
            display="spinner"
            onChange={handleDateChange}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
