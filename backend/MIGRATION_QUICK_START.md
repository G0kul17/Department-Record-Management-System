# Quick Migration Guide for DRMS

## 🚨 Important: Database migrations are now required!

The application **no longer modifies the database schema at runtime**. You must apply migrations manually before starting the application.

---

## For Existing Installations

If you have an existing DRMS database that was created by the old auto-migration system, your database already has all the tables and should work fine. However, to track schema versions properly:

### Option 1: Add Schema Version Tracking (Recommended)

Run this SQL to add version tracking to your existing database:

```sql
-- Create schema version table
CREATE TABLE IF NOT EXISTS schema_version (
  version INT PRIMARY KEY,
  description VARCHAR(500),
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mark your existing schema as version 1
INSERT INTO schema_version (version, description)
VALUES (1, 'Initial schema: All core tables, indexes, and constraints')
ON CONFLICT (version) DO NOTHING;
```

Execute via psql:

```bash
psql -U postgres -d drms_db -c "CREATE TABLE IF NOT EXISTS schema_version (version INT PRIMARY KEY, description VARCHAR(500), applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); INSERT INTO schema_version (version, description) VALUES (1, 'Initial schema: All core tables, indexes, and constraints') ON CONFLICT (version) DO NOTHING;"
```

### Option 2: Continue Without Version Tracking

Your application will work but will show a warning on startup:

```
⚠️  Schema version table not found. Please run migrations:
```

You can safely ignore this warning if your tables are already created.

---

## For Fresh Installations

### Step 1: Create Database

```bash
psql -U postgres
```

```sql
CREATE DATABASE drms_db;
\q
```

### Step 2: Apply Initial Migration

```bash
cd backend
psql -U postgres -d drms_db -f migrations/001_initial_schema.sql
```

### Step 3: Start Application

```bash
npm start
```

You should see:

```
✅ Database connected: drms_db
   Server time: 2026-02-23 10:30:00...
   Schema version: 1 (Initial schema: All core tables, indexes, and constraints)
   Applied at: 2026-02-23 10:30:00
🚀 Server listening on port 5000
```

---

## Troubleshooting

### Error: "relation 'users' does not exist"

**Cause:** Migrations not applied

**Solution:**

```bash
cd backend
psql -U postgres -d drms_db -f migrations/001_initial_schema.sql
```

### Error: "relation already exists"

**Cause:** Tables already created (probably from old auto-migration system)

**Solutions:**

1. **If you want to keep your data:**
   - Just add schema version tracking (see Option 1 above)
   - Existing tables will work fine

2. **If you want a fresh start:**

   ```bash
   # Backup first!
   pg_dump -U postgres drms_db > backup.sql

   # Drop and recreate
   psql -U postgres -c "DROP DATABASE drms_db;"
   psql -U postgres -c "CREATE DATABASE drms_db;"
   psql -U postgres -d drms_db -f backend/migrations/001_initial_schema.sql
   ```

### Warning: "Schema version table not found"

**Not critical** - means version tracking is not set up, but application will work if tables exist.

**Fix:**

```bash
psql -U postgres -d drms_db -c "CREATE TABLE IF NOT EXISTS schema_version (version INT PRIMARY KEY, description VARCHAR(500), applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); INSERT INTO schema_version (version, description) VALUES (1, 'Initial schema') ON CONFLICT DO NOTHING;"
```

---

## What Changed?

### Before (Old System)

- Server automatically ran `ALTER TABLE` on startup
- Server automatically created tables if missing
- Server ran backfill `UPDATE` queries
- Unpredictable behavior
- Risk of data corruption

### After (New System)

- ✅ Server only reads/writes data
- ✅ Schema changes via migration files
- ✅ Version tracking
- ✅ Predictable deployments
- ✅ Safe production updates

---

## Quick Commands Reference

```bash
# Create database
psql -U postgres -c "CREATE DATABASE drms_db;"

# Apply migration
psql -U postgres -d drms_db -f backend/migrations/001_initial_schema.sql

# Check schema version
psql -U postgres -d drms_db -c "SELECT * FROM schema_version;"

# Backup database
pg_dump -U postgres drms_db > backup_$(date +%Y%m%d).sql

# Drop database (careful!)
psql -U postgres -c "DROP DATABASE drms_db;"
```

---

## Need More Help?

See the full documentation:

- [migrations/README.md](migrations/README.md) - Complete migration guide
- [README.md](../README.md) - Main project documentation

---

**This change improves production stability and follows industry best practices.**
