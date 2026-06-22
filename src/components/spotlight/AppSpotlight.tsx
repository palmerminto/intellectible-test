'use client';

import { Spotlight, spotlight, type SpotlightActionData } from '@mantine/spotlight';
import { IconFileUpload, IconSearch } from '@tabler/icons-react';

interface AppSpotlightProps {
  onFocusSearch?: () => void;
  onOpenUpload?: () => void;
}

const staticActions = (
  onFocusSearch?: () => void,
  onOpenUpload?: () => void,
): SpotlightActionData[] => [
  {
    id: 'focus-search',
    label: 'Focus search',
    description: 'Jump to the search field',
    leftSection: <IconSearch size={20} stroke={1.5} />,
    onClick: () => {
      onFocusSearch?.();
      spotlight.close();
    },
  },
  {
    id: 'open-upload',
    label: 'Upload PDF',
    description: 'Open the document upload area',
    leftSection: <IconFileUpload size={20} stroke={1.5} />,
    onClick: () => {
      onOpenUpload?.();
      spotlight.close();
    },
  },
];

export function AppSpotlight({ onFocusSearch, onOpenUpload }: AppSpotlightProps) {
  return (
    <Spotlight
      actions={staticActions(onFocusSearch, onOpenUpload)}
      nothingFound="No commands found"
      highlightQuery
      shortcut={['mod + K']}
      searchProps={{
        leftSection: <IconSearch size={20} stroke={1.5} />,
        placeholder: 'Search commands…',
      }}
    />
  );
}
