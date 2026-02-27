# 📚 Department Record Management System (DRMS)

A comprehensive web-based system for managing department records, including student projects, achievements, faculty activities, events, and announcements. Built with React, Node.js, Express, and PostgreSQL.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.3.1-61dafb)

---

## 🎉 What's New in v1.1.0 (February 2026)

- 👥 **Team Collaboration Enhanced**: Add team members with designated roles (Team Leader/Member)
- 🔒 **Duplicate Prevention**: GitHub URL uniqueness prevents multiple team submissions
- ⭐ **Fair Credit System**: All team members receive credit in leaderboards and project counts
- 🎯 **Event-Linked Achievements**: Track achievements by specific department events
- 🧭 **Improved Navigation**: Fixed admin navbar for seamless section navigation
- 🏆 **Student-Focused Leaderboard**: Streamlined to display only student rankings
- 🎨 **Enhanced UI/UX**: Integrated role dropdowns and responsive form layouts

---

## 🌟 Features

### 🔐 Authentication & Authorization

- **Role-Based Access Control (RBAC)**: Three user roles - Student, Staff, and Admin
- **OTP-Based Authentication**: Secure email-based OTP verification
- **90-Day Session Management**: Login once, no OTP for 90 days
- **Multi-Device Support**: Separate sessions for each device
- **Secure Password Management**: bcrypt hashing with salt rounds

### 👨‍🎓 Student Features

- **Project Submission**: Upload projects with attachments (ZIP files)
  - **Team Collaboration**: Add multiple team members with role designation (Team Leader/Team Member)
  - **Duplicate Prevention**: GitHub URL uniqueness check prevents multiple submissions of same project
  - **Integrated Role Dropdown**: Select team member roles directly in the input field
- **Achievement Management**: Submit achievements with certificates and event photos
  - **Event Linkage**: Achievements can be linked to specific department events
- **Event Registration**: View and register for department events
- **Personal Dashboard**: Track submissions, approvals, and notifications
- **Profile Management**: Update personal information and view stats
- **Leaderboard**: View top achievers based on achievements and projects
  - **Student-Focused**: Displays only student rankings
  - **Team Credit**: All team members receive credit for uploaded projects
  - **My Projects**: View all projects where you are creator or team member

### 👨‍🏫 Staff Features

- **Approval Workflow**: Review and approve/reject student submissions
- **Project Verification**: Verify student projects with feedback
- **Achievement Verification**: Approve achievements with comments
- **Event Management**: Create and manage department events
- **Top Achievers Announcements**: Send targeted announcements to selected students
- **Faculty Activities Management**:
  - Faculty Participation tracking
  - Research publications management
  - Consultancy projects tracking
- **Bulk Export**: Export data to CSV/Excel formats
- **Data Entry**: Upload student records via CSV
- **Report Generation**: Generate comprehensive reports

### 👨‍💼 Admin Features

- **Complete System Access**: All staff features plus administrative controls
- **User Management**: Create, update, and manage users
- **Staff Coordinator Assignment**: Assign activity coordinators
- **Role Management**: View and manage users by role
- **Batch Operations**: Bulk upload students via CSV/Excel
- **System Configuration**: Manage system-wide settings
- **Analytics Dashboard**: View system statistics and insights

### 📊 Data Management

- **CSV/Excel Import**: Bulk upload student data
- **Bulk Export**: Export filtered data in multiple formats
- **File Upload Support**: PDF, images, Office documents, ZIP files
- **Document Management**: Organized file storage with type validation
- **Data Validation**: Comprehensive input validation using Joi

### 📢 Notifications & Announcements

- **Targeted Announcements**: Send announcements to specific users or groups
- **Email Notifications**: Automated email notifications for important events
- **Real-Time Updates**: Instant notification of approval/rejection
- **Brochure Attachments**: Include PDF, images, or documents with announcements

---

## 🏗️ Architecture

### Technology Stack

#### Frontend

- **Framework**: React 18.3.1
- **Routing**: React Router DOM 6.14.1
- **Styling**: Tailwind CSS 3.4 + DaisyUI 4.12
- **HTTP Client**: Axios
- **Build Tool**: Vite 4.5
- **Effects**: React TSParticles (animated backgrounds)
- **File Operations**: XLSX, File-Saver

#### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express 5.1
- **Database**: PostgreSQL 8.16
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcrypt 6.0
- **Email**: Nodemailer 7.0
- **File Upload**: Multer 2.0
- **Data Export**: ExcelJS 4.4, XLSX 0.18
- **Validation**: Joi 18.0
- **Environment**: dotenv 17.2

#### Database

- **PostgreSQL**: Relational database with complex schema
- **Tables**: 20+ tables including users, projects, achievements, events, sessions
- **Indexes**: Optimized queries with strategic indexing
- **Constraints**: Foreign keys, unique constraints, and check constraints

---

## 📁 Project Structure

```
Department-Record-Management-System/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 # PostgreSQL connection
│   │   │   ├── mailer.js             # Email configuration
│   │   │   └── upload.js             # Multer file upload config
│   │   ├── controllers/
│   │   │   ├── authController.js     # Authentication logic
│   │   │   ├── projectController.js  # Projects CRUD
│   │   │   ├── achievementController.js
│   │   │   ├── announcementController.js
│   │   │   ├── eventController.js
│   │   │   ├── staffController.js
│   │   │   ├── adminController.js
│   │   │   └── ... (more controllers)
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # JWT & session validation
│   │   │   └── roleAuth.js           # Role-based access control
│   │   ├── models/
│   │   │   ├── queries.js            # SQL schema
│   │   │   └── queries.sql.pg        # PostgreSQL migrations
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── projectRoutes.js
│   │   │   ├── achievementRoutes.js
│   │   │   ├── staffRoutes.js
│   │   │   ├── adminRoutes.js
│   │   │   └── ... (more routes)
│   │   ├── utils/
│   │   │   ├── sessionUtils.js       # Session management
│   │   │   └── ... (other utilities)
│   │   └── server.js                 # Express app entry point
│   ├── uploads/                       # File upload directory
│   ├── exports/                       # Generated export files
│   ├── package.json
│   └── .env                          # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axiosClient.js        # API client wrapper
│   │   ├── components/
│   │   │   ├── ui/                   # Reusable UI components
│   │   │   └── ... (more components)
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Authentication context
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── student/              # Student pages
│   │   │   ├── staff/                # Staff pages
│   │   │   └── admin/                # Admin pages
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── utils/                    # Utility functions
│   │   ├── app.jsx                   # Main app component
│   │   ├── main.jsx                  # React entry point
│   │   └── index.css                 # Global styles
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── MD/                                # Documentation folder
│   ├── IMPLEMENTATION_SUMMARY.md
│   ├── QUICKSTART.md
│   ├── SESSION_BASED_LOGIN_DOCS.md
│   └── ... (more documentation)
│
└── README.md                          # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **PostgreSQL**: 12.0 or higher
- **Email Account**: For SMTP notifications (Gmail, Outlook, etc.)

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd Department-Record-Management-System
```

#### 2. Database Setup

Create a PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE drms_db;

# Exit psql
\q
```

**Apply database migrations** (REQUIRED):

```bash
# Navigate to backend directory
cd backend

# Apply the initial schema migration
psql -U postgres -d drms_db -f migrations/001_initial_schema.sql
```

This will create all necessary tables, indexes, and constraints. The application **no longer creates tables automatically** at runtime.

> ⚠️ **Important Schema Changes (v1.1.0):**
>
> - Added `event_id` column to `achievements` table (links achievements to events)
> - Updated `projects` table to enforce GitHub URL uniqueness
> - Enhanced team member credit system with name pattern matching
>
> If upgrading from v1.0.0, these changes are included in the migration file.

**Verify migration applied:**

```bash
psql -U postgres -d drms_db -c "SELECT * FROM schema_version;"
```

Expected output:

```
 version |                    description                     |       applied_at
---------+----------------------------------------------------+-------------------------
       1 | Initial schema: All core tables, indexes, and ... | 2026-02-23 10:30:00.123
