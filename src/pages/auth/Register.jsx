import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  InputAdornment,
  IconButton,
  Grid,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import useAuth from "../../context/auth/useAuth";
import logo from "../../assets/logo.png";
import {
  sanitizeRegistrationField,
  validateRegistrationField,
  validateRegistrationForm,
  getPasswordStrength,
} from "../../utils/validators";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    username: "",
    vehicleNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const { register } = useAuth();
  const passwordChecks = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = sanitizeRegistrationField(name, value);

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    if (touchedFields[name]) {
      const nextError = validateRegistrationField(name, nextValue);
      setFieldErrors((prev) => ({
        ...prev,
        [name]: nextError,
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const nextError = validateRegistrationField(name, value);

    setTouchedFields((prev) => ({
      ...prev,
      [name]: true,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: nextError,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateRegistrationForm(formData);
    setFieldErrors(validationErrors);
    setTouchedFields(
      Object.keys(formData).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {})
    );

    if (Object.keys(validationErrors).length > 0) {
      setError("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        contactNumber: formData.contactNumber.trim(),
        username: formData.username.trim(),
        vehicleNumber: Number(formData.vehicleNumber),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };

      await register(payload);
      await Swal.fire({
        title: "Registered Successfully",
        text: "Your account has been created.",
        icon: "success",
        confirmButtonText: "OK",
      });
      navigate("/");
    } catch (err) {
      if (err?.data?.message) {
        setError(err.data.message);
      } else {
        setError("Registration failed. Please try again.");
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
          width: "35%",
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
              Create your account
            </Typography>

            <Typography color="text.secondary" mb={3}>
              Please fill in your information to create an account
            </Typography>

            {error && (
              <Typography color="error" mb={2}>
                {error}
              </Typography>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid size={6}>
                  <Typography variant="body2" fontWeight="bold">
                    First Name
                  </Typography>
                  <TextField
                    fullWidth
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touchedFields.firstName && fieldErrors.firstName)}
                    helperText={touchedFields.firstName ? fieldErrors.firstName : ""}
                  />
                </Grid>

                <Grid size={6}>
                  <Typography variant="body2" fontWeight="bold">
                    Last Name
                  </Typography>
                  <TextField
                    fullWidth
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touchedFields.lastName && fieldErrors.lastName)}
                    helperText={touchedFields.lastName ? fieldErrors.lastName : ""}
                  />
                </Grid>

                <Grid size={12}>
                  <Typography variant="body2" fontWeight="bold">
                    Email Address
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    name="email"
                    placeholder="...@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touchedFields.email && fieldErrors.email)}
                    helperText={touchedFields.email ? fieldErrors.email : ""}
                  />
                </Grid>

                <Grid size={12}>
                  <Typography variant="body2" fontWeight="bold">
                    Contact Number
                  </Typography>
                  <TextField
                    fullWidth
                    type="tel"
                    name="contactNumber"
                    placeholder="09XXXXXXXXX"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touchedFields.contactNumber && fieldErrors.contactNumber)}
                    helperText={touchedFields.contactNumber ? fieldErrors.contactNumber : ""}
                    inputProps={{ maxLength: 11, inputMode: "numeric" }}
                  />
                </Grid>

                <Grid size={6}>
                  <Typography variant="body2" fontWeight="bold">
                    Username
                  </Typography>
                  <TextField
                    fullWidth
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touchedFields.username && fieldErrors.username)}
                    helperText={touchedFields.username ? fieldErrors.username : ""}
                  />
                </Grid>

                <Grid size={6}>
                  <Typography variant="body2" fontWeight="bold">
                    Number of Vehicles
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touchedFields.vehicleNumber && fieldErrors.vehicleNumber)}
                    helperText={touchedFields.vehicleNumber ? fieldErrors.vehicleNumber : ""}
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                <Grid size={6}>
                  <Typography variant="body2" fontWeight="bold">
                    Password
                  </Typography>
                  <TextField
                    fullWidth
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touchedFields.password && fieldErrors.password)}
                    helperText={touchedFields.password ? fieldErrors.password : ""}
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
                  <Box mt={1}>
                    <Typography
                      variant="caption"
                      color={passwordChecks.hasUppercase ? "success.main" : "error.main"}
                    >
                      At least 1 uppercase letter
                    </Typography>
                    <br />
                    <Typography
                      variant="caption"
                      color={passwordChecks.hasLowercase ? "success.main" : "error.main"}
                    >
                      At least 1 lowercase letter
                    </Typography>
                    <br />
                    <Typography
                      variant="caption"
                      color={passwordChecks.hasNumber ? "success.main" : "error.main"}
                    >
                      At least 1 number
                    </Typography>
                    <br />
                    <Typography
                      variant="caption"
                      color={passwordChecks.hasMinLength ? "success.main" : "error.main"}
                    >
                      Minimum 8 characters
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={6}>
                  <Typography variant="body2" fontWeight="bold">
                    Confirm Password
                  </Typography>
                  <TextField
                    fullWidth
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touchedFields.confirmPassword && fieldErrors.confirmPassword)}
                    helperText={touchedFields.confirmPassword ? fieldErrors.confirmPassword : ""}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid size={12}>
                  <Box display="flex" justifyContent="center">
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      sx={{ mt: 3, py: 1.2, px: 5, borderRadius: 2 }}
                    >
                      {loading ? "Registering..." : "Register"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Register;
