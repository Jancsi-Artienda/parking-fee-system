import React, { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button
} from "@mui/material"
import { useNavigate } from "react-router-dom"
import logo from "../../assets/logo.png" 

function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        backgroundColor: "#F5F5F5"
      }}
    >
      {/* LEFT SIDE - This matches the styling of your Login page */}
      <Box
        sx={{
          width: "50%", // Sized to match your Register/Login side panel
          backgroundColor: "#FFF6D5",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          p: 8
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="Parking Fee Logo"
          sx={{ width: "60%", maxWidth: "250px", height: "auto" }}
        />
      </Box>

      {/* RIGHT SIDE - The Form Container */}
      <Box
        sx={{
          width: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
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

            <Box component="form">
              <TextField
                fullWidth
                label="Email Address"
                placeholder="...@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
              />
              
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 3, py: 1.5, borderRadius: 2 }}
              >
                Send Reset Link
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
          </Paper>
        </Container>
      </Box>
    </Box>
  )
}

export default ForgotPassword