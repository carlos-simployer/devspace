export function useListViewport(
  totalItems: number,
  selectedIndex: number,
  viewportHeight: number,
): { startIndex: number; visibleCount: number } {
  let startIndex = 0;
  if (totalItems > viewportHeight) {
    const halfView = Math.floor(viewportHeight / 2);
    if (selectedIndex > halfView) {
      startIndex = Math.min(
        selectedIndex - halfView,
        totalItems - viewportHeight,
      );
    }
  }
  return { startIndex, visibleCount: viewportHeight };
}