```

> 📘 **Note:** If you have an existing database from a previous version, see [MIGRATION_QUICK_START.md](backend/MIGRATION_QUICK_START.md) for upgrade instructions.

#### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Configure the `.env` file:

```env
# Database Configuration
DB_USER=postgres
DB_PASS=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=drms_db

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Admin Emails (comma-separated)
ADMIN_EMAILS=admin@example.com

# JWT Secret (use a strong random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# OTP Configuration
OTP_EXPIRY_MIN=5

# File Storage
FILE_STORAGE_PATH=./uploads
FILE_SIZE_LIMIT_MB=50

# Allowed File Types
ALLOWED_FILE_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip,application/vnd.android.package-archive,application/x-msdownload,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation

# Server Port (optional)
PORT=5000
```

Start the backend server:

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The backend will run at `http://localhost:5000`

#### 4. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Create .env file (optional)
# Vite looks for VITE_* prefixed variables
echo "VITE_API_BASE=http://localhost:5000/api" > .env
```

Start the frontend:

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The frontend will run at `http://localhost:5173`

---

## 📖 Usage Guide

### First-Time Setup

1. **Start Both Servers**:
   - Backend: `cd backend && npm start`
   - Frontend: `cd frontend && npm run dev`

2. **Register Admin User**:
   - Visit registration page
   - Use an email that matches `ADMIN_EMAILS` in `.env`
   - Complete OTP verification
   - User will automatically get `admin` role

3. **Login**:
   - First login requires OTP verification
   - Subsequent logins (within 90 days) bypass OTP
   - Sessions are device-specific

### User Registration

#### Student Registration

- Navigate to `/register-student`
- Provide: Name, Email, Roll Number, Department, Year, Section
- Verify email with OTP
- Login with credentials

#### Staff Registration

- Navigate to `/register-staff`
- Provide: Name, Email, Employee ID, Department
- Admin email gets `admin` role automatically
- Verify email with OTP

### Student Workflow

1. **Submit Project**:
   - Dashboard → Upload Project
   - Fill project details (title, description, GitHub URL)
   - **Add Team Members**:
     - Click "Add Team Member" button
     - Enter team member name
     - Select role from dropdown (Team Leader or Team Member)
     - Add multiple team members as needed
   - Attach ZIP file (code/documentation)
   - Submit for approval
   - **Note**: If GitHub URL already exists, system will prevent duplicate submission

2. **Submit Achievement**:
   - Dashboard → My Achievements → Add Achievement
   - Provide achievement details
   - **Optional**: Link to specific event (select from dropdown)
   - Upload certificate and event photos
   - Submit for verification

3. **Register for Events**:
   - Dashboard → Events
   - Browse available events
   - Click to view details and register

4. **View Status**:
   - Check project/achievement status
   - View feedback from staff
   - Track approval timeline
   - **My Projects**: View all projects where you're creator or team member

5. **Track Performance**:
   - View leaderboard (student rankings only)
   - Check your achievements count
   - See project count (includes team projects)

### Staff Workflow

1. **Approve Projects**:
   - Dashboard → Verify Projects
   - Review project details
   - Approve or reject with comments
   - Approved projects appear in public list

2. **Verify Achievements**:
   - Dashboard → Verify Achievements
   - Review certificates and photos
   - Approve or reject
   - Update student achievement records

3. **Create Events**:
   - Dashboard → Events Management
   - Create new event with details
   - Upload event thumbnail
   - Attach event documents
   - Publish for student registration

4. **Send Announcements**:
   - Dashboard → Top Achievers Announcement
   - Select target users from leaderboard
   - Compose announcement
   - Attach brochure (optional)
   - Send to selected recipients

5. **Manage Faculty Activities**:
   - Record faculty participation in events
   - Track research publications
   - Manage consultancy projects
   - Generate activity reports

### Admin Workflow

1. **Manage Users**:
   - Dashboard → Users Management
   - View all users by role
   - Update user information
   - Manage user status

2. **Assign Coordinators**:
   - Dashboard → Staff Coordinators
   - Assign activity coordination roles
   - Track coordinator activities

3. **Bulk Operations**:
   - Dashboard → Batch Upload Students
   - Download CSV template
   - Upload student data in bulk
   - System creates accounts automatically

