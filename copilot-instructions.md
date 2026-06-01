# Copilot Instructions — Dept Records Management

## Stack
- Backend: Node.js (plain JavaScript, no TypeScript), Express 5.x
- Validation: Joi (NOT zod)
- Database: PostgreSQL via pg driver (NO ORM, raw parameterized SQL)
- Logger: Winston via utils/logger.js (NOT console.log)
- Auth: JWT via Bearer header
- Frontend: React 18, Tailwind CSS, daisyui, axios, react-router-dom v6
- State: useState + useContext (NO Zustand, NO Redux)
- Forms: plain React controlled inputs (NO react-hook-form)
- HTTP client: axios via src/api/axiosClient.js (NEVER fetch directly)

## Security Rules — Non Negotiable

### Every route must follow this pattern:
router.post('/path', authMiddleware, authorizeRoles('admin', 'staff'), validateBody(schema), controller);

### Never generate a route without authMiddleware as the first argument.
### Never generate a DELETE, PUT, or PATCH route without both authMiddleware AND authorizeRoles.

### Database queries:
// CORRECT
const result = await db.query('SELECT * FROM students WHERE id = $1', [studentId]);

// WRONG — never do this
const result = await db.query(`SELECT * FROM students WHERE id = ${studentId}`);

### Logging:
// CORRECT
logger.info('Student created', { studentId, createdBy: req.user.id });

// WRONG
console.log('Student created');

### Error handling:
// CORRECT
} catch (err) {
  logger.error('Failed to create student', { err });
  res.status(500).json({ success: false, message: 'Internal server error', code: 'INTERNAL_ERROR' });
}

// WRONG — never expose error details
} catch (err) {
  res.status(500).json({ error: err.message });
}

### API response shape — always use this:
// Success
res.status(200).json({ success: true, data: {} });

// Error
res.status(400).json({ success: false, message: '', code: '' });

### Transactions — always wrap multi-step operations:
try {
  await db.query('BEGIN');
  // operations
  await db.query('COMMIT');
} catch (err) {
  await db.query('ROLLBACK');
  logger.error('Transaction failed', { err });
  res.status(500).json({ success: false, message: 'Internal server error', code: 'INTERNAL_ERROR' });
}

### Never log:
- passwords
- tokens
- session identifiers
- any PII

### Never hardcode:
- secrets
- API keys
- credentials
- URLs or ports

## Frontend Rules

### Every form input must have an associated label:
// CORRECT
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// WRONG
<input type="email" placeholder="Email" />

### Every image must have alt text:
// CORRECT
<img src={photo} alt="Student profile photo" />

// WRONG
<img src={photo} />

### Always handle loading, error, and empty states:
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;
if (!data.length) return <EmptyState />;

### HTTP requests — always use axiosClient:
// CORRECT
import apiClient from '../api/axiosClient';
const response = await apiClient.get('/students');

// WRONG
const response = await fetch('/students');

## Do NOT install these without discussion:
- TypeScript / ts-node
- Prisma
- Zod
- react-hook-form
- Zustand
- express-session

## Safe to install:
- express-rate-limit (add when touching auth endpoints)
-
