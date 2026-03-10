import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function Newpass({ onReset, loading, error }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return alert("Passwords do not match");
    onReset(newPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">

      <h2 className="text-lg font-semibold mb-4 text-gray-900">
        Set New Password
      </h2>

      {error && (
        <p className="text-red-500 text-sm mb-3">{error}</p>
      )}

      {/* New Password */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          New Password
        </label>
        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="Enter new password"
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-900 text-gray-800 placeholder-gray-400"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          >
            {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm new password"
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-900 text-gray-800 placeholder-gray-400"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          >
            {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 py-3 rounded-2xl text-white font-semibold text-sm transition-colors duration-200 bg-[#1a237e] hover:bg-[#0d47a1] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Updating..." : "Update Password"}
      </button>

    </form>
  );
}

export default Newpass;