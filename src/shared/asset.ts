/** Public asset path that respects Vite `base` (e.g. GitHub Pages). */
export function asset(path: string): string {
  const normalized = path.replace(/^\//, "");
  return `${import.meta.env.BASE_URL}${normalized}`;
}
