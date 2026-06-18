/**
 * Sanitize a free-text search term before interpolating it into a PostgREST
 * `.or(...)` / `.ilike(...)` filter string.
 *
 * Supabase's query builder parameterizes VALUES passed as separate arguments
 * (e.g. `.eq('col', value)` or `.ilike('col', value)`), so those are already
 * safe. However, `.or('col.ilike.%term%')` embeds the term directly into the
 * PostgREST filter grammar. Characters like `,` `(` `)` separate/group filter
 * clauses, `%` and `_` are LIKE wildcards, and `"` / `\` can break out of a
 * quoted value — so raw user input here allows "filter injection": a user could
 * alter the query's logic or reference other columns/embedded resources.
 *
 * This is NOT classic SQL injection (PostgREST never executes arbitrary SQL,
 * and RLS still scopes every row to the current user's shop), but stripping the
 * grammar characters removes the injection surface entirely.
 */
export function sanitizeSearchTerm(term: string): string {
  return term
    .replace(/[%,()*\\"_]/g, ' ') // strip PostgREST/LIKE grammar characters
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100) // cap length to avoid abusive queries
}
