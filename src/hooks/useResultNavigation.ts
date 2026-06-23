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

  const hotkeyEnabled = enabled && results.length > 0;

  const navigationHotkeyOptions = {
    enabled: hotkeyEnabled,
    preventDefault: true,
    enableOnFormTags: false,
  } as const;

  const selectHotkeyOptions = {
    enabled: hotkeyEnabled,
    preventDefault: true,
    enableOnFormTags: false,
  } as const;

  useHotkeys('ctrl+j, meta+j', () => move(1), navigationHotkeyOptions, [hotkeyEnabled, move]);
  useHotkeys('ctrl+k, meta+k', () => move(-1), navigationHotkeyOptions, [hotkeyEnabled, move]);
  useHotkeys('enter', () => selectCurrent(), selectHotkeyOptions, [hotkeyEnabled, selectCurrent]);

  return {
    selectedIndex: clampedIndex,
    setSelectedIndex,
    selectCurrent,
    moveSelection: move,
  };
}
