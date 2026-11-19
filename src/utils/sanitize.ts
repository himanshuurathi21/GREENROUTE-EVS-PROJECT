const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escape user or third-party text before inserting it into an HTML string.
 * Leaflet popups/tooltips accept raw HTML, so every dynamic label must pass
 * through this helper to avoid injecting markup from geocoder results.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPE_MAP[character] ?? character);
}
