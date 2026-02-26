import { useState } from "react";
import { Box, Typography, TextField, Button } from "@mui/material";

function Newpass({ onReset, loading, error }) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) return alert("Passwords do not match");
        onReset(newPassword);
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" mb={2}>Set New Password</Typography>
            {error && <Typography color="error">{error}</Typography>}
            <TextField
                fullWidth
                type="password"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                margin="normal"
                required
            />
            <TextField
                fullWidth
                type="password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                required
            />
            <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 3 }}>
                {loading ? "Updating..." : "Update Password"}
            </Button>
        </Box>
    );
}

export default Newpass;