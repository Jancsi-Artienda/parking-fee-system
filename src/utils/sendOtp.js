import transporter from "./mailer.js";
import { saveOtp } from "./otpStore.js";

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

export async function sendOtp(email) {
  const otp = generateOtp();
  saveOtp(email, otp); // store before sending

  await transporter.sendMail({
    from: `"E-Parking App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Your OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto;">
        <h2 style="color: #1a3a5c;">E-Parking Verification</h2>
        <p>Your One-Time Password is:</p>
        <div style="
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 10px;
          color: #1a3a5c;
          padding: 16px;
          background: #f0f4f8;
          text-align: center;
          border-radius: 8px;
        ">
          ${otp}
        </div>
        <p style="color: #888; font-size: 13px; margin-top: 16px;">
          This code expires in <strong>5 minutes</strong>. Do not share it with anyone.
        </p>
      </div>
    `,
  });

  return otp; // optional: return for logging/testing
}