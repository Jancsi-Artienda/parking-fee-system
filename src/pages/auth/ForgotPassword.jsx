import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import AuthService from "../../services/AuthService";
import logo from "../../assets/logo.png";
import OTPcomp from "../../components/OTPcomp/OTPcomp";
import Newpass from "../../components/OTPcomp/Newpass";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [step, setStep] = useState("email"); // "email" | "otp" | "reset"
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [submittingOtp, setSubmittingOtp] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    if (!/^[^\s@]+@gmail\.com$/i.test(normalizedEmail)) {
      setError("Email must be a valid @gmail.com address.");
      return;
    }

    setLoading(true);
    //Forgotpassword
    try {
      await AuthService.forgotPassword(normalizedEmail);

      await Swal.fire({
        title: "OTP Sent",
        text: "Check your email for the verification code.",
        icon: "success",
      });

      setStep("otp");

    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to send reset request."
      );
    } finally {
      setLoading(false);
    }
  };
  // 1. Define handleVerifyOtp
  const handleVerifyOtp = async (enteredOtp) => {
    setOtpError("");
    setSubmittingOtp(true);
    try {
      await AuthService.verifyOtp(email, enteredOtp);
      await Swal.fire({
        title: "Verified",
        text: "OTP verified successfully.",
        icon: "success",
      });
      setStep("reset");  // Adjust route as needed
    } catch (err) {
      setOtpError(err?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setSubmittingOtp(false);
    }

  };

  const handleResetPassword = async (newPassword) => {
    setLoading(true);
    setError("");
    try {
      // Replace with your actual AuthService method
      await AuthService.resetPassword(email, newPassword);

      await Swal.fire({
        title: "Success!",
        text: "Password updated. You can now login.",
        icon: "success",
      });
      navigate("/"); // Redirect to login
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Define handleResendOtp
  const handleResendOtp = async () => {
    setOtpError("");
    try {
      await AuthService.forgotPassword(email.trim().toLowerCase());
      await Swal.fire({
        title: "OTP Resent",
        text: "Check your email for the new code.",
        icon: "success",
      });
    } catch (err) {
      setOtpError(err?.response?.data?.message || "Failed to resend OTP.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        backgroundColor: "#F5F5F5",
      }}
    >
      <Box
        sx={{
          width: "50%",
          backgroundColor: "#FFF6D5",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          p: 8,
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="Parking Fee Logo"
          sx={{ width: "60%", maxWidth: "250px", height: "auto" }}
        />
      </Box>

      <Box
        sx={{
          width: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, borderRadius: 3 }}>

            {/* 1. Header Logic: Hide if we are on the reset step */}
            {step !== "reset" && (
              <>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  Forgot Password
                </Typography>

                <Typography color="text.secondary" mb={3}>
                  Enter your email address to reset your password.
                </Typography>
              </>
            )}

            {/* 2. Error Display */}
            {error && (
              <Typography color="error" mb={2}>
                {error}
              </Typography>
            )}

            {/* 3. STEP: EMAIL */}
            {step === "email" && (
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email Address"
                  placeholder="...@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{ mt: 3, py: 1.5, borderRadius: 2 }}
                >
                  {loading ? "Sending..." : "Send OTP"}
                </Button>

                <Box sx={{ mt: 2, textAlign: "center" }}>
                  <Button
                    variant="text"
                    onClick={() => navigate("/")}
                    sx={{ textTransform: "none" }}
                  >
                    Back to Login
                  </Button>
                </Box>
              </Box>
            )}

            {/* 4. STEP: OTP */}
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

            {/* 5. STEP: RESET PASSWORD */}
            {step === "reset" && (
              <Newpass
                onReset={handleResetPassword}
                loading={loading}
                error={error}
              />
            )}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}

export default ForgotPassword;