4. **Generate Reports**:
   - Dashboard → Report Generator
   - Select report type
   - Apply filters (date range, department, etc.)
   - Export as CSV or Excel

---

## 🔒 Security Features

### Authentication

- ✅ JWT-based authentication with secure token generation
- ✅ 90-day session management with automatic expiration
- ✅ OTP verification for initial login
- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ Session token stored separately from JWT

### Authorization

- ✅ Role-Based Access Control (RBAC)
- ✅ Middleware-enforced route protection
- ✅ Role-specific UI rendering
- ✅ API endpoint access control

### Data Protection

- ✅ SQL injection prevention via parameterized queries
- ✅ Input validation with Joi schemas
- ✅ CORS configuration for allowed origins
- ✅ File type validation on uploads
- ✅ File size limits (configurable, default 50MB)

### Session Security

- ✅ Cryptographically secure session tokens (64 chars)
- ✅ Device fingerprinting (User-Agent, IP tracking)
- ✅ Automatic session cleanup for expired sessions
- ✅ Logout invalidates all user sessions
- ✅ Session extension on active use

---

## 📊 Database Schema

### Core Tables

#### users

- Primary user table with authentication data
- Columns: id, full_name, email, password_hash, role, department, etc.
- Roles: student, staff, admin

#### user_sessions

- Session management for 90-day login
- Columns: id, user_id, session_token, expires_at, device_info
- Auto-cleanup of expired sessions

#### projects

- Student project submissions
- Columns: id, title, description, student_id, github_url, team_member_names, status, files
- Status: pending, approved, rejected
- Team members stored with roles: "Name (Team Leader)", "Name (Team Member)"
- GitHub URL enforced as unique to prevent duplicate team submissions

#### achievements

- Student achievement records
- Columns: id, title, description, student_id, event_id, certificate, status
- Linked to users via foreign key
- Linked to events via event_id for tracking event-based achievements

#### events

- Department events and activities
- Columns: id, title, description, date, venue, created_by
- Staff and admin can create events

#### staff_announcements

- Targeted announcements to users
- Columns: id, title, message, brochure_file_id, created_by
- Many-to-many relationship with recipients

#### faculty_participation

- Faculty event participation tracking
- Columns: id, staff_id, event_type, event_name, date, proof

#### faculty_research

- Research publication records
- Columns: id, staff_id, title, journal, publication_date, scopus_indexed

#### faculty_consultancy

- Consultancy project tracking
- Columns: id, staff_id, project_name, client, amount, status

### Relationships

```
users
  ├─ 1:N → projects (student submissions)
  ├─ 1:N → achievements (student achievements)
  ├─ 1:N → events (created events)
  ├─ 1:N → user_sessions (login sessions)
  ├─ 1:N → staff_announcements (sent announcements)
  ├─ 1:N → faculty_participation
  ├─ 1:N → faculty_research
  └─ 1:N → faculty_consultancy

staff_announcements
  └─ N:M → users (via staff_announcement_recipients)

events
  ├─ N:M → users (via event_registrations)
  └─ 1:N → achievements (event-linked achievements)

projects
  └─ N:M → users (via team_member_names field with pattern matching)
```

---

## 👥 Team Project System

### Overview

The system supports collaborative team projects with the following features:

### Key Features

#### 1. Team Member Role Management

- **Team Leader**: Primary project owner who uploads the project
- **Team Member**: Additional contributors to the project
- Each team member can have a designated role
- Roles are displayed with names: "John Doe (Team Leader)", "Jane Smith (Team Member)"

#### 2. Duplicate Prevention

- **GitHub URL Uniqueness**: Prevents multiple uploads of the same project
- When a team member attempts to upload a project with an existing GitHub URL:
  - System returns a 409 Conflict error
  - Displays existing project details (title, uploader, team members)
  - Shows user-friendly message: "Your team has already uploaded this project"
- Ensures only one submission per team project

#### 3. Team Credit Distribution

- **Leaderboard Credit**: All team members receive credit for the project
  - Creator gets credit automatically (via `created_by` field)
  - Team members get credit via name matching in `team_member_names` field
  - Uses case-insensitive LIKE pattern matching
