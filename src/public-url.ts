/** Public file URL, including Vite `base` so GitHub Pages can serve `/mixor/`. */
export function publicUrl(path: string): string {
  const base = import.meta.env?.BASE_URL ?? "/";
  return `${base}${path.replace(/^\//, "")}`;
}
