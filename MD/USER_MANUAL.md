# Department Record Management System (DRMS) User Manual

Version: 1.0  
Last Updated: April 1, 2026

## 1. Purpose

This manual explains how to use the DRMS web application end-to-end for all main roles:

- Student
- Staff
- Admin

It covers login, profile management, submissions, approvals, events, announcements, reports, exports, and troubleshooting.

## 2. Who Should Use This Manual

- Students submitting projects, achievements, and hackathon progress
- Staff reviewing submissions and managing events, records, and reports
- Admins managing users, coordinators, uploads, and system-level operations

## 3. Basic Requirements

- Modern browser: Chrome, Edge, Firefox, or Safari (latest stable)
- Working email address (required for OTP)
- Internet connection
- Valid account with assigned role

## 4. Accessing the Application

1. Open the DRMS web URL provided by your department.
2. Select Sign In.
3. Enter email and password.
4. Complete OTP verification when prompted.

### 4.1 OTP and Session Behavior

- OTP is a 6-digit code sent to your registered email.
- OTP expires quickly; request a new one if needed.
- DRMS supports session-based login up to 90 days per device.
- If your active session is still valid, you may be logged in without OTP.

## 5. Account Flows

### 5.1 Registration

Use the registration page for Student or Staff account creation.

Required details typically include:

- Email
- Password
- Name fields
- Department/course details (role dependent)

Password rules:

- Minimum 8 characters
- At least one digit
- At least one special character

### 5.2 Forgot Password

1. Open Forgot Password.
2. Enter your registered email.
3. Verify OTP.
4. Set a new password using policy requirements.

### 5.3 Logout

- Use the logout option in the application UI.
- This invalidates your active session for security.

## 6. Navigation Overview

After login, your available pages depend on role permissions.

Common sections:

- Home/Dashboard
- Quick Actions
- Profile
- Notifications

Role-specific sections are described below.

## 7. Student User Guide

## 7.1 Student Home and Quick Actions

From Home/Quick Actions, students can quickly access:

- Project upload
- Achievement submission
- Hackathon entry and progress
- Events and registrations
- Profile and notifications

## 7.2 Project Submission

Use the Project Upload page to submit project records.

Typical steps:

1. Open Project Upload.
2. Enter project details (title, academic year, etc.).
3. Add team members and assign role (Team Leader/Team Member) where applicable.
4. Provide GitHub URL and other required links.
5. Upload project documents/files.
6. Submit.

Important behavior:

- Duplicate prevention is enabled for project uniqueness checks (for example, duplicate GitHub URL submissions).
- Team credit is supported for all included members.

## 7.3 Achievement Submission

Use the Achievements page to create new achievement records.

Typical steps:

1. Open Achievements.
2. Enter title, date, category, and event linkage (if available).
3. Upload proof documents/certificates/photos.
4. Submit for verification.

Status lifecycle:

- Pending: waiting for staff review
- Approved: verified and accepted
- Rejected: not accepted (check comments if provided)

## 7.4 Hackathon Entry and Progress

Use the Hackathons page to:

- Submit hackathon participation
- Upload supporting proof
- Update student-editable progress/result details

Staff can later verify or reject entries.

## 7.5 Events and Registration

Students can:

- View upcoming and active department events
- Open event details
- Register where registration is available

## 7.6 Approved Records and History

Students can review approved records in dedicated views, including:

- Approved projects
- Approved achievements

## 7.7 Notifications and Announcements

The Notifications page shows announcements targeted to you, including brochures/attachments when provided.

## 7.8 Profile Management

Use Profile to update personal details such as:

- Name/full name
- Phone number
- Roll number (if applicable)
- Profile photo

## 8. Staff User Guide

Staff users have access to review workflows, events, announcements, faculty records, reports, and data operations.

## 8.1 Staff Dashboard

Dashboard typically includes:

- Pending projects
- Pending achievements
- Upcoming events
- Recent uploaded files

## 8.2 Verification Workflows

### 8.2.1 Verify Projects

1. Open Verify Projects.
2. Review submission details and files.
3. Add review comment.
4. Approve or Reject.

### 8.2.2 Verify Achievements

1. Open Verify Achievements.
2. Validate achievement evidence and context.
3. Add review note.
4. Approve or Reject.

### 8.2.3 Verify Hackathon Progress

1. Open Verify Hackathon Progress.
2. Review participation/progress details.
3. Approve or Reject.

## 8.3 Event Management

Staff can create, update, delete, and list events.

Typical flow:

1. Open Upload Events or Events management page.
2. Add event metadata (title, date, venue, description).
3. Upload optional thumbnail/attachments.
4. Publish/save.

## 8.4 Announcements

Use Top Achievers Announcement or announcement workflows to send targeted announcements.

Capabilities include:

- Target specific recipients/groups
- Include brochure attachment
- Deliver to user notification feed

