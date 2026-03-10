function OTPcomp({ otp, setOtp, onVerify, onResend, onBack, submitting, error }) {
  return (
    <div className="flex flex-col gap-4 mt-1 text-center w-full">

      <p className="text-sm text-gray-500">
        A verification code was sent to your email. Please enter it below.
      </p>

      {/* OTP Input */}
      <div>
        <input
          type="text"
          value={otp}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            setOtp(value);
          }}
          placeholder="000000"
          maxLength={6}
          className={`w-full px-4 py-3 border rounded-xl bg-white/70 focus:outline-none focus:ring-2 text-center text-2xl tracking-[0.5rem] placeholder-gray-300
            ${error
              ? "border-red-500 focus:ring-red-400"
              : "border-gray-300 focus:ring-blue-900"
            }`}
        />
        {error && (
          <p className="text-red-500 text-xs mt-1 text-left">{error}</p>
        )}
      </div>

      {/* Resend */}
      <button
        type="button"
        onClick={onResend}
        disabled={submitting}
        className="text-sm text-blue-800 hover:underline self-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Didn't get a code? Resend
      </button>

      {/* Back & Verify */}
      <div className="flex gap-2 justify-end mt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>

        <button
          type="button"
          onClick={() => onVerify(otp)}
          disabled={submitting || otp.length !== 6}
          className="px-6 py-2 rounded-xl text-white text-sm font-semibold bg-[#1a237e] hover:bg-[#0d47a1] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Verifying..." : "Verify"}
        </button>
      </div>

    </div>
  );
}

export default OTPcomp;