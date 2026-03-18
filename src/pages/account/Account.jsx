import { useEffect, useState } from "react";
import { Eye, EyeOff, User } from "lucide-react";
import Swal from "sweetalert2";
import useAuth from "../../context/auth/useAuth";
import {
  sanitizeAccountField,
  validateAccountField,
  validateAccountForm,
  validateAccountPasswordFields,
} from "../../utils/validators";

// ✅ Defined OUTSIDE component — prevents remount on every keystroke
const InputField = ({ label, name, type = "text", value, onChange, onBlur, error, helperText, inputProps = {} }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-semibold text-gray-700">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all
        ${error
          ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
          : "border-gray-200 bg-gray-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        }`}
      {...inputProps}
    />
    {error && helperText && (
      <p className="text-xs text-red-500 mt-0.5">{helperText}</p>
    )}
  </div>
);

// ✅ Defined OUTSIDE component — prevents remount on every keystroke
const PasswordField = ({ label, name, value, onChange, onBlur, error, helperText, show, onToggle }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-semibold text-gray-700">{label}</label>
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-sm outline-none transition-all
          ${error
            ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
            : "border-gray-200 bg-gray-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          }`}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
    {error && helperText && (
      <p className="text-xs text-red-500 mt-0.5">{helperText}</p>
    )}
  </div>
);

export default function Account() {
  const { user, updateProfile, changePassword } = useAuth();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    contactNumber: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        username: user.username || "",
        name: user.name || "",
        email: user.email || "",
        contactNumber: user.contactNumber || "",
      }));
    }
  }, [user]);

  const isPasswordField = (name) =>
    ["currentPassword", "newPassword", "confirmPassword"].includes(name);

  const getFieldError = (name, nextFormData) => {
    if (isPasswordField(name)) {
      return validateAccountPasswordFields(nextFormData)[name] || "";
    }
    return validateAccountField(name, nextFormData[name]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = sanitizeAccountField(name, value);
    const nextFormData = { ...formData, [name]: nextValue };
    setFormData(nextFormData);

    if (touchedFields[name]) {
      const nextError = getFieldError(name, nextFormData);
      setFieldErrors((prev) => ({ ...prev, [name]: nextError }));
      if (isPasswordField(name)) {
        setFieldErrors((prev) => ({
          ...prev,
          ...validateAccountPasswordFields(nextFormData),
        }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    const nextError = getFieldError(name, { ...formData, [name]: value });
    setFieldErrors((prev) => ({ ...prev, [name]: nextError }));
    if (isPasswordField(name)) {
      setFieldErrors((prev) => ({
        ...prev,
        ...validateAccountPasswordFields({ ...formData, [name]: value }),
      }));
    }
  };

  const handleSave = async () => {
    setSaveError("");
    const passwordErrors = validateAccountPasswordFields(formData);
    const validationErrors = { ...validateAccountForm(formData), ...passwordErrors };
    const wantsPasswordChange = Boolean(
      formData.currentPassword || formData.newPassword || formData.confirmPassword
    );

    setFieldErrors(validationErrors);
    setTouchedFields({
      username: true,
      name: true,
      email: true,
      contactNumber: true,
      currentPassword: wantsPasswordChange,
      newPassword: wantsPasswordChange,
      confirmPassword: wantsPasswordChange,
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
      if (wantsPasswordChange) {
        await changePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        });
      }
      await Swal.fire({
        title: "Saved",
        text: wantsPasswordChange
          ? "Account details and password updated successfully."
          : "Account details updated successfully.",
        icon: "success",
        confirmButtonText: "OK",
      });
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err) {
      setSaveError(err?.data?.message || err?.message || "Failed to update account details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">

      {/* Account Details Card */}
      <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
          <User size={44} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Account Details</h2>
        <div className="text-center text-sm text-gray-600 space-y-1">
          <p>Username: <span className="font-medium text-gray-800">{user?.username || "-"}</span></p>
          <p>Full name: <span className="font-medium text-gray-800">{user?.name || "-"}</span></p>
          <p>Email address: <span className="font-medium text-gray-800">{user?.email || "-"}</span></p>
          <p>Contact number: <span className="font-medium text-gray-800">{user?.contactNumber || "-"}</span></p>
        </div>
      </div>

      {/* Change Account Details Card */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Change Account Details</h2>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField
            label="Username:"
            name="username"
            value={formData.username}
            onChange={handleChange}
            onBlur={handleBlur}
            error={Boolean(touchedFields.username && fieldErrors.username)}
            helperText={fieldErrors.username}
          />
          <InputField
            label="Full Name:"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={Boolean(touchedFields.name && fieldErrors.name)}
            helperText={fieldErrors.name}
          />
          <InputField
            label="Email address:"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={Boolean(touchedFields.email && fieldErrors.email)}
            helperText={fieldErrors.email}
          />
          <InputField
            label="Contact number:"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            error={Boolean(touchedFields.contactNumber && fieldErrors.contactNumber)}
            helperText={fieldErrors.contactNumber}
            inputProps={{ maxLength: 11, inputMode: "numeric" }}
          />
        </div>

        {/* Password Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          <PasswordField
            label="Current Password:"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={Boolean(touchedFields.currentPassword && fieldErrors.currentPassword)}
            helperText={fieldErrors.currentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent((p) => !p)}
          />
          <PasswordField
            label="New Password:"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={Boolean(touchedFields.newPassword && fieldErrors.newPassword)}
            helperText={fieldErrors.newPassword}
            show={showNew}
            onToggle={() => setShowNew((p) => !p)}
          />
          <PasswordField
            label="Confirm Password:"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={Boolean(touchedFields.confirmPassword && fieldErrors.confirmPassword)}
            helperText={fieldErrors.confirmPassword}
            show={showConfirm}
            onToggle={() => setShowConfirm((p) => !p)}
          />
        </div>

        {/* Error */}
        {saveError && (
          <p className="text-sm text-red-500 mt-4">{saveError}</p>
        )}

        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2.5 rounded-2xl bg-[#1a237e] hover:bg-[#0d47a1] text-white text-sm font-semibold transition-colors duration-200 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

    </div>
  );
}