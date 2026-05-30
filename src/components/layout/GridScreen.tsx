import React from 'react';
import { FlatList, FlatListProps } from 'react-native';
import { Screen } from './Screen';
import { useGridColumns } from '@/utils/grid';

interface GridScreenProps<T> extends Omit<FlatListProps<T>, 'numColumns'> {
  safeArea?: boolean;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  containerClassName?: string;
  defaultColumns?: number;
}

export function GridScreen<T>({
  safeArea = true,
  edges,
  containerClassName = '',
  defaultColumns,
  ...props
}: GridScreenProps<T>) {
  const columns = useGridColumns(defaultColumns);

  return (
    <Screen safeArea={safeArea} edges={edges} className={containerClassName}>
      <FlatList
        initialNumToRender={10}
        windowSize={5}
        maxToRenderPerBatch={5}
        removeClippedSubviews={true}
        {...props}
        key={columns} // Force re-render on column change
        numColumns={columns}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </Screen>
  );
}