## 8.5 Faculty Activity Modules

Staff can manage department faculty records:

- Faculty Participation
- Faculty Research
- Faculty Consultancy

Approved entries are available in separate approved views.

## 8.6 Reports and Bulk Export

Staff can generate reports and export datasets.

Common outputs:

- CSV exports
- Excel exports

Use filters before export when available to reduce file size and improve relevance.

## 8.7 Data Upload and Batch Operations

Staff can upload structured records (for example, student batch data) via CSV/Excel templates where configured.

Recommended process:

1. Use official template headers.
2. Validate mandatory columns before upload.
3. Upload and review processing results.

## 9. Admin User Guide

Admins have all staff-level access plus system administration controls.

## 9.1 Admin Dashboard and Quick Actions

Use Admin dashboard for system overview and direct navigation to management tools.

## 9.2 User Management

From Users management, admin can:

- View users
- Filter by role (students/staff)
- Update user role (where allowed)
- Remove users (where policy permits)

## 9.3 Activity Coordinator Assignment

Admins can assign staff coordinators to activity types for verification routing and operational ownership.

## 9.4 Admin Data Operations

Admin-specific pages support:

- Student batch upload
- Staff batch upload
- Extra-curricular or structured data upload
- Report generation
- Bulk export list and downloads

## 9.5 Admin Management Pages

Admin pages also include dedicated management screens for:

- Projects
- Achievements
- Events
- Verification queues

## 10. File Upload Guidance

## 10.1 File Size

- Upload size limit is system-configurable.
- Typical default limit is up to 50 MB per file.

## 10.2 File Safety Validation

DRMS performs strict content checks for uploaded files.

Notes:

- Unsafe executable/script-like files are blocked.
- Files with dangerous content patterns are rejected.
- Allowed document/media types depend on module and server configuration.

## 10.3 Best Practices

- Use clear file names (for example: StudentName_ProjectTitle_2026.pdf).
- Avoid special characters in file names.
- Upload final files only (avoid duplicates).

## 11. Record Status and Review Logic

Most submission modules follow a standard review lifecycle:

1. Draft/Input completed by user
2. Submitted
3. Pending verification
4. Approved or Rejected

If rejected:

- Read reviewer comments
- Correct details/evidence
- Re-submit where supported

## 12. Security and Good Usage Practices

- Never share OTP codes.
- Keep your password private.
- Log out on shared/public computers.
- Keep your profile details updated.
- Upload only authentic, verifiable records.

## 13. Troubleshooting

## 13.1 Login Issues

Problem: OTP not received  
Actions:

- Check spam/junk folder.
- Wait briefly and request OTP again.
- Confirm registered email is correct.

Problem: Session expired  
Actions:

- Sign in again.
- Complete OTP if prompted.

Problem: Invalid credentials  
Actions:

- Check email/password spelling.
- Use Forgot Password if needed.

## 13.2 Upload Issues

Problem: Upload rejected  
Actions:

- Check file size.
- Try a supported document/image format.
- Rename file and retry.

Problem: Form submits but record not visible  
Actions:

- Refresh and check filters.
- Verify module (Projects vs Achievements vs Hackathons).
- Check Notifications for processing feedback.

## 13.3 Permission Issues

Problem: Access denied/forbidden page  
Actions:

- Confirm you are using the correct account role.
- Log out and sign in again.
- Contact admin for role correction.

## 14. Frequently Asked Questions

Q1. Why did I not get OTP during login every time?  
Because DRMS supports persistent session login up to 90 days per device.

Q2. Can I upload team projects?  
Yes. Team members and roles are supported in project submission workflows.

Q3. How do I know if my submission is approved?  
Check approved views and notifications.

Q4. Who can approve submissions?  
Staff perform verification workflows. Admin has management access and broader controls.

Q5. Can I export data?  
Staff and Admin can use report and bulk export modules, depending on permissions.

## 15. Support and Escalation

For unresolved issues, contact your department DRMS support/admin with:

- Your registered email
- Role (Student/Staff/Admin)
- Date/time of issue
- Module name
- Screenshot and error text (if any)

## 16. Quick Role Matrix

| Feature | Student | Staff | Admin |
|---|---|---|---|
| Login, profile, notifications | Yes | Yes | Yes |
| Submit projects | Yes | Yes (if enabled) | Yes (if enabled) |
| Submit achievements | Yes | Yes | Yes |
| Submit hackathon entries | Yes | Yes | Yes |
| Verify projects/achievements/hackathons | No | Yes | Limited/management context |
| Manage events | View/Register | Yes | Yes |
| Send targeted announcements | No | Yes | Yes |
| Faculty participation/research/consultancy | No | Yes | Yes |
| Generate reports | No | Yes | Yes |
| Bulk export | No | Yes | Yes |
| User and role management | No | No | Yes |
| Coordinator assignment | No | No | Yes |

---

End of manual.