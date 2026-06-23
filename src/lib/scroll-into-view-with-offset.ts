function isScrollable(element: HTMLElement): boolean {
  const style = getComputedStyle(element);
  const overflowY = style.overflowY;

  return (
    (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
    element.scrollHeight > element.clientHeight + 1
  );
}

function getScrollOffsetTop(element: HTMLElement): number {
  const main = element.closest('main');
  if (main) {
    const paddingTop = parseFloat(getComputedStyle(main).paddingTop);
    if (!Number.isNaN(paddingTop) && paddingTop > 0) {
      return paddingTop;
    }
  }

  return 16;
}

export function scrollIntoViewWithOffset(element: HTMLElement): void {
  const offsetTop = getScrollOffsetTop(element);
  const elementRect = element.getBoundingClientRect();
  const top = Math.max(0, elementRect.top + window.scrollY - offsetTop);

  window.scrollTo({ top, behavior: 'auto' });
  document.documentElement.scrollTop = top;

  let parent = element.parentElement;
  while (parent) {
    if (isScrollable(parent)) {
      const parentRect = parent.getBoundingClientRect();
      parent.scrollTop = Math.max(
        0,
        parent.scrollTop + (elementRect.top - parentRect.top) - offsetTop,
      );
    }

    parent = parent.parentElement;
  }
}

export function focusAndSelectInput(
  input: HTMLInputElement,
  scrollTarget: HTMLElement = input,
): void {
  scrollIntoViewWithOffset(scrollTarget);
  input.focus();
  input.select();
}