- **My Projects Filter**: Shows projects where user is:
  - The original uploader (creator), OR
  - Listed as a team member
- **Fair Recognition**: Ensures all contributors are recognized in rankings

#### 4. Implementation Details

**Database Schema:**

```sql
-- projects table includes:
github_url VARCHAR(255) UNIQUE NOT NULL,  -- Enforces uniqueness
team_member_names TEXT,                    -- Stores: "Name1 (Role1), Name2 (Role2)"
created_by INTEGER REFERENCES users(id)    -- Original uploader
```

**Backend Validation:**

```javascript
// Check for existing project with same GitHub URL
const existingProject = await pool.query(
  "SELECT id, title, team_member_names FROM projects WHERE LOWER(TRIM(github_url)) = LOWER(TRIM($1))",
  [github_url],
);

if (existingProject.rows.length > 0) {
  return res.status(409).json({
    message: "Your team has already uploaded this project...",
    existingProject: existingProject.rows[0],
  });
}
```

**Leaderboard Query:**

```sql
-- Credit all team members in project counts
LEFT JOIN projects p ON (
  (p.created_by = u.id OR LOWER(p.team_member_names) LIKE LOWER('%' || u.full_name || '%'))
  AND p.verified = true
)
COUNT(DISTINCT p.id) as project_count
```

**Frontend UI:**

- Integrated dropdown for role selection within team member input field
- Responsive design: stacked layout on mobile, inline on desktop
- Real-time validation and error display
- Clear error messages for duplicate submissions

### Usage Example

1. **Student A uploads a project:**
   - Title: "E-Commerce Website"
   - GitHub URL: "https://github.com/team/ecommerce"
   - Team Members:
     - Student A (Team Leader)
     - Student B (Team Member)
     - Student C (Team Member)

2. **Student B attempts to upload the same project:**
   - Enters same GitHub URL: "https://github.com/team/ecommerce"
   - System detects duplicate and shows error
   - Error message includes existing project details
   - Upload is prevented

3. **Leaderboard & Credits:**
   - Student A: Gets credit (uploaded the project)
   - Student B: Gets credit (name in team_member_names)
   - Student C: Gets credit (name in team_member_names)
   - All three students' project counts increase by 1

4. **My Projects View:**
   - Student A sees the project (creator)
   - Student B sees the project (team member)
   - Student C sees the project (team member)

---

## 🌐 API Endpoints

### Authentication (`/api/auth`)

```
POST   /auth/register-student    # Student registration
POST   /auth/register-staff      # Staff registration
POST   /auth/login               # Login (sends OTP or validates session)
POST   /auth/login-verify        # OTP verification
POST   /auth/logout              # Logout (invalidates sessions)
POST   /auth/forgot-password     # Password reset request
POST   /auth/reset-password      # Password reset with token
GET    /auth/me                  # Get current user profile
```

### Projects (`/api/projects`)

```
GET    /api/projects               # List all approved projects
GET    /api/projects/my            # List user's projects (as creator or team member)
GET    /api/projects/:id           # Get project details
POST   /api/projects               # Create new project (checks GitHub URL uniqueness)
PUT    /api/projects/:id           # Update project
DELETE /api/projects/:id           # Delete project

Query Parameters:
  - mine=true                      # Filter to show only user's projects (creator or team member)

Response Codes:
  - 409 Conflict                   # GitHub URL already exists (duplicate project)
```

### Achievements (`/api/achievements`)

```
GET    /api/achievements               # List all approved achievements
GET    /api/achievements/my            # List user's achievements
GET    /api/achievements/leaderboard   # Top achievers leaderboard
GET    /api/achievements/:id           # Get achievement details
POST   /api/achievements               # Submit new achievement
PUT    /api/achievements/:id           # Update achievement
DELETE /api/achievements/:id           # Delete achievement

Query Parameters (leaderboard):
  - type=achievements|projects         # Filter by category
  - role=student                       # Fixed to student role
  - limit=10                           # Number of top achievers to return

Leaderboard Features:
  - Students only (no staff rankings)
  - Team members credited for projects
  - Sorted by achievement/project count
```

### Events (`/api/events`, `/api/events-admin`)

