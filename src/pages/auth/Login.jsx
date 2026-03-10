import { useState } from "react";
import useAuth from "../../context/auth/useAuth";
import { Link, useNavigate } from "react-router-dom";
import background from "../../assets/background.png";
import logo from "../../assets/logo.png";
import {toastSuccess, toastError} from "../../utils/swalToast";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      await login(email, password, rememberMe);
      toastSuccess("Logged in successfully");
      navigate("/dashboard");
    } catch (err) {
      if (err?.data?.message) {
        setError(err.data.message);
        toastError(err.data.message);
      } else {
        const fallbackMessage = err?.message || "Login failed. Please try again.";
        setError(fallbackMessage);
        toastError(fallbackMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="  relative w-full min-h-screen flex justify-center items-center ">

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
                 Login
              </h1>
              <p className="text-gray-500 mb-4 text-center">
                Please sign in to continue.
              </p>
            </>
            {/* ONE single form */}
            <form onSubmit={handleSubmit} className="w-full">
              {/* email*/}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-900 text-gray-800 placeholder-gray-400"
                />
              </div>

              {/* Password */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              </div>



              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-blue-900 cursor-pointer"
                  />
                  <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600 cursor-pointer">
                    Remember me
                  </label>
                </div>

                <Link
                  to="/forgotpassword"
                  className="text-sm text-blue-800 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 rounded-2xl text-white font-semibold text-sm transition-colors duration-200 bg-[#1a237e] hover:bg-[#0d47a1]"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <div className="mb-4 text-center mt-4">

                <Link

                  to="/register"

                  className="text-sm text-blue-800 hover:underline"

                >

                  Don't have an account? Register

                </Link>

              </div>


            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;