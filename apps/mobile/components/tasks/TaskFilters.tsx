import { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { SlidersHorizontal, Check, ChevronDown } from 'lucide-react-native';
import { useGetApiTags } from '@/gen/api/endpoints/shuchuAPI.gen';
import { Text } from '@/components/ui/text';
import { Switch } from '@/components/ui/switch';
import { PressableBadge, Badge } from '@/components/ui/badge';

export interface FilterState {
  showCompleted: boolean;
  selectedTagIds: string[];
}

export interface SortState {
  sortBy: 'startAt' | 'createdAt' | 'dueDate';
  order: 'asc' | 'desc';
}

export interface TaskFiltersProps {
  filters: FilterState;
  sort: SortState;
  onFiltersChange: (filters: FilterState) => void;
  onSortChange: (sort: SortState) => void;
}

const SORT_OPTIONS: { value: SortState['sortBy']; label: string }[] = [
  { value: 'startAt', label: 'Start Date' },
  { value: 'createdAt', label: 'Created' },
  { value: 'dueDate', label: 'Due Date' },
];

export function TaskFilters({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
}: TaskFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const { data: tagsData } = useGetApiTags();
  const tags = tagsData?.tags ?? [];

  const handleToggleCompleted = () => {
    onFiltersChange({ ...filters, showCompleted: !filters.showCompleted });
  };

  const handleToggleTag = (tagId: string) => {
    const newSelectedTagIds = filters.selectedTagIds.includes(tagId)
      ? filters.selectedTagIds.filter((id) => id !== tagId)
      : [...filters.selectedTagIds, tagId];
    onFiltersChange({ ...filters, selectedTagIds: newSelectedTagIds });
  };

  const handleSortByChange = (sortBy: SortState['sortBy']) => {
    onSortChange({ ...sort, sortBy });
  };

  const handleOrderToggle = () => {
    onSortChange({ ...sort, order: sort.order === 'asc' ? 'desc' : 'asc' });
  };

  return (
    <View className="border-b border-border">
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable
          onPress={() => setShowFilters(!showFilters)}
          className="flex-row items-center gap-2"
        >
          <SlidersHorizontal size={18} className="text-muted-foreground" />
          <Text className="text-sm text-muted-foreground">Filters</Text>
          <ChevronDown
            size={16}
            className="text-muted-foreground"
            style={{ transform: [{ rotate: showFilters ? '180deg' : '0deg' }] }}
          />
        </Pressable>

        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-muted-foreground">Sort:</Text>
          {SORT_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => handleSortByChange(option.value)}
              className={`px-2 py-1 rounded ${
                sort.sortBy === option.value ? 'bg-primary/10' : ''
              }`}
            >
              <Text
                className={`text-xs ${
                  sort.sortBy === option.value
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
          <Pressable onPress={handleOrderToggle} className="px-1">
            <Text className="text-xs text-primary">{sort.order === 'asc' ? '↑' : '↓'}</Text>
          </Pressable>
        </View>
      </View>

      {showFilters && (
        <View className="px-4 py-3 bg-muted/30">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm">Show completed</Text>
            <Switch
              checked={filters.showCompleted}
              onCheckedChange={handleToggleCompleted}
            />
          </View>

          {tags.length > 0 && (
            <View>
              <Text className="text-sm mb-2">Filter by tags</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {tags.map((tag) => {
                    const isSelected = filters.selectedTagIds.includes(tag.id);
                    return (
                      <PressableBadge
                        key={tag.id}
                        label={tag.name}
                        variant={isSelected ? 'default' : 'outline'}
                        onPress={() => handleToggleTag(tag.id)}
                      />
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
