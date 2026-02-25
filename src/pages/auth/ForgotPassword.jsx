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

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    try {
      const response = await AuthService.forgotPassword(normalizedEmail);
      await Swal.fire({
        title: "Request Received",
        text: response?.data?.message || "If an account exists for this email, a reset link has been sent.",
        icon: "success",
        confirmButtonText: "OK",
      });
      navigate("/");
    } catch (err) {
      setError(err?.data?.message || "Failed to send reset request.");
    } finally {
      setLoading(false);
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
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Forgot Password
            </Typography>

            <Typography color="text.secondary" mb={3}>
              Enter your email address to reset your password.
            </Typography>

            {error && (
              <Typography color="error" mb={2}>
                {error}
              </Typography>
            )}

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
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Button variant="text" onClick={() => navigate("/")} sx={{ textTransform: "none" }}>
                  Back to Login
                </Button>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}

export default ForgotPassword;
