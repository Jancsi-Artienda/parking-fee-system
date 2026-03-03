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
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { toast } from "sonner";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const Login = () => {
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
        width: "100%",
        minHeight: "100vh",
        // Linear gradient from a soft yellow to a brighter gold
        background: "linear-gradient(135deg, #FFF6D5 0%, #FFD54F 100%)",
        display: "flex",
        justifyContent: "center",

      }}
    >
     
      <Box
        sx={{
          width: "80%", // Slightly larger for impact
          maxWidth: "500px",
          height: "auto",
          // Optional: adds a subtle "lift" to your logo image
          filter: "drop-shadow(0px 10px 20px rgba(0,0,0,0.1))",
          p: 20

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

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
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
              Don't have an account? <Link to="/register">Register</Link>
            </Typography>
          </Paper>
        </Container>
      </Box>



      <Box

        component="img"
        src={logo}
        alt="Parking Fee Logo"
        sx={{
          position: "absolute",
          top: 30,    // Distance from the top edge
          left: 30,  // Distance from the right edge
          width: "50%",
          maxWidth: "300px",
          height: "auto",
          filter: "drop-shadow(0px 10px 20px rgba(0,0,0,0.1))",

        }}
      />


    </Box>
  );
};

export default Login;
