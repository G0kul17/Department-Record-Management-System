import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import InputField from "../components/InputField";
import BlurText from "../components/ui/BlurText";
import apiClient from "../api/axiosClient";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // OTP expiry timer (5 minutes)
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Backend expects email+password here and sends an OTP
      const resp = await apiClient.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      if (resp?.needsVerification) {
        // Account not verified yet: go to verification screen
        navigate("/verify-otp", {
          state: {
            email: formData.email,
            type: "register",
            devOtp: resp.devOtp,
          },
        });
        return;
      }

      // Check if user has an active session (90-day login)
      if (resp?.sessionActive === true && resp?.token) {
        // Session is active, login directly without OTP
        login(
          {
            email: formData.email,
            role: resp.role,
            fullName: resp.fullName,
            photoUrl: resp.photoUrl,
          },
          resp.token
        );
        const dest =
          resp.role === "admin"
            ? "/admin"
            : resp.role === "staff"
            ? "/"
            : "/student";
        navigate(dest);
        return;
      }

      // No active session, proceed with OTP verification
      // Do NOT auto-fill OTP; just move to OTP step and start a 5-minute timer
      setOtp("");
      setOtpSent(true);
      setOtpExpiresAt(Date.now() + 5 * 60 * 1000);
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiClient.post("/auth/login-verify", {
        email: formData.email,
        otp,
      });
      if (data?.token && data?.role) {
        // Store session token in localStorage for future requests
        localStorage.setItem("sessionToken", data.sessionToken || "");

        login(
          {
            email: formData.email,
            role: data.role,
            fullName: data.fullName,
            photoUrl: data.photoUrl,
          },
          data.token
        );
        const dest =
          data.role === "admin"
            ? "/admin"
            : data.role === "staff"
            ? "/"
            : "/student";
        navigate(dest);
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Tick timer when on OTP step
  useEffect(() => {
    if (!otpSent || !otpExpiresAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((otpExpiresAt - Date.now()) / 1000)
      );
      setTimeLeft(remaining);
    }, 1000);
    // initialize immediately
    setTimeLeft(Math.max(0, Math.floor((otpExpiresAt - Date.now()) / 1000)));
    return () => clearInterval(interval);
  }, [otpSent, otpExpiresAt]);

  const formatMMSS = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(secs % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const COLLEGE_NAME = "Sona College Of Technology";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="glitter-card bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 ring-1 ring-slate-300/60 max-w-md w-full">
        <div className="text-center mb-3">
          <BlurText
            text={COLLEGE_NAME}
            className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 tracking-wide"
            delay={60}
            step={24}
          />
        </div>
        <h2 className="text-3xl font-bold text-center mb-6 text-slate-900 dark:text-slate-100">
          Login
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOtp}>
            <InputField
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
            <InputField
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#87CEEB] text-white py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <InputField
              label="OTP"
              type="text"
              name="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              required
            />
            <p className="text-sm text-gray-500 mb-4">
              OTP expires in {formatMMSS(timeLeft)}.
            </p>
            <button
              type="submit"
              disabled={loading || timeLeft === 0}
              className="w-full bg-[#87CEEB] text-white py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        <div className="mt-4 text-center space-y-2">
          <Link to="/forgot" className="text-blue-600 hover:underline block">
            Forgot Password?
          </Link>
          <div className="text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register-student"
              className="text-blue-600 hover:underline"
            >
              Register as Student
            </Link>
            {" or "}
            <Link
              to="/register-staff"
              className="text-blue-600 hover:underline"
            >
              Register as Staff
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

