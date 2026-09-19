/**
 * Fold a flat list of per-user rows into a map keyed by user id.
 *
 * Lives here rather than in a component because it is meant to run as a React
 * Query `select`: the fold then happens once per cache change instead of once
 * per render, and the grouped object keeps a stable reference in between.
 *
 * Moved out of `family/page.tsx`, where it ran on the server.
 */
export function groupByUser<T extends { user_id: string }>(
  rows: readonly T[] | null | undefined
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {}
  for (const row of rows ?? []) {
    ;(grouped[row.user_id] ??= []).push(row)
  }
  return grouped
}
