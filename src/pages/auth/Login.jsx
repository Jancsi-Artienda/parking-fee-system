import { useState } from "react";
import useAuth from "../../context/auth/useAuth";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import background from "../../assets/background.png";
import logo from "../../assets/logo.png";
import { toast } from "sonner";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const Login = () => {
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      await login(email, password, rememberMe);
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
        width: "100%",
        minHeight: "100vh",
        // Replace the gradient with your image path
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",      // Ensures the image covers the whole area
        backgroundPosition: "center", // Keeps the image centered
        backgroundRepeat: "no-repeat",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >

      <Container maxWidth="sm">
        <Paper elevation={6} sx={{
          p: 4,
          borderRadius: 3,
          // Increased from 0.73 to 0.85 for better readability
          backgroundColor: 'rgba(239, 239, 239, 0.85)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)', // Matched blur for Safari
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}>
          < Box sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 3
          }}>
            <Box
              component="img"
              src={logo}
              alt="Parking Fee Logo"
              sx={{
                width: "100%",        // Adjusted for internal container fit
                maxWidth: "220px",
                height: "auto",
                filter: "drop-shadow(0px 4px 10px rgba(0,0,0,0.1))",
                // position: "absolute" REMOVED to keep it inside the flow
              }}
            />
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
                type={showPassword ? "text" : "password"}
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center", // Vertically aligns the checkbox with the link text
                  mt: 1,
                  width: "100%",
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontSize: "14px" }}>
                      Remember me
                    </Typography>
                  }
                  sx={{ margin: 0 }}
                />
              </Box>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: -4 }}>
                <Link to="/forgotpassword" style={{ fontSize: 14 }}>
                  Forgot Password
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  py: 1.2,
                  borderRadius: "16px",
                  // Add these lines below:
                  backgroundColor: '#1a237e', // Replace with your sidebar's HEX code
                  '&:hover': {
                    backgroundColor: '#0d47a1', // A slightly darker shade for the hover effect
                  },
                }} F
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </Box>

            <Typography align="center" sx={{ mt: 2 }}>
              Don't have an account? <Link to="/register">Register</Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>


  );
};

export default Login;
