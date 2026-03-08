import { describe, it, expect } from "vitest";
import { QueryBuilder } from "../../utils/queryBuilder.js";

describe("QueryBuilder", () => {
  it("build() with only a base returns just the base SQL", () => {
    const qb = new QueryBuilder("SELECT * FROM users");
    const { text, values } = qb.build();
    expect(text).toBe("SELECT * FROM users");
    expect(values).toEqual([]);
  });

  it("addWhere adds a WHERE clause for a single condition", () => {
    const qb = new QueryBuilder("SELECT * FROM users");
    qb.addWhere("id = 1");
    const { text } = qb.build();
    expect(text).toContain("WHERE id = 1");
  });

  it("multiple addWhere calls are joined with AND", () => {
    const qb = new QueryBuilder("SELECT * FROM users");
    qb.addWhere("role = 'admin'");
    qb.addWhere("is_active = true");
    const { text } = qb.build();
    expect(text).toContain("WHERE role = 'admin' AND is_active = true");
  });

  it("addJoin inserts a JOIN clause before the WHERE block", () => {
    const qb = new QueryBuilder("SELECT * FROM users u");
    qb.addJoin("LEFT JOIN sessions s ON s.user_id = u.id");
    qb.addWhere("u.id = 1");
    const { text } = qb.build();
    const joinIdx = text.indexOf("LEFT JOIN");
    const whereIdx = text.indexOf("WHERE");
    expect(joinIdx).toBeGreaterThanOrEqual(0);
    expect(whereIdx).toBeGreaterThan(joinIdx);
  });

  it("addParam returns sequential placeholders $1, $2, ...", () => {
    const qb = new QueryBuilder("SELECT * FROM t");
    expect(qb.addParam("foo")).toBe("$1");
    expect(qb.addParam("bar")).toBe("$2");
    expect(qb.addParam(42)).toBe("$3");
  });

  it("addParam populates the values array in order", () => {
    const qb = new QueryBuilder("SELECT * FROM t");
    const p1 = qb.addParam("alpha");
    const p2 = qb.addParam(99);
    qb.addWhere(`col1 = ${p1}`);
    qb.addWhere(`col2 = ${p2}`);
    const { values } = qb.build();
    expect(values).toEqual(["alpha", 99]);
  });

  it("build(suffix) appends suffix after WHERE", () => {
    const qb = new QueryBuilder("SELECT * FROM t");
    qb.addWhere("id > 0");
    const { text } = qb.build("ORDER BY id DESC LIMIT 10");
    expect(text).toContain("ORDER BY id DESC LIMIT 10");
    const whereIdx = text.indexOf("WHERE");
    const suffixIdx = text.indexOf("ORDER BY");
    expect(suffixIdx).toBeGreaterThan(whereIdx);
  });

  it("build(suffix) without WHERE still appends suffix", () => {
    const qb = new QueryBuilder("SELECT * FROM t");
    const { text } = qb.build("LIMIT 5");
    expect(text).not.toContain("WHERE");
    expect(text).toContain("LIMIT 5");
  });

  it("addJoin and addWhere return this for fluent chaining", () => {
    const qb = new QueryBuilder("SELECT 1");
    const result = qb.addJoin("LEFT JOIN foo ON true").addWhere("1 = 1");
    expect(result).toBe(qb);
  });

  it("does not emit WHERE keyword when no conditions added", () => {
    const qb = new QueryBuilder("SELECT * FROM t");
    qb.addJoin("LEFT JOIN x ON true");
    const { text } = qb.build("ORDER BY 1");
    expect(text).not.toContain("WHERE");
  });

  it("param placeholders in JOINs and WHEREs reference correct values", () => {
    const qb = new QueryBuilder("SELECT * FROM projects p");
    const staffRef = qb.addParam(5);     // $1 → 5
    const projRef = qb.addParam(10);     // $2 → 10
    qb.addJoin(
      `LEFT JOIN activity_coordinators ac ON ac.staff_id = ${staffRef}`
    );
    qb.addWhere(`p.id = ${projRef}`);
    const { text, values } = qb.build();
    expect(values).toEqual([5, 10]);
    expect(text).toContain("ac.staff_id = $1");
    expect(text).toContain("p.id = $2");
  });
});
