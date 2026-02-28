# Database Migrations Guide

## Overview

This directory contains SQL migration scripts for the Department Record Management System (DRMS). All database schema changes MUST be applied through migration files - the application performs NO runtime schema modifications.

## Migration Philosophy

### ✅ What Migrations Do

- Create tables with proper structure
- Add indexes for performance
- Define foreign key constraints
- Insert initial/reference data
- Track schema version

### ❌ What Application Does NOT Do

- ❌ NO `CREATE TABLE` at runtime
- ❌ NO `ALTER TABLE` at runtime
- ❌ NO `UPDATE` for backfilling at runtime
- ❌ NO `DO $$ ... $$` blocks in application code
- ❌ NO schema checks on startup

## Directory Structure

```
backend/
├── migrations/
│   ├── README.md                    # This file
│   ├── 001_initial_schema.sql       # Initial database setup
│   └── 002_future_changes.sql       # Future migrations (as needed)
└── src/
    └── server.js                    # Only verifies connection, no schema changes
```

---

## 🚀 First Time Setup

### Step 1: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE drms_db;

# Exit psql
\q
```

### Step 2: Run Initial Migration

```bash
# Apply the initial schema
psql -U postgres -d drms_db -f backend/migrations/001_initial_schema.sql
```

**Expected Output:**

```
CREATE TABLE
CREATE TABLE
...
CREATE INDEX
INSERT 0 1
```

### Step 3: Verify Schema Version

```bash
# Check schema version
psql -U postgres -d drms_db -c "SELECT * FROM schema_version;"
```

**Expected Output:**

```
 version |                    description                     |       applied_at
---------+----------------------------------------------------+-------------------------
       1 | Initial schema: All core tables, indexes, and ... | 2026-02-23 10:30:00.123
```

### Step 4: Start Application

```bash
cd backend
npm start
```

**Expected Console Output:**

```
✅ Database connected: drms_db
   Server time: 2026-02-23 10:30:00.123456+00
   Schema version: 1 (Initial schema: All core tables, indexes, and constraints)
   Applied at: 2026-02-23 10:30:00.123
🚀 Server listening on port 5000
   Environment: development
   API Base: http://localhost:5000/api
```

---

## 📋 Migration File Structure

### Template for New Migrations

```sql
-- ============================================================================
-- Migration: <Brief Description>
-- Version: <number>
-- Date: <YYYY-MM-DD>
-- Author: <Your Name>
-- Description: <Detailed explanation of changes>
-- ============================================================================

-- Your schema changes here
CREATE TABLE ...
ALTER TABLE ...
CREATE INDEX ...

-- Record this migration
INSERT INTO schema_version (version, description)
VALUES (<version_number>, '<description>')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
```

### Example: Adding a New Feature

```sql
-- ============================================================================
-- Migration: Add Event Registration Tracking
-- Version: 002
-- Date: 2026-03-01
-- Author: DRMS Team
-- Description: Adds table to track student event registrations
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'registered',
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event
  ON event_registrations(event_id);

CREATE INDEX IF NOT EXISTS idx_event_registrations_user
  ON event_registrations(user_id);

-- Record migration
INSERT INTO schema_version (version, description)
VALUES (2, 'Event registration tracking system')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
```

---

## 🔄 Applying Migrations

### Development Environment

```bash
# Apply specific migration
psql -U postgres -d drms_db -f backend/migrations/002_new_feature.sql

# Verify
psql -U postgres -d drms_db -c "SELECT * FROM schema_version ORDER BY version;"
```

### Production Environment

```bash
# 1. Backup database first!
pg_dump -U postgres drms_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply migration
psql -U production_user -d production_db -f backend/migrations/002_new_feature.sql

# 3. Verify application startup
npm start

# 4. Check logs for schema version confirmation
```

### CI/CD Pipeline

```yaml
# Example GitHub Actions workflow
- name: Apply Database Migrations
  run: |
    psql -U ${{ secrets.DB_USER }} -d ${{ secrets.DB_NAME }} -f backend/migrations/001_initial_schema.sql

- name: Verify Schema Version
  run: |
    psql -U ${{ secrets.DB_USER }} -d ${{ secrets.DB_NAME }} -c "SELECT version FROM schema_version ORDER BY version DESC LIMIT 1;"
