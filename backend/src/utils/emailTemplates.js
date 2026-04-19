// ─── Internal helpers ────────────────────────────────────────────────────────

function baseLayout(accentColor, headerLabel, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background-color:${accentColor};padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">DRMS</td>
                <td align="right" style="color:#ffffff;font-size:13px;opacity:0.85;">${headerLabel}</td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${bodyHtml}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color:#f4f6f9;border-top:1px solid #e8ecf0;padding:16px 32px;text-align:center;">
            <p style="margin:0 0 4px;color:#6b7280;font-size:12px;">Department Record Management System</p>
            <p style="margin:0;color:#9ca3af;font-size:11px;">This is an automated message. Please do not reply.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function otpBox(otp, expiryMin) {
  return `
    <div style="background-color:#eff6ff;border:2px dashed #2563eb;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
      <p style="margin:0 0 8px;color:#374151;font-size:14px;">Your one-time code:</p>
      <p style="margin:0;font-size:40px;font-weight:700;letter-spacing:12px;color:#1e40af;font-family:'Courier New',Courier,monospace;">${otp}</p>
    </div>
    <p style="margin:0;color:#6b7280;font-size:13px;text-align:center;">This code expires in <strong>${expiryMin} minutes</strong>. Do not share it with anyone.</p>`;
}

function credentialsBox(email, password) {
  return `
    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:20px;margin:24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 0;color:#6b7280;font-size:13px;width:40%;vertical-align:top;">Email Address</td>
          <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;">${email}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#6b7280;font-size:13px;vertical-align:top;">Temporary Password</td>
          <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;font-family:'Courier New',Courier,monospace;">${password}</td>
        </tr>
      </table>
    </div>`;
}

function commentBox(staffComment) {
  if (!staffComment) return "";
  return `
    <div style="background-color:#f9fafb;border-left:4px solid #e5e7eb;padding:12px 16px;border-radius:0 4px 4px 0;margin:16px 0;">
      <p style="margin:0 0 4px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Staff Comment</p>
      <p style="margin:0;color:#374151;font-size:14px;">${staffComment}</p>
    </div>`;
}

function statusBadge(status) {
  const approved = status === "approved";
  const bg = approved ? "#dcfce7" : "#fee2e2";
  const color = approved ? "#15803d" : "#b91c1c";
  return `<span style="background-color:${bg};color:${color};padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600;">${status.toUpperCase()}</span>`;
}

// ─── OTP templates ───────────────────────────────────────────────────────────

export function registrationOtpEmail({ otp, OTP_EXPIRY_MIN }) {
  const html = baseLayout(
    "#2563eb",
    "Account Verification",
    `<p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi there,</p>
     <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Verify your account</h2>
     <p style="margin:0 0 4px;color:#6b7280;font-size:15px;">Use the code below to complete your registration.</p>
     ${otpBox(otp, OTP_EXPIRY_MIN)}`,
  );
  const text = `Hi there,\n\nYour OTP is ${otp}. It expires in ${OTP_EXPIRY_MIN} minutes.`;
  return { html, text };
}

export function loginUnverifiedOtpEmail({ otp, OTP_EXPIRY_MIN }) {
  const html = baseLayout(
    "#2563eb",
    "Account Verification",
    `<p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi there,</p>
     <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Verify your account</h2>
     <p style="margin:0 0 4px;color:#6b7280;font-size:15px;">Your account is not yet verified. Use the code below to verify your account.</p>
     ${otpBox(otp, OTP_EXPIRY_MIN)}`,
  );
  const text = `Hi there,\n\nYour verification OTP is ${otp}. It expires in ${OTP_EXPIRY_MIN} minutes.`;
  return { html, text };
}

export function loginSessionExpiredOtpEmail({ otp, OTP_EXPIRY_MIN }) {
  const html = baseLayout(
    "#2563eb",
    "Login OTP",
    `<p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi there,</p>
     <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Login to your account</h2>
     <p style="margin:0 0 4px;color:#6b7280;font-size:15px;">Use the code below to complete your sign-in.</p>
     ${otpBox(otp, OTP_EXPIRY_MIN)}`,
  );
  const text = `Hi there,\n\nYour login OTP is ${otp}. It expires in ${OTP_EXPIRY_MIN} minutes.`;
  return { html, text };
}

export function forgotPasswordOtpEmail({ otp, OTP_EXPIRY_MIN }) {
  const html = baseLayout(
    "#2563eb",
    "Password Reset",
    `<p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi there,</p>
     <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Reset your password</h2>
     <p style="margin:0 0 4px;color:#6b7280;font-size:15px;">We received a request to reset your password. Use the code below.</p>
     ${otpBox(otp, OTP_EXPIRY_MIN)}
     <p style="margin:16px 0 0;color:#9ca3af;font-size:13px;">If you did not request a password reset, please ignore this email.</p>`,
  );
  const text = `Hi there,\n\nYour password reset OTP is ${otp}. It expires in ${OTP_EXPIRY_MIN} minutes.\n\nIf you did not request a password reset, please ignore this email.`;
  return { html, text };
}

// ─── Welcome templates ───────────────────────────────────────────────────────

export function studentWelcomeEmail({ fullName, email, password }) {
  const html = baseLayout(
    "#2563eb",
    "Welcome to DRMS",
    `<h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Welcome, ${fullName}!</h2>
     <p style="margin:0 0 4px;color:#6b7280;font-size:15px;">Your student account has been created and you're now part of the DRMS platform. Here are your login credentials:</p>
     ${credentialsBox(email, password)}
     <p style="margin:16px 0 0;color:#374151;font-size:14px;">Please log in and set a new password from your profile settings as soon as possible.</p>`,
  );
  const text = `Hello ${fullName},\n\nYour student account has been created and you're now part of the DRMS platform.\n\nEmail: ${email}\nTemporary Password: ${password}\n\nPlease log in and set a new password from your profile settings.\n\nRegards,\nDepartment Admin`;
  return { html, text };
}

export function staffWelcomeEmail({ fullName, email, password }) {
  const html = baseLayout(
    "#2563eb",
    "Welcome to DRMS",
    `<h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Welcome, ${fullName}!</h2>
     <p style="margin:0 0 4px;color:#6b7280;font-size:15px;">Your DRMS staff account has been created. Here are your login credentials:</p>
     ${credentialsBox(email, password)}
     <p style="margin:16px 0 0;color:#374151;font-size:14px;">Please log in and set a new password from your profile settings as soon as possible.</p>`,
  );
  const text = `Hello ${fullName},\n\nYour DRMS staff account has been created.\n\nEmail: ${email}\nTemporary Password: ${password}\n\nPlease log in and set a new password from your profile settings.\n\nRegards,\nDepartment Admin`;
  return { html, text };
}

// ─── Review templates ─────────────────────────────────────────────────────────

export function projectReviewEmail({ title, status, staffComment }) {
  const approved = status === "approved";
  const accentColor = approved ? "#16a34a" : "#dc2626";
  const opener = approved
    ? "Great news! Your project has been approved."
    : "Unfortunately, your project was not approved this time.";
  const html = baseLayout(
    accentColor,
    `Project ${approved ? "Approved" : "Rejected"}`,
    `<p style="margin:0 0 12px;color:#374151;font-size:15px;">${opener}</p>
     <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
       <tr><td style="padding-right:12px;vertical-align:middle;">${statusBadge(status)}</td></tr>
     </table>
     <h3 style="margin:0 0 16px;color:#111827;font-size:18px;font-weight:600;">${title}</h3>
     ${commentBox(staffComment)}`,
  );
  const text = `${opener}\n\nProject: ${title}${staffComment ? `\n\nStaff Comment: ${staffComment}` : ""}`;
  return { html, text };
}

export function achievementReviewEmail({ title, status, staffComment }) {
  const approved = status === "approved";
  const accentColor = approved ? "#16a34a" : "#dc2626";
  const opener = approved
    ? "Great news! Your achievement has been approved."
    : "Unfortunately, your achievement was not approved this time.";
  const html = baseLayout(
    accentColor,
    `Achievement ${approved ? "Approved" : "Rejected"}`,
    `<p style="margin:0 0 12px;color:#374151;font-size:15px;">${opener}</p>
     <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
       <tr><td style="padding-right:12px;vertical-align:middle;">${statusBadge(status)}</td></tr>
     </table>
     <h3 style="margin:0 0 16px;color:#111827;font-size:18px;font-weight:600;">${title}</h3>
     ${commentBox(staffComment)}`,
  );
  const text = `${opener}\n\nAchievement: ${title}${staffComment ? `\n\nStaff Comment: ${staffComment}` : ""}`;
  return { html, text };
}
