import nodemailer from "nodemailer";

const { MAIL_USER, MAIL_PASS, MAIL_FROM } = process.env;

function ensureMailConfigured() {
  if (!MAIL_USER || !MAIL_PASS) {
    throw new Error("MAIL_USER and MAIL_PASS must be set to send OTP emails.");
  }
}

export function createMailTransport() {
  ensureMailConfigured();
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS,
    },
  });
}

export async function sendOtpEmail({ to, otp, expiresMinutes }) {
  const transporter = createMailTransport();
  const from = MAIL_FROM || `"E-Parking App" <${MAIL_USER}>`;

  await transporter.sendMail({
    from,
    to,
    subject: "Your OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 460px; margin: auto;">
        <h2 style="color: #1a3a5c; margin-bottom: 8px;">E-Parking Verification</h2>
        <p>Your One-Time Password is:</p>
        <div style="
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #1a3a5c;
          padding: 14px 16px;
          background: #f0f4f8;
          text-align: center;
          border-radius: 8px;
        ">
          ${otp}
        </div>
        <p style="color: #666; font-size: 13px; margin-top: 16px;">
          This code expires in <strong>${expiresMinutes} minutes</strong>. Do not share it with anyone.
        </p>
      </div>
    `,
  });
}