```

---

## 🧪 Testing Migrations

### Test on Fresh Database

```bash
# Drop and recreate test database
psql -U postgres -c "DROP DATABASE IF EXISTS drms_test;"
psql -U postgres -c "CREATE DATABASE drms_test;"

# Apply migration
psql -U postgres -d drms_test -f backend/migrations/001_initial_schema.sql

# Test application
DB_NAME=drms_test npm start
```

### Verify Idempotency

Migrations should be safe to run multiple times:

```bash
# Run migration twice - should not error
psql -U postgres -d drms_test -f backend/migrations/001_initial_schema.sql
psql -U postgres -d drms_test -f backend/migrations/001_initial_schema.sql

# Check for errors
echo $?  # Should be 0
```

---

## 📊 Schema Version Management

### Check Current Version

```sql
SELECT version, description, applied_at
FROM schema_version
ORDER BY version DESC
LIMIT 1;
```

### List All Applied Migrations

```sql
SELECT * FROM schema_version ORDER BY version;
```

### Verify Tables Exist

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

## ⚠️ Important Rules

### ✅ DO

1. **Always backup before migrations**

   ```bash
   pg_dump -U postgres drms_db > backup.sql
   ```

2. **Test migrations on staging first**
   - Never apply untested migrations to production
   - Verify with fresh database

3. **Use transactions for complex migrations**

   ```sql
   BEGIN;
   -- Your changes here
   COMMIT;
   ```

4. **Make migrations idempotent**

   ```sql
   CREATE TABLE IF NOT EXISTS ...
   ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...
   ```

5. **Record every migration**
   ```sql
   INSERT INTO schema_version (version, description) VALUES (...);
   ```

### ❌ DO NOT

1. **Never modify existing migration files**
   - Once applied, migrations are immutable
   - Create new migration for changes

2. **Never skip versions**
   - Version 1, 2, 3... sequential
   - No version 1, 3, 5...

3. **Never mix DDL and DML in production**
   - Keep schema changes separate from data changes
   - Use separate migrations if needed

4. **Never add schema logic to application code**
   - No `ALTER TABLE` in server.js
   - No `CREATE TABLE` in controllers

5. **Never deploy without migrations**
   - Migrations must run before app starts
   - Add migration step to deployment pipeline

---

## 🐛 Troubleshooting

### Problem: "Relation does not exist"

**Cause:** Migrations not applied

**Solution:**

```bash
# Check if migration table exists
psql -U postgres -d drms_db -c "\dt schema_version"

# If not, apply initial migration
psql -U postgres -d drms_db -f backend/migrations/001_initial_schema.sql
```

### Problem: "Constraint already exists"

**Cause:** Migration applied multiple times without proper guards

**Solution:** Update migration to use IF NOT EXISTS:

```sql
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
-- Change to:
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS users_email_unique UNIQUE (email);
```

### Problem: Application warns "Schema version table not found"

**Cause:** Fresh database without migrations

**Solution:**

```bash
psql -U postgres -d drms_db -f backend/migrations/001_initial_schema.sql
```

### Problem: Foreign key constraint violation

**Cause:** Data exists that violates new constraint

**Solution:**

```sql
-- Check for orphaned records
SELECT * FROM table_a
WHERE foreign_key_id NOT IN (SELECT id FROM table_b);

-- Clean up before adding constraint
DELETE FROM table_a
WHERE foreign_key_id NOT IN (SELECT id FROM table_b);

-- Then apply migration
```

---

## 📚 Additional Resources

### PostgreSQL Documentation

- [CREATE TABLE](https://www.postgresql.org/docs/current/sql-createtable.html)
- [ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html)

### Migration Best Practices

- [Database Migrations Done Right](https://www.brunton-spall.co.uk/post/2014/05/06/database-migrations-done-right/)
- [Zero-Downtime Migrations](https://stripe.com/blog/online-migrations)

### DRMS Documentation

- [README.md](../../README.md) - Main project documentation
- [QUICKSTART.md](../../MD/QUICKSTART.md) - Quick setup guide

---

## 📞 Support

If you encounter issues with migrations:

1. Check the troubleshooting section above
2. Verify PostgreSQL version compatibility (12+)
3. Review application logs: `npm start`
4. Check database logs: `tail -f /var/log/postgresql/postgresql-*.log`
5. Create an issue with:
   - Migration file being applied
   - Error message
   - PostgreSQL version
   - Database state (schema_version table)

---

**Last Updated:** February 23, 2026  
**Maintainer:** DRMS Development Team
