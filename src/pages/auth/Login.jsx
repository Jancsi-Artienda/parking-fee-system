import { useState } from "react";
import useAuth from "../../context/auth/useAuth";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      toast.success("Logged in successfully");
      navigate("/dashboard");
    } catch (err) {
      if (err?.data?.message) {
        setError(err.data.message);
        toast.error(err.data.message);
      } else {
        setError("Login failed. Please try again.");
        toast.error("Login failed. Please try again.");
      }
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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Parking Fee Login
            </Typography>

            <Typography color="text.secondary" mb={3}>
              Welcome back! Please sign in to continue
            </Typography>

            {error && (
              <Typography color="error" mb={2}>
                {error}
              </Typography>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 1,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                  }
                  label="Remember me"
                />

                <Link to="/forgotpassword" style={{ fontSize: 14 }}>
                  Forgot Password
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, py: 1.2, borderRadius: 2 }}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </Box>

            <Typography align="center" sx={{ mt: 2 }}>
              Don&apos;t have an account? <Link to="/register">Register</Link>
            </Typography>
          </Paper>
        </Container>
      </Box>

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
    </Box>
  );
};

export default Login;
