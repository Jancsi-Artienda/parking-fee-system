
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import useAuth from "../../context/auth/useAuth";
import logo from "../../assets/logo.png";
import {
  sanitizeRegistrationField,
  validateRegistrationField,
  validateRegistrationForm,
} from "../../utils/validators";
import background from "../../assets/background.png";
import { Eye, EyeOff } from "lucide-react";

const DEFAULT_REGISTER_VEHICLE_NUMBER = 1;

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    username: "",
    vehicleNumber: String(DEFAULT_REGISTER_VEHICLE_NUMBER),
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
        vehicleNumber: DEFAULT_REGISTER_VEHICLE_NUMBER,
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
    <div className=" relative w-full min-h-screen flex justify-center items-center">

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={background}
          alt="background"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
      </div>

      <div className="w-full max-w-lg mx-auto px-4">
        <div className="p-8 rounded-3xl border border-white/30 bg-white/80 shadow-lg backdrop-blur-xl">
          <div className="flex flex-col items-center mb-6">

            {/* Logo */}
            <img
              src={logo}
              alt="Parking Fee Logo"
              className="w-full max-w-[220px] h-auto mb-4 drop-shadow-md"
            />

            {/* Error */}
            {error && (
              <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
            )}
            <>
              <h1 className="text-3xl font-bold mb-1 text-black-900">

              </h1>
              <p className="text-gray-500 mb-4 text-center">
                Please sign in to continue.
              </p>
            </>
            {/* ONE single form */}
            <form onSubmit={handleSubmit} className="w-full">

              {/* FirstName and LastName*/}
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-900 text-gray-800 placeholder-gray-400"
                  />
                  {touchedFields.firstName && fieldErrors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    name="lastName"
                    placeholder="Paul"
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-900 text-gray-800 placeholder-gray-400"
                  />
                  {touchedFields.lastName && fieldErrors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>
              
              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address:
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    placeholder="...@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-900 text-gray-800 placeholder-gray-400"
                  />
                  {touchedFields.lastName && fieldErrors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Contact Number: */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number:
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="contactNumber"
                    placeholder="09XXXXXXXXX"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-900 text-gray-800 placeholder-gray-400"
                  />
                  {touchedFields.contactNumber && fieldErrors.contactNumber && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.contactNumber}</p>
                  )}
                </div>
              </div>

              {/* Contact Number: */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username:
                </label>
                <div className="relative">
                  <input
                    name="username"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-900 text-gray-800 placeholder-gray-400"
                  />
                  {touchedFields.username && fieldErrors.username && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 mb-4">

                {/* Password */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-900 text-gray-800 placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {touchedFields.password && fieldErrors.password && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-900 text-gray-800 placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {touchedFields.confirmPassword && fieldErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
                  )}
                </div>

              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 rounded-2xl text-white font-semibold text-sm transition-colors duration-200 bg-[#1a237e] hover:bg-[#0d47a1] mt-6"
              >
                {loading ? "Registering..." : "Register"}
              </button>

              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-sm text-blue-800 hover:underline"
                >
                  Back to Login
                </button>
              </div>


            </form>
          </div>
        </div>
      </div>
    </div>


  );
};

export default Register;
