/**
 * A URL as people read it on paper: no scheme, no `www.`, no trailing slash.
 * `https://www.linkedin.com/in/name/` → `linkedin.com/in/name`.
 */
export function displayUrl(url: string): string {
  return url
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");
}
