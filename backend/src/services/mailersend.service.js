const axios = require("axios");

const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;
const MAILERSEND_FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL || "noreply@gwarzodatasub.com";
const MAILERSEND_FROM_NAME = process.env.MAILERSEND_FROM_NAME || "KIRU DATA";

const PURPOSE_CONFIG = {
  login: {
    headerLabel: "Secure Login Verification",
    title: "Your Login Code",
    body: "We received a login request for your account. Use the verification code below to complete your sign-in:",
    footer: "If you did not request this login, please ignore this email or contact support immediately.",
  },
  "password reset": {
    headerLabel: "Password Reset Request",
    title: "Your Password Reset Code",
    body: "We received a request to reset your password. Use the verification code below to proceed with resetting your password:",
    footer: "If you did not request a password reset, please ignore this email or contact support immediately.",
  },
  "PIN reset": {
    headerLabel: "Transaction PIN Reset",
    title: "Your PIN Reset Code",
    body: "We received a request to reset your transaction PIN. Use the verification code below to set a new PIN:",
    footer: "If you did not request a PIN reset, please ignore this email or contact support immediately.",
  },
};

async function sendOtpEmail({ to, otpCode, expiresInMinutes = 20, purpose = "login" }) {
  if (!MAILERSEND_API_KEY) {
    console.error("[MailerSend] API key not configured");
    throw new Error("Email service not configured");
  }

  const config = PURPOSE_CONFIG[purpose] || PURPOSE_CONFIG.login;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" maxWidth="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:32px 24px;text-align:center;">
              <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:800;">KIRU DATA</h1>
              <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:6px 0 0;">${config.headerLabel}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <p style="color:#334155;font-size:15px;margin:0 0 8px;">Hello,</p>
              <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
                ${config.body}
              </p>
              <div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
                <p style="color:#64748b;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Your Verification Code</p>
                <p style="color:#0f172a;font-size:36px;font-weight:900;letter-spacing:8px;margin:0;font-family:monospace;">${otpCode}</p>
              </div>
              <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0 0 16px;">
                This code expires in <strong style="color:#475569;">${expiresInMinutes} minutes</strong>. ${config.footer}
              </p>
              <div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:8px;">
                <p style="color:#94a3b8;font-size:12px;margin:0;">This is an automated message. Please do not reply.</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Your verification code is: ${otpCode}\n\nThis code expires in ${expiresInMinutes} minutes.\n\n${config.footer}`;

  const subjectMap = {
    login: `Your Login Code: ${otpCode}`,
    "password reset": `Your Password Reset Code: ${otpCode}`,
    "PIN reset": `Your PIN Reset Code: ${otpCode}`,
  };

  try {
    const response = await axios.post(
      "https://api.mailersend.com/v1/email",
      {
        from: {
          email: MAILERSEND_FROM_EMAIL,
          name: MAILERSEND_FROM_NAME,
        },
        to: [{ email: to }],
        subject: subjectMap[purpose] || subjectMap.login,
        html,
        text,
      },
      {
        headers: {
          Authorization: `Bearer ${MAILERSEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    return response.status === 202;
  } catch (err) {
    console.error("[MailerSend] Failed to send OTP email:", err.response?.data || err.message);
    return false;
  }
}

module.exports = { sendOtpEmail };
