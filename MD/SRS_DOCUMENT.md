# Software Requirements Specification (SRS)
## Department Record Management System

**Document Version:** 1.0  
**Last Updated:** January 11, 2026  
**Project Status:** Implementation Complete (Phase 1)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Scope](#3-scope)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [System Architecture](#6-system-architecture)
7. [Technology Stack](#7-technology-stack)
8. [Database Design](#8-database-design)
9. [API Specifications](#9-api-specifications)
10. [User Roles & Permissions](#10-user-roles--permissions)
11. [User Interface Requirements](#11-user-interface-requirements)
12. [Security Requirements](#12-security-requirements)
13. [Testing Requirements](#13-testing-requirements)
14. [Implementation Status](#14-implementation-status)
15. [Future Enhancements](#15-future-enhancements)

---

## 1. Executive Summary

The **Department Record Management System** is a comprehensive web-based application designed to streamline the management of academic records, achievements, projects, faculty participation, research, and consultancy activities within an educational institution. The system enables different user roles (Admin, Staff, Students, and Activity Coordinators) to efficiently manage, track, and report on departmental activities.

### Key Objectives
- Centralize record management for all departmental activities
- Reduce manual paperwork and administrative overhead
- Provide real-time data analytics and reporting
- Ensure data security with role-based access control
- Enable easy data export and bulk operations
- Maintain 90-day persistent login sessions for enhanced user experience

### Success Criteria
- ✅ Role-based access control implemented
- ✅ Multi-module record management operational
- ✅ Session-based 90-day authentication deployed
- ✅ Data export and bulk operations functional
- ✅ Responsive UI for desktop and mobile
- ✅ Secure authentication and authorization

---

## 2. Product Overview

### 2.1 Purpose
The system serves as a centralized hub for managing departmental records including:
- Student achievements and recognitions
- Project submissions and tracking
- Faculty participation in conferences and events
- Faculty research publications
- Faculty consultancy activities
- Event management and public announcements
- Administrative data management and reporting

### 2.2 Target Users
1. **Admin Users** - Full system access, user management, approval workflows
2. **Staff Members** - Data entry, submission management, report generation
3. **Students** - Achievement submission, profile management
4. **Activity Coordinators** - Event management, public announcements
5. **Alumni** - Ability to view their own records

### 2.3 Product Scope
The system manages:
- User authentication and authorization
- Multi-module record management
- File upload and storage
- Approval workflows
- Data analytics and reporting
- Bulk data operations
- Event management

---

## 3. Scope

### 3.1 In Scope (Phase 1 - Completed)

#### Core Features
- [x] User authentication with OTP verification
- [x] Session-based 90-day persistent login
- [x] Role-based access control (Admin, Staff, Student, Activity Coordinator)
- [x] Achievement management and approval
- [x] Project submission and tracking
- [x] Faculty participation in conferences
- [x] Faculty research publication tracking
- [x] Faculty consultancy activity logging
- [x] Event management (public and admin)
- [x] File upload and management
- [x] Data export functionality
- [x] Bulk data import/upload
- [x] User profile management
- [x] Report generation
- [x] Search and filtering
- [x] Pagination support

#### Technical Features
- [x] RESTful API architecture
- [x] PostgreSQL database
- [x] JWT token-based authentication
- [x] Session token management
- [x] Role-based middleware
- [x] File storage management (15MB limit for specific modules)
- [x] CORS configuration
- [x] Error handling and logging
- [x] Input validation

### 3.2 Out of Scope (Future Phases)

#### Advanced Features (Planned)
- [ ] Real-time notifications (WebSocket)
- [ ] Mobile application
- [ ] AI-powered analytics
- [ ] Advanced workflow automation
- [ ] Integration with external systems
- [ ] Two-factor authentication (2FA)
- [ ] Social login integration
- [ ] Video streaming for events
- [ ] Virtual event hosting
- [ ] Machine learning-based recommendations

---

## 4. Functional Requirements

### 4.1 Authentication Module

#### FR-1.1: User Registration
**Description:** Users can register as Staff or Students  
**Requirements:**
- Email-based registration
- Password validation (minimum 8 characters, complexity rules)
- Role selection (Staff/Student/Alumni)
- Email verification
- **Status:** ✅ Implemented

**User Stories:**
```
As a staff member
I want to register with my email and password
So that I can access the system
```

#### FR-1.2: OTP-Based Login
**Description:** Secure OTP verification for first-time login  
**Requirements:**
- Generate 6-digit OTP
- Send OTP via email
- OTP expiration after 10 minutes
- Multiple OTP attempt handling
- **Status:** ✅ Implemented

**User Stories:**
```
As a user
I want to receive an OTP on my email
So that I can securely log in to the system
```

#### FR-1.3: 90-Day Session-Based Authentication
**Description:** Persistent login sessions valid for 90 days  
**Requirements:**
- Session token generation on successful OTP verification
- Session token storage in database
- Session expiration after 90 days
- Automatic session extension on user activity
- Device information tracking (User Agent, IP)
- Session invalidation on logout
- Support for multiple concurrent sessions per user
- **Status:** ✅ Implemented

**User Stories:**
```
As a returning user
I want to log in without entering OTP again
So that I can quickly access the system within 90 days
```

#### FR-1.4: Logout
**Description:** Secure session termination  
**Requirements:**
- Invalidate session token
- Invalidate all sessions for user (optional)
- Redirect to login page
- Clear session from browser storage
- **Status:** ✅ Implemented

### 4.2 Achievement Management Module

#### FR-2.1: Achievement Submission
**Description:** Students/Staff submit achievements for approval  
**Requirements:**
- Title, description, category (required)
- Attachment upload (PDF/Image, max 25MB)
- Date selection
- Event/competition details
- Status tracking (Pending/Approved/Rejected)
- **Status:** ✅ Implemented

#### FR-2.2: Achievement Approval
**Description:** Admin/Staff can approve or reject achievements  
**Requirements:**
- View submitted achievements
- Approval/rejection interface
- Comments/feedback option
- Bulk approval support
- Email notifications on approval/rejection
- **Status:** ✅ Implemented

#### FR-2.3: Achievement Listing
**Description:** Display approved achievements with pagination  
**Requirements:**
- Filter by status, category, date range
- Search functionality
- Pagination with configurable page size
- View achievement details
- Download proof documents
- **Status:** ✅ Implemented

### 4.3 Project Management Module

#### FR-3.1: Project Submission
**Description:** Students submit projects with documentation  
**Requirements:**
- Project title, description (required)
- Team members (user IDs)
- Mentor assignment
- Academic year tracking
- Multiple file attachments (SRS, PPT, Paper, Code ZIP)
- Status tracking
- **Status:** ✅ Implemented

#### FR-3.2: Project Approval
**Description:** Verify and approve submitted projects  
**Requirements:**
- Submission review interface
- Approval/rejection with comments
- Verification status update
- File validation
- **Status:** ✅ Implemented

#### FR-3.3: Project Details
**Description:** View detailed project information  
**Requirements:**
- Team member information
- File download capability
- Edit capability (for own projects)
- View approval history
- **Status:** ✅ Implemented

### 4.4 Faculty Participation Module

#### FR-4.1: Participation Submission
**Description:** Faculty submit participation in conferences and events  
**Requirements:**
- Event/Conference title (required)
- Faculty name, department (required)
- Type of event (FDP, Webinar, Seminar, Others)
- Mode of participation (Online, Offline, Hybrid)
- Start date, end date, conducted by
- Proof document upload (ALL file types, max 15MB)
- Optional: Publication details if type = "Others"
  - Paper title, journal/conference name
  - Authors list, volume/issue/page
  - DOI, ISSN/ISBN, publication date
  - Citations count, impact factor
  - Publication links
  - Indexing information (Scopus, Web of Science, etc.)
  - SDG mapping
- **Status:** ✅ Implemented with all file type support

#### FR-4.2: Participation Search & Filter
**Description:** Search and filter participation records  
**Requirements:**
- Search by faculty name, title, department, event type
- Pagination support
- Total count display
- **Status:** ✅ Implemented

#### FR-4.3: View Proof Documents
**Description:** Display uploaded proof documents  
**Requirements:**
- Support all file types (images, PDFs, documents, videos, audio, archives)
- Inline preview for viewable formats
- Download option for all file types
- Google Viewer integration for Office documents
- **Status:** ✅ Implemented

### 4.5 Faculty Research Module

#### FR-5.1: Research Publication Tracking
**Description:** Record faculty research publications  
**Requirements:**
- Paper title, authors (required)
- Journal/Conference name, volume/issue
- Publication date
- DOI/ISSN
- Citations
- Proof document upload
- Approval workflow
- **Status:** ✅ Implemented

### 4.6 Faculty Consultancy Module

#### FR-6.1: Consultancy Activity Logging
**Description:** Track faculty consultancy services  
**Requirements:**
- Client name, project title (required)
- Duration, revenue
- Description
- Proof document upload
- Status tracking
- **Status:** ✅ Implemented

### 4.7 Event Management Module

#### FR-7.1: Public Event Listing
**Description:** Display upcoming and past events  
**Requirements:**
- Event title, description, date
- Location/Online URL
- Event image
- Participant count
- Public visibility
- **Status:** ✅ Implemented

#### FR-7.2: Event Administration
**Description:** Create and manage events (Admin/Coordinators)  
**Requirements:**
- Create new events
- Edit event details
- Delete events
- Manage event visibility
- Track event participation
- **Status:** ✅ Implemented

### 4.8 Data Management Module

#### FR-8.1: Bulk Data Upload
**Description:** Import student and participation data via CSV  
**Requirements:**
- CSV file upload and validation
- Data parsing and validation
- Batch record creation
- Error reporting and recovery
- Support for students and faculty data
- **Status:** ✅ Implemented

#### FR-8.2: Bulk Data Export
**Description:** Export records to CSV/Excel  
**Requirements:**
- Export achievements, projects, research, consultancy
- Filter data before export
- Customizable column selection
- Timestamp tracking
- **Status:** ✅ Implemented

### 4.9 User Management Module

#### FR-9.1: User Profile
**Description:** Manage user profile information  
**Requirements:**
- View/edit profile details
- Change password
- View login history
- Manage sessions
- **Status:** ✅ Implemented

#### FR-9.2: Admin User Management
**Description:** Admin can manage system users  
**Requirements:**
- Create/edit/delete users
- Assign roles
- Enable/disable accounts
- View user activity logs
- Reset user passwords
- **Status:** ✅ Implemented

### 4.10 Search and Reporting Module

#### FR-10.1: Advanced Search
**Description:** Search across all modules  
**Requirements:**
- Full-text search
- Filter by multiple criteria
- Date range filtering
- Status filtering
- Role-specific search results
- **Status:** ✅ Implemented

#### FR-10.2: Report Generation
**Description:** Generate reports from various modules  
**Requirements:**
- Generate PDF reports
- Export to CSV
- Filter data for reports
- Summary statistics
- Date-wise breakdown
- **Status:** ✅ Implemented

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements

#### NFR-1.1: Response Time
- API response time: < 500ms (P95)
- Page load time: < 2 seconds
- Database query time: < 200ms (P95)
- Search results: < 1 second for 10,000 records
- **Status:** ✅ Meets target

#### NFR-1.2: Scalability
- Support minimum 500 concurrent users
- Handle 10,000 records per module
- File upload handling up to 15MB
- **Status:** ✅ Designed for scalability

#### NFR-1.3: Availability
- Target uptime: 99% during academic year
- Planned maintenance: Maximum 1 hour per month
- **Status:** ✅ Operational

### 5.2 Security Requirements

#### NFR-2.1: Authentication Security
- Passwords must be hashed (bcrypt)
- Session tokens must be cryptographically secure (64-char hex)
- OTP must be 6 digits, valid for 10 minutes
- **Status:** ✅ Implemented

#### NFR-2.2: Authorization
- Role-based access control (RBAC)
- Middleware-based route protection
- Resource-level permission checks
- **Status:** ✅ Implemented

#### NFR-2.3: Data Protection
- All sensitive data encrypted in transit (HTTPS)
- Database passwords stored securely
- API keys stored in environment variables
- **Status:** ✅ Implemented

#### NFR-2.4: Session Security
- Session tokens unique and random
- Session invalidation on logout
- Automatic expiration after 90 days
- Device information tracking
- **Status:** ✅ Implemented

### 5.3 Usability Requirements

#### NFR-3.1: User Interface
- Responsive design (Mobile, Tablet, Desktop)
- Dark mode support
- Accessibility standards (WCAG 2.1 AA)
- Intuitive navigation
- **Status:** ✅ Implemented

#### NFR-3.2: Documentation
- User guides for each module
- API documentation
- Quick start guides
- Video tutorials (planned)
- **Status:** ✅ Partial (Quick Start available)

### 5.4 Reliability Requirements

#### NFR-4.1: Data Integrity
- Database transactions for critical operations
- Data validation at both frontend and backend
- Regular backups (external responsibility)
- **Status:** ✅ Implemented

#### NFR-4.2: Error Handling
- Comprehensive error messages
- User-friendly error pages
- Error logging and monitoring
- Graceful degradation
- **Status:** ✅ Implemented

### 5.5 Maintainability Requirements

#### NFR-5.1: Code Quality
- Clean, well-documented code
- Consistent coding standards
- Modular architecture
- Comprehensive comments for complex logic
- **Status:** ✅ Implemented

#### NFR-5.2: Extensibility
- Modular component structure
- Plugin-ready architecture
- Easy to add new modules
- Configuration-based customization
- **Status:** ✅ Implemented

---

## 6. System Architecture

### 6.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (Frontend)                  │
│              React.js SPA with Vite Build Tool             │
├─────────────────────────────────────────────────────────────┤
│  Components │ Pages │ Hooks │ Context │ Utils │ API Client │
├─────────────────────────────────────────────────────────────┤
│                         API LAYER                           │
│                  RESTful API (Express.js)                   │
├─────────────────────────────────────────────────────────────┤
│ Routes │ Controllers │ Middleware │ Utils │ Config │ Models│
├─────────────────────────────────────────────────────────────┤
│                      BUSINESS LOGIC                         │
│  Auth │ Validation │ Session │ File Upload │ Email Service │
├─────────────────────────────────────────────────────────────┤
│                    DATABASE LAYER                           │
│              PostgreSQL with pg Library                     │
├─────────────────────────────────────────────────────────────┤
│  Tables │ Indexes │ Constraints │ Relationships │ Triggers  │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Layered Architecture

#### Presentation Layer
- React.js components
- Responsive UI with Tailwind CSS
- Client-side routing with React Router
- State management with React Context

#### API Layer
- Express.js HTTP server
- RESTful endpoint design
- Request/response handling
- CORS and security headers

#### Business Logic Layer
- Authentication & authorization
- Session management
- Data validation
- File processing

#### Data Access Layer
- PostgreSQL database
- Connection pooling
- Query optimization
- Transaction management

### 6.3 Module Architecture

```
Frontend Modules:
├── Auth (Login, Register, OTP Verification)
├── Student (Achievements, Projects, Profile)
├── Staff (Participation, Research, Consultancy, Data Upload)
├── Admin (User Management, Approvals, Reports)
├── Activity Coordinator (Events)
└── Shared (Components, Utilities, API Client)

Backend Modules:
├── Auth Controller & Routes
├── Achievement Controller & Routes
├── Project Controller & Routes
├── Faculty Participation Controller & Routes
├── Faculty Research Controller & Routes
├── Faculty Consultancy Controller & Routes
├── Event Controller & Routes
├── Admin Controller & Routes
├── Data Upload Controller & Routes
├── Session Utils
├── Auth Middleware
├── Role Middleware
└── Configuration (DB, Email, File Upload)
```

---

## 7. Technology Stack

### 7.1 Frontend Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React.js | 18.x |
| Build Tool | Vite | Latest |
| Styling | Tailwind CSS | 3.x |
| Routing | React Router | 6.x |
| HTTP Client | Axios | Latest |
| State Management | React Context | Built-in |

### 7.2 Backend Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Express.js | 4.x |
| Language | JavaScript (Node.js) | 18.x+ |
| Database | PostgreSQL | 12.x+ |
| DB Client | pg | Latest |
| Authentication | JWT | jsonwebtoken |
| Password Hashing | bcrypt | Latest |
| File Upload | Multer | Latest |
| Email Service | Nodemailer | Latest |
| Validation | Custom validators | - |
| CORS | cors | Latest |

### 7.3 Database

- **Type:** PostgreSQL (Relational)
- **Version:** 12 or higher
- **Connection Pool:** pg pool
- **Features:** JSONB, Full-text search, Indexes

### 7.4 Deployment

- **Frontend:** Static hosting (Vercel, Netlify, or on-premises)
- **Backend:** Node.js server (Docker or direct deployment)
- **Database:** PostgreSQL server (cloud or on-premises)
- **File Storage:** Local filesystem or cloud storage

---

## 8. Database Design

### 8.1 Core Tables

#### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(20),
  profile_details JSONB,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### user_sessions
```sql
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  device_info JSONB,
  is_active BOOLEAN DEFAULT TRUE
);
```

#### achievements
```sql
CREATE TABLE achievements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  proof_file_id INTEGER,
  verified BOOLEAN DEFAULT FALSE,
  submitted_by INTEGER NOT NULL REFERENCES users(id),
  verified_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### projects
```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  team INTEGER[] DEFAULT '{}',
  mentor_id INTEGER,
  academic_year VARCHAR(10),
  status VARCHAR(20) DEFAULT 'ongoing',
  files JSONB,
  verified BOOLEAN DEFAULT FALSE,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### faculty_participations
```sql
CREATE TABLE faculty_participations (
  id SERIAL PRIMARY KEY,
  faculty_name VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  type_of_event VARCHAR(100) NOT NULL,
  publications_type VARCHAR(50),
  mode_of_training VARCHAR(20) NOT NULL,
  title VARCHAR(500) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  conducted_by VARCHAR(255),
  details TEXT,
  proof_file_id INTEGER,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### faculty_research
```sql
CREATE TABLE faculty_research (
  id SERIAL PRIMARY KEY,
  faculty_name VARCHAR(255) NOT NULL,
  paper_title VARCHAR(500) NOT NULL,
  authors TEXT,
  journal_name VARCHAR(255),
  publication_date DATE,
  doi VARCHAR(100),
  proof_file_id INTEGER,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### faculty_consultancy
```sql
CREATE TABLE faculty_consultancy (
  id SERIAL PRIMARY KEY,
  faculty_name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  project_title VARCHAR(500),
  duration_months INTEGER,
  revenue DECIMAL(10, 2),
  proof_file_id INTEGER,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### events
```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  event_date DATE,
  location VARCHAR(255),
  image_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### project_files
```sql
CREATE TABLE project_files (
  id SERIAL PRIMARY KEY,
  project_id INTEGER,
  filename VARCHAR(1024) NOT NULL,
  original_name VARCHAR(1024),
  mime_type VARCHAR(255),
  size BIGINT,
  file_type VARCHAR(50),
  uploaded_by INTEGER,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8.2 Indexes for Performance

```sql
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_achievements_user_id ON achievements(submitted_by);
CREATE INDEX idx_achievements_verified ON achievements(verified);
CREATE INDEX idx_projects_mentor ON projects(mentor_id);
CREATE INDEX idx_faculty_participations_faculty ON faculty_participations(faculty_name);
CREATE INDEX idx_faculty_research_faculty ON faculty_research(faculty_name);
CREATE INDEX idx_events_public ON events(is_public);
```

---

## 9. API Specifications

### 9.1 Authentication Endpoints

#### POST /api/auth/register
**Description:** Register new user  
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "role": "staff"
}
```
**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": { "id": 1, "email": "user@example.com", "role": "staff" }
}
```

#### POST /api/auth/login
**Description:** Initiate login (generates OTP or checks for active session)  
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```
**Response (200):**
```json
{
  "message": "OTP sent to email",
  "requiresOTP": true,
  "sessionActive": false
}
```
Or if session exists:
```json
{
  "message": "Login successful",
  "sessionActive": true,
  "sessionToken": "abc123...",
  "user": { "id": 1, "email": "user@example.com", "role": "staff" }
}
```

#### POST /api/auth/verify-otp
**Description:** Verify OTP and create session  
**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```
**Response (200):**
```json
{
  "message": "Login successful",
  "sessionToken": "abc123def456...",
  "user": { "id": 1, "email": "user@example.com", "role": "staff" }
}
```

#### POST /api/auth/logout
**Description:** Logout user (invalidate session)  
**Headers:** `Authorization: Bearer <token>`  
**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### 9.2 Achievement Endpoints

#### GET /api/achievements
**Description:** Get approved achievements with pagination  
**Query Parameters:**
- `status` (optional): "approved"
- `limit` (optional): page size (default: 10)
- `offset` (optional): pagination offset
- `q` (optional): search query

**Response (200):**
```json
{
  "achievements": [
    {
      "id": 1,
      "title": "Winner of Innovation Challenge",
      "category": "Competition",
      "description": "Won first place in the national innovation challenge",
      "verified": true
    }
  ],
  "total": 45
}
```

#### POST /api/achievements
**Description:** Submit new achievement  
**Headers:** `Authorization: Bearer <token>`  
**Request:**
```json
{
  "title": "Winner of Innovation Challenge",
  "category": "Competition",
  "description": "Description of achievement",
  "achievement_date": "2025-01-10"
}
```
**Response (201):**
```json
{
  "message": "Achievement submitted successfully",
  "data": { "id": 1, "title": "...", "verified": false }
}
```

### 9.3 Faculty Participation Endpoints

#### GET /api/faculty-participations
**Description:** Get faculty participation records with pagination  
**Query Parameters:**
- `limit` (optional): page size (default: 10)
- `offset` (optional): pagination offset
- `q` (optional): search by faculty name, title, department, event type

**Response (200):**
```json
{
  "participation": [
    {
      "id": 1,
      "faculty_name": "Dr. John Doe",
      "title": "Big Data Analytics Conference",
      "type_of_event": "Online Certification",
      "mode_of_training": "Online",
      "start_date": "2025-01-15",
      "proof_filename": "certificate_2025.pdf"
    }
  ],
  "total": 120
}
```

#### POST /api/faculty-participations
**Description:** Submit faculty participation  
**Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`  
**Request:**
- Form data fields:
  - `faculty_name`: string (required)
  - `department`: string (required)
  - `type_of_event`: string (required)
  - `mode_of_training`: string (required)
  - `title`: string (required)
  - `start_date`: date (required)
  - `end_date`: date (optional)
  - `conducted_by`: string (optional)
  - `details`: string (optional)
  - `proof`: file (all types, max 15MB)
  - Publication fields (optional, for type="Others")

**Response (201):**
```json
{
  "message": "Faculty participation added",
  "data": { "id": 1, "faculty_name": "Dr. John Doe", ... }
}
```

#### GET /api/faculty-participations/:id
**Description:** Get participation details  
**Response (200):**
```json
{
  "participation": { "id": 1, "faculty_name": "...", ... }
}
```

#### PUT /api/faculty-participations/:id
**Description:** Update participation  
**Headers:** `Authorization: Bearer <token>`  
**Response (200):**
```json
{
  "message": "Updated successfully",
  "data": { ... }
}
```

#### DELETE /api/faculty-participations/:id
**Description:** Delete participation  
**Response (200):**
```json
{
  "message": "Deleted successfully"
}
```

### 9.4 Project Endpoints

#### GET /api/projects
**Description:** Get projects with pagination  
**Query Parameters:**
- `status`: "verified" or "ongoing"
- `limit`: page size
- `offset`: pagination offset
- `q`: search query

#### POST /api/projects
**Description:** Submit new project  
**Headers:** `Authorization: Bearer <token>`  

#### PUT /api/projects/:id
**Description:** Update project  

#### DELETE /api/projects/:id
**Description:** Delete project  

### 9.5 Data Export Endpoints

#### POST /api/bulk-export
**Description:** Export records to CSV  
**Headers:** `Authorization: Bearer <token>`  
**Request:**
```json
{
  "module": "achievements",
  "filters": { "verified": true }
}
```
**Response:** CSV file download

### 9.6 Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Server Error |

---

## 10. User Roles & Permissions

### 10.1 Role Matrix

| Feature | Admin | Staff | Student | Activity Coordinator | Alumni |
|---------|-------|-------|---------|---------------------|--------|
| **Achievement** |||||
| Submit | Yes | Yes | Yes | No | No |
| Approve | Yes | Yes | No | No | No |
| View Own | Yes | Yes | Yes | No | Yes |
| View All | Yes | Yes | Yes | No | No |
| Delete | Yes | Yes | Yes* | No | No |
| **Projects** |||||
| Submit | No | No | Yes | No | No |
| Approve | Yes | Yes | No | No | No |
| View | Yes | Yes | Own/Team | No | Own |
| Download | Yes | Yes | Own/Team | No | No |
| Delete | Yes | Yes | Own* | No | No |
| **Faculty Participation** |||||
| Submit | Yes | Yes | No | No | No |
| View | Yes | Yes | No | No | No |
| Delete | Yes | Yes | No | No | No |
| **Events** |||||
| Create | Yes | No | No | Yes | No |
| Edit | Yes | Yes* | No | Yes* | No |
| View | Yes | Yes | Yes | Yes | Yes |
| Delete | Yes | Yes* | No | Yes* | No |
| **User Management** |||||
| Create Users | Yes | No | No | No | No |
| Edit Users | Yes | Yes* | Own | No | Own |
| View All Users | Yes | No | No | No | No |
| Delete Users | Yes | No | No | No | No |
| **Reports** |||||
| View | Yes | Yes | Own | Yes | Own |
| Export | Yes | Yes | Yes | No | No |

*With restrictions

### 10.2 Permission Scope

**Admin (Full Access)**
- All features
- User management
- System configuration
- Reports and analytics

**Staff (Data Entry & Management)**
- Submit and manage faculty data
- Submit achievements/projects
- Approve submissions
- Generate reports
- Manage own profile

**Student (Limited Access)**
- Submit achievements and projects
- View own submissions
- Manage profile
- Download certificates

**Activity Coordinator (Event Management)**
- Create and manage events
- View system records (read-only)
- Manage announcements

**Alumni (View-Only Access)**
- View own achievements and projects
- View public events
- Manage profile

---

## 11. User Interface Requirements

### 11.1 Responsive Design
- **Mobile (320px - 480px):** Optimized layouts, single column
- **Tablet (481px - 768px):** Two-column layouts where appropriate
- **Desktop (769px+):** Full multi-column layouts

### 11.2 Design System

#### Color Scheme
- **Primary Blue:** #87CEEB (Sky Blue)
- **Accent:** Slate colors (200-900)
- **Error:** Red (#DC2626)
- **Success:** Green (#16A34A)
- **Warning:** Amber (#FBBF24)

#### Typography
- **Headings:** Bold, Slate-900 (Dark mode: Slate-100)
- **Body Text:** Regular, Slate-700 (Dark mode: Slate-400)
- **Font:** System fonts (SF Pro, Segoe UI)

#### Components
- Cards with shadow and border
- Buttons with hover states
- Forms with validation feedback
- Tables with sorting/filtering
- Modals for critical actions
- Toast notifications for feedback

### 11.3 Navigation Structure

```
├── Home (Landing)
├── Dashboard (Role-based)
├── Achievements
│   ├── My Submissions
│   ├── Approved List
│   └── Submission Form
├── Projects
│   ├── My Projects
│   ├── Approved List
│   └── Submission Form
├── Faculty Modules (Staff/Admin)
│   ├── Participation
│   ├── Research
│   └── Consultancy
├── Events
│   ├── Public Listing
│   └── Management (Admin/Coordinator)
├── Reports
│   ├── View Records
│   └── Export Data
├── Admin Panel (Admin Only)
│   ├── User Management
│   ├── Approvals
│   └── System Settings
└── Profile
    ├── View/Edit Profile
    ├── Change Password
    └── Session Management
```

### 11.4 Key Screens

#### Login Screen
- Email input
- Password input
- Login button
- Register link
- Forgot password link

#### OTP Verification
- Email display
- OTP input (6 digits)
- Resend OTP option
- Verify button

#### Dashboard
- Quick actions (role-based)
- Upcoming events
- Pending approvals (Admin/Staff)
- Statistics/Overview

#### Achievement Submission Form
- Title, category, description
- Date picker
- File upload with preview
- Terms & conditions checkbox
- Submit button

#### Faculty Participation Form
- Faculty info, department
- Event type, mode
- Dates, conducted by
- File upload (all types)
- Optional publication fields

#### Record Approval Interface
- Record details
- Approval/rejection buttons
- Comments field
- History panel
- Bulk action support

---

## 12. Security Requirements

### 12.1 Authentication Security

#### Password Security
- **Hashing Algorithm:** bcrypt with salt rounds = 10
- **Requirements:**
  - Minimum 8 characters
  - Must include uppercase, lowercase, numbers
  - Cannot reuse last 5 passwords
  - Must change if compromised

#### OTP Security
- **Format:** 6-digit numeric code
- **Generation:** Cryptographically random
- **Transmission:** Email only
- **Expiration:** 10 minutes
- **Retry Limit:** 3 attempts
- **Rate Limiting:** 5 OTP requests per hour per email

#### Session Token Security
- **Format:** 64-character hexadecimal string
- **Generation:** Cryptographically random
- **Storage:** Secure HTTP-only cookies (recommended)
- **Transmission:** HTTPS only
- **Expiration:** 90 days
- **Invalidation:** On logout or forced logout

### 12.2 Authorization Security

#### Role-Based Access Control (RBAC)
- Every endpoint validates user role
- Middleware-based enforcement
- Database-level constraints
- Resource ownership verification

#### Token Validation
- JWT signature verification
- Token expiration checks
- Session token database verification
- Device information validation (optional)

### 12.3 Data Protection

#### In Transit
- HTTPS/TLS 1.2+ for all communications
- CORS configured to allowed origins only
- Secure headers (CSP, X-Frame-Options, etc.)

#### At Rest
- Database encryption (responsibility of DB hosting)
- File storage with access controls
- Sensitive data not logged
- Backup encryption

#### API Security
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- XSS prevention (output encoding)
- CSRF protection via tokens
- Rate limiting on endpoints

### 12.4 Audit & Logging

#### Logging
- All authentication attempts
- All data modifications
- Admin actions
- File uploads/downloads
- Session creation/termination
- Log retention: 90 days minimum

#### Compliance
- GDPR compliance for EU users
- Data retention policies
- User data deletion capabilities
- Privacy policy enforcement

### 12.5 Session Management

#### Session Lifecycle
1. User successfully verifies OTP
2. Session token generated and stored
3. Token sent to client (HTTP-only cookie)
4. Session extended on each user action
5. Session invalidated on logout
6. Automatic invalidation after 90 days or inactivity

#### Multi-Session Support
- User can have multiple concurrent sessions
- Each session has unique token
- Device information tracked
- All sessions can be viewed
- Individual session invalidation available

---

## 13. Testing Requirements

### 13.1 Unit Testing

#### Backend
- Utility functions (Session, Auth, Validation)
- Controller logic
- Middleware functions
- Database query functions

#### Frontend
- Component rendering
- Hook logic
- State management
- Utility functions

### 13.2 Integration Testing

- API endpoint integration
- Database operations
- File upload handling
- Email service integration
- Authentication flow
- Session management

### 13.3 End-to-End Testing

#### Authentication Flow
- [x] User registration
- [x] OTP generation and verification
- [x] Session token creation
- [x] Session-based login
- [x] Session expiration
- [x] Logout and session invalidation

#### Achievement Module
- [x] Submit achievement
- [x] Upload proof file
- [x] Approve/reject achievement
- [x] View achievement details
- [x] Search and filter

#### Faculty Participation
- [x] Submit participation with various file types
- [x] View and preview different file formats
- [x] Search by multiple criteria
- [x] Download proof documents

#### Data Export
- [x] Export to CSV
- [x] Filter before export
- [x] Data accuracy verification

### 13.4 Performance Testing

- Load testing (500+ concurrent users)
- Stress testing (peak hour simulation)
- Database query optimization
- API response time validation
- File upload performance

### 13.5 Security Testing

- SQL injection attempts
- XSS attack prevention
- CSRF token validation
- Authentication bypass attempts
- Authorization bypass attempts
- Rate limiting validation
- Session hijacking prevention

### 13.6 Browser Compatibility

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 14. Implementation Status

### 14.1 Completed Features (✅)

#### Phase 1 - Core Features
- [x] User authentication with OTP
- [x] 90-day session-based login
- [x] Achievement management
- [x] Project management
- [x] Faculty participation tracking
- [x] Faculty research publications
- [x] Faculty consultancy tracking
- [x] Event management
- [x] Data export functionality
- [x] Data import (bulk upload)
- [x] File upload with all file type support
- [x] Responsive UI design
- [x] Dark mode support
- [x] Search and filtering
- [x] Pagination support
- [x] Approval workflows
- [x] User profile management
- [x] Role-based access control
- [x] File preview system (all formats)

### 14.2 In Progress

#### Phase 1 - Polish
- [ ] Performance optimization
- [ ] Advanced analytics dashboard
- [ ] Email notification improvements
- [ ] Testing coverage expansion

### 14.3 Planned Enhancements (Phase 2)

#### Short-term (1-3 months)
- [ ] Real-time notifications (WebSocket)
- [ ] Advanced analytics and dashboards
- [ ] Two-factor authentication (2FA)
- [ ] API rate limiting dashboard
- [ ] Automated data cleanup

#### Medium-term (3-6 months)
- [ ] Mobile application (React Native)
- [ ] Advanced filtering and saved searches
- [ ] Custom reports builder
- [ ] Integration with external APIs
- [ ] Social login (Google, GitHub)

#### Long-term (6+ months)
- [ ] AI-powered analytics
- [ ] Machine learning recommendations
- [ ] Virtual event hosting
- [ ] Video streaming for events
- [ ] Advanced workflow automation

---

## 15. Future Enhancements

### 15.1 Technology Upgrades

#### Backend
- GraphQL API alternative
- Microservices architecture
- Message queue (Redis/RabbitMQ)
- Advanced caching strategies
- Kubernetes deployment

#### Frontend
- Next.js for better SSR
- TypeScript migration
- Advanced state management (Redux)
- Progressive Web App (PWA)
- Offline-first capabilities

### 15.2 Feature Enhancements

#### Analytics
- Real-time dashboards
- Predictive analytics
- Custom report builder
- Data visualization improvements

#### Collaboration
- Real-time collaboration on documents
- Comments and annotations
- Team workspaces
- Notification preferences

#### Integration
- SSO with institutional systems
- LMS integration (Moodle, Canvas)
- Calendar integration
- Payment gateway integration

### 15.3 Scalability

#### Infrastructure
- Load balancing
- Database replication
- CDN for static assets
- Horizontal scaling strategy
- Cloud deployment options

#### Performance
- Advanced caching
- Query optimization
- Image optimization
- Lazy loading
- Code splitting

---

## Appendix A: Glossary

| Term | Definition |
|------|-----------|
| SRS | Software Requirements Specification |
| OTP | One-Time Password |
| JWT | JSON Web Token |
| RBAC | Role-Based Access Control |
| CORS | Cross-Origin Resource Sharing |
| API | Application Programming Interface |
| CSV | Comma-Separated Values |
| HTTP-only Cookie | Cookie inaccessible to JavaScript |
| Session Token | Secure identifier for user session |
| Bcrypt | Password hashing algorithm |
| Middleware | Function executed between request and response |
| Repository | Code storage with version control |
| Migration | Database schema version update |
| Payload | Data included in request/response |

---

## Appendix B: Configuration Details

### B.1 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dms
DB_USER=postgres
DB_PASSWORD=***
DB_HOST=localhost
DB_PORT=5432
DB_NAME=department_records

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRY=7d

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=***
EMAIL_FROM=noreply@institution.edu

# File Upload
FILE_STORAGE_PATH=./uploads
FILE_SIZE_LIMIT_MB=50
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png

# Session
SESSION_EXPIRY_DAYS=90
SESSION_TOKEN_LENGTH=64

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Server
PORT=5800
NODE_ENV=production
```

### B.2 Database Connection String

```
PostgreSQL: postgresql://user:password@host:port/database
URL Format: protocol://username:password@host:port/database
```

---

## Appendix C: Deployment Checklist

### Pre-Deployment
- [ ] Code review completed
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Database backup created
- [ ] SSL certificates prepared
- [ ] CORS origins configured

### Deployment
- [ ] Backend deployed
- [ ] Database migrations run
- [ ] Frontend deployed
- [ ] DNS updated
- [ ] SSL certificates installed
- [ ] Monitoring enabled
- [ ] Backups scheduled

### Post-Deployment
- [ ] Smoke tests passed
- [ ] User testing completed
- [ ] Performance monitored
- [ ] Logs reviewed
- [ ] Analytics enabled
- [ ] Team notified

---

## Document Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Project Manager | - | - | - |
| Tech Lead | - | - | - |
| Business Analyst | - | - | - |
| QA Lead | - | - | - |

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-11 | AI Assistant | Initial SRS Document |

---

**Document Status:** ✅ Complete and Ready for Review

**Last Updated:** January 11, 2026

**Next Review Date:** February 11, 2026
