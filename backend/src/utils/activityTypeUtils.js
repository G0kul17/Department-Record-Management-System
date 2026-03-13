export class ActivityTypeValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ActivityTypeValidationError";
    this.status = 400;
  }
}

export function normalizeActivityTypeName(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

export async function findActivityTypeByName(db, activityTypeName) {
  const normalized = normalizeActivityTypeName(activityTypeName);
  if (!normalized) return null;

  const { rows } = await db.query(
    `SELECT id, name
       FROM activity_types
      WHERE LOWER(TRIM(name)) = $1
      LIMIT 1`,
    [normalized],
  );

  return rows[0] || null;
}

export async function requireActivityTypeByName(db, activityTypeName, fieldName = "activity_type") {
  const normalized = normalizeActivityTypeName(activityTypeName);
  if (!normalized) {
    throw new ActivityTypeValidationError(`${fieldName} is required`);
  }

  const activityType = await findActivityTypeByName(db, normalized);
  if (!activityType) {
    throw new ActivityTypeValidationError(
      `Invalid ${fieldName}. Use GET /api/activity-coordinators/types for allowed values.`,
    );
  }

  return activityType;
}
