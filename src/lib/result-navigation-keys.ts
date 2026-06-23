export function handleResultNavigationKeyDown(
  event: React.KeyboardEvent,
  moveSelection: (delta: number) => void,
): boolean {
  if (!event.ctrlKey && !event.metaKey) {
    return false;
  }

  if (event.key === 'j' || event.key === 'J') {
    event.preventDefault();
    moveSelection(1);
    return true;
  }

  if (event.key === 'k' || event.key === 'K') {
    event.preventDefault();
    moveSelection(-1);
    return true;
  }

  return false;
}
