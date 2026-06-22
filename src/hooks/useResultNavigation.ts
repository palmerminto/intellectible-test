'use client';

import { useCallback, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

interface UseResultNavigationOptions<T> {
  results: T[];
  enabled?: boolean;
  onSelect?: (item: T, index: number) => void;
}

export function useResultNavigation<T>({
  results,
  enabled = true,
  onSelect,
}: UseResultNavigationOptions<T>) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const clampedIndex =
    results.length === 0 ? 0 : Math.min(selectedIndex, results.length - 1);

  const move = useCallback(
    (delta: number) => {
      if (results.length === 0) {
        return;
      }

      setSelectedIndex((current) => {
        const next = (current + delta + results.length) % results.length;
        return next;
      });
    },
    [results.length],
  );

  const selectCurrent = useCallback(() => {
    if (results.length === 0) {
      return;
    }

    onSelect?.(results[clampedIndex], clampedIndex);
  }, [clampedIndex, onSelect, results]);

  const hotkeyOptions = {
    enabled: enabled && results.length > 0,
    preventDefault: true,
    enableOnFormTags: false,
  } as const;

  useHotkeys('j', () => move(1), hotkeyOptions, [enabled, move, results.length]);
  useHotkeys('k', () => move(-1), hotkeyOptions, [enabled, move, results.length]);
  useHotkeys('enter', () => selectCurrent(), hotkeyOptions, [
    enabled,
    selectCurrent,
    results.length,
  ]);

  return {
    selectedIndex: clampedIndex,
    setSelectedIndex,
    selectCurrent,
  };
}
