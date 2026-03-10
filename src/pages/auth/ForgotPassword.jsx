import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../../services/api";
import logo from "../../assets/logo.png";
import OTPcomp from "../../components/OTPcomp/OTPcomp";
import Newpass from "../../components/OTPcomp/Newpass";
import background from "../../assets/background.png";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [submittingOtp, setSubmittingOtp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) { setError("Email is required."); return; }
    if (!/^[^\s@]+@gmail\.com$/i.test(normalizedEmail)) {
      setError("Email must be a valid @gmail.com address."); return;
    }
    setLoading(true);
    try {
      await api.forgotPassword(normalizedEmail);
      await Swal.fire({ title: "OTP Sent", text: "Check your email for the verification code.", icon: "success" });
      setStep("otp");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send reset request.");
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (enteredOtp) => {
    setOtpError(""); setSubmittingOtp(true);
    try {
      await api.verifyOtp(email, enteredOtp);
      await Swal.fire({ title: "Verified", text: "OTP verified successfully.", icon: "success" });
      setStep("reset");
    } catch (err) {
      setOtpError(err?.data?.message || "Invalid OTP. Please try again.");
    } finally { setSubmittingOtp(false); }
  };

  const handleResetPassword = async (newPassword) => {
    setLoading(true); setError("");
    try {
      await api.resetPassword(email, newPassword);
      await Swal.fire({ title: "Success!", text: "Password updated. You can now login.", icon: "success" });
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to reset password.");
    } finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    setOtpError("");
    try {
      await api.forgotPassword(email.trim().toLowerCase());
      await Swal.fire({ title: "OTP Resent", text: "Check your email for the new code.", icon: "success" });
    } catch (err) {
      setOtpError(err?.response?.data?.message || "Failed to resend OTP.");
    }
  };

  return (
    <div
      className=" relative w-half min-h-screen  flex justify-center items-center"
    >
      <div className="absolute inset-0 overflow-hidden ">
        <img src={background} alt="background" className="absolute inset-0 -z-10 h-full w-full object-cover   " />
      </div>


      <div className="w-full max-w-lg mx-auto px-4 ">
        <div className="p-8 rounded-3xl border border-white/30 bg-white/80 shadow-lg backdrop-blur-xl">
          <div className="flex flex-col items-center mb-6">

            {/* Logo */}
            <img
              src={logo}
              alt="Parking Fee Logo"
              className=" max-w-[220px] h-auto mb-4 drop-shadow-md"
            />

            {/* Header — hidden on reset step */}
            {step !== "reset" && (
              <>
                <h1 className="text-3xl font-bold mb-1 text-black-900">
                  Forgot Password
                </h1>
                <p className="text-gray-500 mb-4 text-center">
                  Enter your email address to reset your password.
                </p>
              </>
            )}

            {/* Error */}
            {error && (
              <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
            )}

            {/* STEP: EMAIL */}
            {step === "email" && (
              <form onSubmit={handleSubmit} className="w-full">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="your@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-900 text-gray-800 placeholder-gray-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 rounded-2xl text-white font-semibold text-sm transition-colors duration-200 bg-[#1a237e] hover:bg-[#0d47a1]"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>

                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="text-sm text-blue-800 hover:underline"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}

            {/* STEP: OTP */}
            {step === "otp" && (
              <OTPcomp
                otp={otp}
                setOtp={setOtp}
                onVerify={handleVerifyOtp}
                onResend={handleResendOtp}
                onBack={() => setStep("email")}
                submitting={submittingOtp}
                error={otpError}
              />
            )}

            {/* STEP: RESET PASSWORD */}
            {step === "reset" && (
              <Newpass
                onReset={handleResetPassword}
                loading={loading}
                error={error}
              />
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;