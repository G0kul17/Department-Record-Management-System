// src/utils/piiRedaction.js
// Strips PII fields from rows served to unauthenticated/anonymous callers.
// Public list/detail endpoints intentionally expose approved records to
// anyone, but must not leak contact details or internal storage identifiers
// in the same response (see VULN-0002).

export function redactFields(row, fields) {
  if (!row) return row;
  const clone = { ...row };
  for (const field of fields) {
    if (field in clone) clone[field] = null;
  }
  return clone;
}

export function redactRows(rows, fields, isAuthenticated) {
  if (isAuthenticated) return rows;
  return rows.map((row) => redactFields(row, fields));
}
