import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
} from "@mui/material";
import { useState } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import useAuth from "../../context/auth/useAuth";

export default function Account() {
  const { user, updateProfile } = useAuth();

  const displayName = user?.name || "John Paul";
  const displayEmail = user?.email || "delfin@gmail.com";
  const displayContact = user?.contactNumber || "09123456789";

  const [formData, setFormData] = useState({
    name: displayName,
    email: displayEmail,
    contactNumber: displayContact,
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaveMessage("");
    setSaveError("");

    if (!formData.name.trim() || !formData.email.trim() || !formData.contactNumber.trim()) {
      setSaveError("Username, email, and contact number are required.");
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
        contactNumber: formData.contactNumber.trim(),
      });
      setSaveMessage("Account details updated successfully.");
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
            <Typography>Username: {displayName}</Typography>
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
                name="name"
                value={formData.name}
                onChange={handleChange}
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
              />
            </Grid>

            {saveError && (
              <Grid item xs={12}>
                <Typography color="error">{saveError}</Typography>
              </Grid>
            )}

            {saveMessage && (
              <Grid item xs={12}>
                <Typography color="success.main">{saveMessage}</Typography>
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
