import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
} from "@mui/material";
import { useEffect, useState } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Swal from "sweetalert2";
import useAuth from "../../context/auth/useAuth";
import {
  sanitizeAccountField,
  validateAccountField,
  validateAccountForm,
} from "../../utils/validators";

export default function Account() {
  const { user, updateProfile } = useAuth();

  const displayUsername = user?.username || "";
  const displayName = user?.name || "";
  const displayEmail = user?.email || "";
  const displayContact = user?.contactNumber || "";

  const [formData, setFormData] = useState({
    username: displayUsername,
    name: displayName,
    email: displayEmail,
    contactNumber: displayContact,
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      username: user?.username || "",
      name: user?.name || "",
      email: user?.email || "",
      contactNumber: user?.contactNumber || "",
    }));
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = sanitizeAccountField(name, value);
    setFormData((prev) => ({ ...prev, [name]: nextValue }));

    if (touchedFields[name]) {
      const nextError = validateAccountField(name, nextValue);
      setFieldErrors((prev) => ({ ...prev, [name]: nextError }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouchedFields((prev) => ({ ...prev, [name]: true }));

    const nextError = validateAccountField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: nextError }));
  };

  const handleSave = async () => {
    setSaveError("");

    const validationErrors = validateAccountForm(formData);
    setFieldErrors(validationErrors);
    setTouchedFields({
      username: true,
      name: true,
      email: true,
      contactNumber: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      setSaveError("Please fix the highlighted fields.");
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        username: formData.username.trim(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        contactNumber: formData.contactNumber.trim(),
      });
      await Swal.fire({
        title: "Saved",
        text: "Account details updated successfully.",
        icon: "success",
        confirmButtonText: "OK",
      });
      setFormData((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      setSaveError(err?.data?.message || err?.message || "Failed to update account details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <Paper
          sx={{
            p: 4,
            borderRadius: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            bgcolor: "#F2F2F2",
          }}
        >
          <AccountCircleIcon sx={{ fontSize: 80 }} />

          <Typography variant="h5" fontWeight="bold">
            Account Details
          </Typography>

          <Box sx={{ textAlign: "center" }}>
            <Typography>Username: {displayUsername || "-"}</Typography>
            <Typography>Full name: {displayName || "-"}</Typography>
            <Typography>Email address: {displayEmail}</Typography>
            <Typography>Contact number: {displayContact}</Typography>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: "#F2F2F2",
          }}
        >
          <Typography variant="h5" fontWeight="bold" mb={3}>
            Change Account Details
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" fontWeight="bold" mb={0.5}>
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

            <Grid item xs={12} md={6}>
              <Typography variant="body2" fontWeight="bold" mb={0.5}>
                Full Name
              </Typography>
              <TextField
                fullWidth
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touchedFields.name && fieldErrors.name)}
                helperText={touchedFields.name ? fieldErrors.name : ""}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" fontWeight="bold" mb={0.5}>
                Password
              </Typography>
              <TextField
                fullWidth
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" fontWeight="bold" mb={0.5}>
                Email address
              </Typography>
              <TextField
                fullWidth
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touchedFields.email && fieldErrors.email)}
                helperText={touchedFields.email ? fieldErrors.email : ""}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" fontWeight="bold" mb={0.5}>
                Contact number
              </Typography>
              <TextField
                fullWidth
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touchedFields.contactNumber && fieldErrors.contactNumber)}
                helperText={touchedFields.contactNumber ? fieldErrors.contactNumber : ""}
                inputProps={{ maxLength: 11, inputMode: "numeric" }}
              />
            </Grid>

            {saveError && (
              <Grid item xs={12}>
                <Typography color="error">{saveError}</Typography>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mt: 2,
                }}
              >
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ px: 4, borderRadius: 3, textTransform: "none" }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
}
