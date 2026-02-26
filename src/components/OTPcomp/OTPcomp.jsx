

import { Box, Typography, TextField, Button } from "@mui/material";


function OTPcomp({ otp, setOtp, onVerify, onResend, onBack, submitting, error }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1, textAlign: "center" }}>
      
      <Typography variant="body2" color="text.secondary">
        A verification code was sent to your email. Please enter it below.
      </Typography>
      
      <TextField
        label="Enter OTP"
        value={otp}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, "");
          setOtp(value);
        }}
        placeholder="000000"
        fullWidth
        inputProps={{ 
          maxLength: 6, 
          style: { 
            textAlign: 'center', 
            fontSize: '1.5rem', 
            letterSpacing: '0.5rem' 
          } 
        }}
        error={!!error}
        helperText={error}
      />

      <Button 
        variant="text" 
        onClick={onResend} 
        disabled={submitting}
        sx={{ textTransform: "none", alignSelf: "center" }}
      >
        Didn't get a code? Resend
      </Button>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
        <Button onClick={onBack} disabled={submitting} sx={{ color: "gray" }}>
          Back
        </Button>

        <Button 
          variant="contained" 
          onClick={() => onVerify(otp)} 
          disabled={submitting || otp.length !== 6}
          sx={{ borderRadius: "8px" }}
        >
          {submitting ? "Verifying..." : "Verify"}
        </Button>
      </Box>
    </Box>
  );
}
export default OTPcomp;