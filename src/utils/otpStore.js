// Simple in-memory store: { email: { otp, expiresAt } }
const otpStore = new Map();

export function saveOtp(email, otp) {
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // expires in 5 minutes
  });
}

export function verifyOtp(email, inputOtp) {
  const record = otpStore.get(email);

  if (!record) return { valid: false, reason: "No OTP found for this email." };
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return { valid: false, reason: "OTP has expired." };
  }
  if (record.otp !== inputOtp) {
    return { valid: false, reason: "Incorrect OTP." };
  }

  otpStore.delete(email); // one-time use — delete after success
  return { valid: true };
}