```
GET    /api/events                     # Public events list
GET    /api/events/:id                 # Event details
POST   /api/staff/events               # Create event (staff/admin)
PUT    /api/staff/events/:id           # Update event
DELETE /api/staff/events/:id           # Delete event
```

### Staff Operations (`/api/staff`)

```
GET    /api/staff/dashboard            # Staff dashboard stats
POST   /api/staff/projects/:id/approve # Approve project
POST   /api/staff/projects/:id/reject  # Reject project
POST   /api/staff/achievements/:id/approve
POST   /api/staff/achievements/:id/reject
POST   /api/staff/announcements        # Send announcement
```

### Admin Operations (`/api/admin`)

```
GET    /api/admin/users                # List all users
GET    /api/admin/users/:role          # List users by role
POST   /api/admin/users                # Create user
PUT    /api/admin/users/:id            # Update user
DELETE /api/admin/users/:id            # Delete user
POST   /api/admin/coordinators         # Assign coordinator
```

### Bulk Operations

```
POST   /api/students/batch-upload      # Bulk upload students (CSV/Excel)
GET    /api/bulk-export/:type          # Export data (CSV/Excel)
```

---

## 🎨 UI Features

### Design System

- **Framework**: Tailwind CSS utility-first styling
- **Component Library**: DaisyUI for pre-built components
- **Theme**: Modern, clean interface with consistent color palette
- **Responsive**: Mobile-first design, works on all screen sizes
- **Animations**: Smooth transitions and interactive elements

### Key UI Components

- **Dashboard Cards**: Statistics and quick actions
- **Data Tables**: Sortable, filterable tables for data display
- **Forms**: Validated forms with real-time feedback
- **Modals**: Confirmation dialogs and detail views
- **Toast Notifications**: Success/error feedback
- **File Upload**: Drag-and-drop file upload zones
- **Search & Filters**: Advanced filtering for large datasets

---

## 🧪 Testing

### Manual Testing Checklist

#### Authentication Flow

- [ ] Student registration with OTP
- [ ] Staff registration with OTP
- [ ] First login (requires OTP)
- [ ] Second login (bypasses OTP if within 90 days)
- [ ] Login from different browser/device (requires OTP)
- [ ] Logout functionality
- [ ] Password reset flow

#### Student Features

- [ ] Submit project with file upload
- [ ] Add multiple team members with role selection (Team Leader/Team Member)
- [ ] Verify GitHub URL uniqueness validation (duplicate prevention)
- [ ] Confirm team members receive credit in leaderboard
- [ ] Check "My Projects" shows projects as creator and team member
- [ ] Submit achievement with certificate
- [ ] Link achievement to event (event_id selection)
- [ ] View project/achievement status
- [ ] Edit pending submissions
- [ ] View approved projects/achievements
- [ ] Register for events
- [ ] View student-only leaderboard (Achievements/Projects categories)

#### Staff Features

- [ ] Approve/reject projects with comments
- [ ] Approve/reject achievements
- [ ] Create events with attachments
- [ ] Send announcements to selected users
- [ ] Upload faculty participation records
- [ ] Add research publications
- [ ] Track consultancy projects
- [ ] Export data to CSV/Excel

#### Admin Features

- [ ] View all users by role
- [ ] Create/update/delete users
- [ ] Assign activity coordinators
- [ ] Bulk upload students via CSV
- [ ] Generate comprehensive reports
- [ ] View system statistics

### Testing Commands

```bash
# Backend tests (if implemented)
cd backend
npm test

# Frontend tests (if implemented)
cd frontend
npm test

# Linting
npm run lint
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Ensure PostgreSQL is running and credentials in `.env` are correct.

```bash
# Start PostgreSQL (Ubuntu/Debian)
sudo service postgresql start

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql

# Start PostgreSQL (Windows)
# Run via Services or pg_ctl start
```

#### 2. Email Not Sending

```
Error: Invalid login
```

**Solution**:

- For Gmail: Enable "Less secure app access" or use App Password
- For Outlook: Ensure SMTP is enabled
- Check `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` in `.env`

#### 3. File Upload Error

```
Error: File type not allowed
```

**Solution**: Check `ALLOWED_FILE_TYPES` in `.env` and ensure file type is included.

#### 4. Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution**:

```bash
# Find process using port
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Mac/Linux

