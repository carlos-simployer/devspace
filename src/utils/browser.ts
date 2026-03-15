export async function openInBrowser(url: string): Promise<void> {
  const { default: open } = await import("open");
  await open(url);
}
