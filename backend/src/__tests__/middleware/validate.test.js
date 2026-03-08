import { describe, it, expect, vi } from "vitest";
import Joi from "joi";
import { validate } from "../../middleware/validate.js";

function makeRes() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

const schema = Joi.object({
  name: Joi.string().min(2).required(),
  age: Joi.number().integer().min(0).optional(),
});

describe("validate middleware", () => {
  it("calls next() and replaces req.body with sanitized value on valid input", () => {
    const middleware = validate(schema);
    const req = { body: { name: "Alice", age: 30 } };
    const res = makeRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ name: "Alice", age: 30 });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 400 with errors array on invalid input", () => {
    const middleware = validate(schema);
    const req = { body: { name: "A" } }; // name too short
    const res = makeRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    const call = res.json.mock.calls[0][0];
    expect(call.message).toBe("Validation failed");
    expect(Array.isArray(call.errors)).toBe(true);
    expect(call.errors.length).toBeGreaterThan(0);
    expect(next).not.toHaveBeenCalled();
  });

  it("collects all validation errors (abortEarly: false)", () => {
    const multiSchema = Joi.object({
      a: Joi.string().required(),
      b: Joi.number().required(),
    });
    const middleware = validate(multiSchema);
    const req = { body: {} }; // both fields missing
    const res = makeRes();
    const next = vi.fn();

    middleware(req, res, next);

    const call = res.json.mock.calls[0][0];
    expect(call.errors.length).toBe(2);
  });

  it("strips unknown fields from req.body (stripUnknown: true)", () => {
    const middleware = validate(schema);
    const req = { body: { name: "Bob", unknown_field: "should be removed" } };
    const res = makeRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).not.toHaveProperty("unknown_field");
    expect(req.body.name).toBe("Bob");
  });

  it("coerces string numbers to numbers (convert: true)", () => {
    const middleware = validate(schema);
    const req = { body: { name: "Carol", age: "25" } }; // age as string
    const res = makeRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body.age).toBe(25); // coerced to number
  });

  it("handles undefined req.body gracefully (defaults to {})", () => {
    const optionalSchema = Joi.object({
      name: Joi.string().optional(),
    });
    const middleware = validate(optionalSchema);
    const req = {}; // no body
    const res = makeRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("error details include field path and message", () => {
    const middleware = validate(schema);
    const req = { body: {} };
    const res = makeRes();
    const next = vi.fn();

    middleware(req, res, next);

    const { errors } = res.json.mock.calls[0][0];
    expect(errors[0]).toHaveProperty("field");
    expect(errors[0]).toHaveProperty("message");
  });
});