# Kill process
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # Mac/Linux
```

#### 5. CORS Error

```
Access-Control-Allow-Origin header error
```

**Solution**: Add your frontend URL to CORS whitelist in `backend/src/server.js`:

```javascript
cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    // Add your URL here
  ],
});
```

#### 6. Session Not Working

**Solution**:

- Check `user_sessions` table exists in database
- Verify `sessionUtils.js` is in `backend/src/utils/`
- Ensure session token is stored in localStorage
- Check browser console for `x-session-token` header

#### 7. Team Project Upload Fails with Duplicate Error

```
Error: Your team has already uploaded this project
```

**Solution**:

- This is expected behavior - GitHub URL must be unique
- Check with your team members if someone already uploaded the project
- Verify the GitHub URL is correct and unique to your project
- If you need to update the project, ask the original uploader to edit it
- All team members listed will automatically receive credit

#### 8. Team Member Not Receiving Credit

**Symptoms**: Team member's name appears in project but not counted in leaderboard

**Solution**:

- Ensure the exact name in the team member list matches the user's `full_name` in the database
- Name matching is case-insensitive but must match exactly (including spaces)
- Check the team member's name was saved correctly during upload
- Format should be: "John Doe (Team Leader)", "Jane Smith (Team Member)"
- Database query uses LIKE pattern: `LOWER(team_member_names) LIKE LOWER('%John Doe%')`

#### 9. Admin Navbar Not Scrolling

**Solution**:

- Ensure you're on the `/admin` page before scrolling
- The navbar now automatically navigates to admin page before scrolling
- Clear browser cache if experiencing issues
- Check browser console for JavaScript errors

---

## 📦 Deployment

### Production Checklist

#### Backend

- [ ] Set strong `JWT_SECRET` in production
- [ ] Update `ADMIN_EMAILS` for production admins
- [ ] Configure production database credentials
- [ ] Set up SSL/TLS for database connections
- [ ] Configure production email service (SendGrid, SES, etc.)
- [ ] Set appropriate `FILE_SIZE_LIMIT_MB`
- [ ] Enable HTTPS
- [ ] Set up log management (Winston, Morgan, etc.)
- [ ] Configure process manager (PM2)
- [ ] Set up reverse proxy (Nginx)

#### Frontend

- [ ] Update `VITE_API_BASE` to production API URL
- [ ] Build production bundle: `npm run build`
- [ ] Configure CDN for static assets
- [ ] Enable gzip compression
- [ ] Set up CI/CD pipeline
- [ ] Configure environment-specific builds

#### Database

- [ ] Run migrations on production database
- [ ] Set up database backups (automated)
- [ ] Configure connection pooling
- [ ] Optimize indexes for production queries
- [ ] Set up monitoring and alerting

#### Security

- [ ] Enable HTTPS/TLS everywhere
- [ ] Set secure HTTP headers (Helmet.js)
- [ ] Implement rate limiting (express-rate-limit)
- [ ] Set up WAF (Web Application Firewall)
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning

### Deployment Scripts

#### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start src/server.js --name drms-backend

# Start with ecosystem file
pm2 start ecosystem.config.js

# View logs
pm2 logs drms-backend

# Monitor
pm2 monit

# Restart
pm2 restart drms-backend

# Enable startup script
pm2 startup
pm2 save
```

#### Using Docker (Optional)

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
```

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.yml
version: "3.8"
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: drms_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASS}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
    volumes:
      - ./backend/uploads:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres-data:
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a Pull Request

### Code Standards

- Follow existing code style (eslint configuration)
- Write descriptive commit messages
- Add comments for complex logic
- Update documentation for API changes
- Test thoroughly before submitting PR

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:

```
feat(auth): add 90-day session management

- Implemented session table in database
- Added session utilities for token generation
- Updated login flow to check existing sessions
- Added logout endpoint to invalidate sessions

