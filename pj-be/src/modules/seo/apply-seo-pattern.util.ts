/**
 * Replace `$token` placeholders in template strings (e.g. `$service`, `$deal_count`).
 * Unknown tokens stay unchanged so typos are visible during QA.
 */
const TOKEN_RE = /\$([a-z][a-z0-9_]*)/gi;

export function applySeoPattern(pattern: string | null | undefined, vars: Record<string, string>): string {
  if (!pattern) return '';
  return pattern.replace(TOKEN_RE, (_, key: string) => {
    const lower = key.toLowerCase();
    const v = vars[lower];
    return v !== undefined ? v : `$${key}`;
  });
}
