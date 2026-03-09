// src/utils/queryBuilder.js

/**
 * Minimal query builder for constructing parameterised PostgreSQL queries.
 *
 * Solves the specific problem of conditionally appending LEFT JOINs and WHERE
 * clauses where parameter indices ($1, $2, …) must stay in sync with the
 * values array. Without this helper, a pattern like
 *
 *   base += ` LEFT JOIN … ac.staff_id = $${params.length + 1}`;
 *   params.push(value);
 *
 * silently breaks the moment any param is inserted above that block, because
 * the look-ahead (`params.length + 1`) is computed before the push.
 *
 * With QueryBuilder, addParam(value) both registers the value AND returns its
 * placeholder in one atomic call — the index can never drift:
 *
 *   const ref = qb.addParam(value);          // "$3" (or whatever is next)
 *   qb.addJoin(`LEFT JOIN t ON t.col = ${ref}`);
 *
 * Usage:
 *   const qb = new QueryBuilder('SELECT … FROM table t LEFT JOIN …');
 *   qb.addWhere(`t.col = ${qb.addParam(value)}`);
 *   qb.addJoin(`LEFT JOIN other o ON o.fk = ${qb.addParam(fkValue)}`);
 *   const { text, values } = qb.build('ORDER BY t.created_at DESC LIMIT $N');
 */
export class QueryBuilder {
  #base;
  #joins = [];
  #conditions = [];
  #params = [];

  /** @param {string} base - The SELECT … FROM … (with any fixed JOINs) */
  constructor(base) {
    this.#base = base;
  }

  /**
   * Register a parameter value and return its SQL placeholder.
   * Always call this before using the placeholder in addJoin / addWhere.
   * @param {unknown} value
   * @returns {string} e.g. "$1", "$2", …
   */
  addParam(value) {
    this.#params.push(value);
    return `$${this.#params.length}`;
  }

  /**
   * Append a conditional JOIN clause.
   * The clause may reference placeholders obtained from addParam().
   * build() always emits all JOINs before the WHERE block.
   * @param {string} sql - e.g. "LEFT JOIN foo f ON f.id = $3"
   */
  addJoin(sql) {
    this.#joins.push(sql);
    return this;
  }

  /**
   * Append a WHERE condition (combined with AND).
   * @param {string} condition - e.g. "t.col = $2" or "t.verified = true"
   */
  addWhere(condition) {
    this.#conditions.push(condition);
    return this;
  }

  /**
   * Assemble and return the final SQL string and parameter array.
   * Layout: <base> [JOINs] [WHERE …] [suffix]
   *
   * @param {string} [suffix] - Trailing SQL (ORDER BY, LIMIT, OFFSET, etc.)
   * @returns {{ text: string, values: unknown[] }}
   */
  build(suffix = "") {
    const parts = [this.#base];
    for (const join of this.#joins) parts.push(join);
    if (this.#conditions.length) {
      parts.push("WHERE " + this.#conditions.join(" AND "));
    }
    if (suffix) parts.push(suffix);
    return { text: parts.join("\n"), values: this.#params };
  }
}