Closes #123
```

---

## 📝 License

This project is licensed under the ISC License.

---

## 👥 Authors & Contributors

- **Development Team**: Department Record Management System Team
- **Maintainer**: [Your Name/Team]
- **Contact**: [your-email@example.com]

---

## 🙏 Acknowledgments

- React team for the excellent frontend framework
- Express.js for the robust backend framework
- PostgreSQL for reliable database management
- All open-source contributors whose libraries made this project possible

---

## 📚 Additional Documentation

For more detailed documentation, see the `MD/` folder:

- [**QUICKSTART.md**](MD/QUICKSTART.md) - Quick setup guide
- [**SESSION_BASED_LOGIN_DOCS.md**](MD/SESSION_BASED_LOGIN_DOCS.md) - Session system documentation
- [**IMPLEMENTATION_SUMMARY.md**](MD/IMPLEMENTATION_SUMMARY.md) - Implementation details
- [**VISUAL_ARCHITECTURE.md**](MD/VISUAL_ARCHITECTURE.md) - System architecture diagrams
- [**CODE_REFERENCE.md**](MD/CODE_REFERENCE.md) - Code examples and snippets
- [**VERIFICATION_CHECKLIST.md**](MD/VERIFICATION_CHECKLIST.md) - Testing checklist

---

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the documentation in the `MD/` folder
3. Search existing issues on GitHub
4. Create a new issue with detailed information

---

## 🗺️ Roadmap

### Planned Features

- [ ] Real-time notifications with WebSocket
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Integration with university ERP systems
- [ ] Automated report generation scheduling
- [ ] Document version control
- [ ] AI-powered recommendation system
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Progressive Web App (PWA) support

### Version History

- **v1.1.0** (February 2026) - Team Collaboration & UI Enhancements
  - 🎯 **Event-Linked Achievements**: Added `event_id` column to achievements table for tracking achievements by events
  - 🧭 **Admin Navigation Fix**: Fixed admin navbar to properly navigate before scrolling to sections
  - 🏆 **Student-Only Leaderboard**: Simplified leaderboard to display only students (removed staff toggle)
  - 👥 **Team Role Management**: Added Team Leader/Member dropdown for project uploads
    - Integrated dropdown design within team member input fields
    - Proper role tracking for all team members
  - 🔒 **Duplicate Project Prevention**: GitHub URL uniqueness validation
    - Prevents multiple team members from uploading the same project
    - Returns user-friendly error message with existing project details
  - ⭐ **Team Credit System**: All team members now receive credit for projects
    - Leaderboard counts projects where user is creator OR team member
    - "My Projects" filter shows projects where user is creator OR team member
    - Uses LIKE pattern matching on `team_member_names` field
  - 🎨 **UI/UX Improvements**: Responsive design fixes for dropdowns and form layouts

- **v1.0.0** (January 2026) - Initial release with core features
  - RBAC authentication with 90-day sessions
  - Project and achievement management
  - Event management and announcements
  - Faculty activity tracking
  - Bulk operations and reporting

---

## 💡 Tips & Best Practices

### For Developers

1. **Environment Variables**: Never commit `.env` files
2. **Database Migrations**: Always backup before running migrations
3. **File Uploads**: Implement virus scanning in production
4. **Error Handling**: Always return user-friendly error messages
5. **Logging**: Use proper logging levels (debug, info, warn, error)
6. **Code Reviews**: Require PR reviews before merging

### For Administrators

1. **Backups**: Schedule daily database backups
2. **Security**: Regular security audits and dependency updates
3. **Monitoring**: Set up uptime monitoring and alerts
4. **Performance**: Monitor API response times and database queries
5. **Users**: Regular cleanup of inactive sessions and expired data
6. **Updates**: Keep Node.js, PostgreSQL, and dependencies updated

### For Users

1. **Passwords**: Use strong, unique passwords
2. **Sessions**: Logout from public/shared devices
3. **Files**: Scan files before uploading
4. **Data**: Verify information before submitting
5. **Updates**: Keep browser updated for best experience
6. **Team Projects**:
   - Coordinate with team members before uploading projects
   - Use unique GitHub URLs for each project
   - Ensure team member names match exactly with registered names
   - Only one team member needs to upload; all will receive credit

---

**Built with ❤️ for efficient department management**
