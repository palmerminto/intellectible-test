export function isFocusSearchShortcut(
  event: KeyboardEvent | React.KeyboardEvent,
): boolean {
  return (
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    !event.shiftKey &&
    (event.key === '/' || event.code === 'Slash')
  );
}
