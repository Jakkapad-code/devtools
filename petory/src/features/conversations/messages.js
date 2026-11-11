// The API sends UTC timestamps with six fractional digits so this ordering
// matches PostgreSQL's (created_at, id) cursor, even within one millisecond.
export function mergeMessages(existing, incoming) {
  const byId = new Map([...existing, ...incoming].map((message) => [message.id, message]));
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}
