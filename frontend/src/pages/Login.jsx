import React, { useEffect, useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import InputField from "../components/InputField";
import apiClient from "../api/axiosClient";
import ErrorMessage from "../components/ErrorMessage";
import AuthSplitLayout from "../components/AuthSplitLayout";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoginSuccess, setIsLoginSuccess] = useState(false);
  // OTP expiry timer (5 minutes)
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect already-authenticated users to their dashboard
  if (user) {
    const dest = user.role === "admin" ? "/admin" : "/";
    return <Navigate to={dest} replace />;
  }

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
        setIsLoginSuccess(true);
        const dest =
          resp.role === "admin"
            ? "/admin"
            : "/";
        navigate(dest, { state: { loginSuccess: true } });
        return;
      }

      // No active session, proceed with OTP verification
      // Do NOT auto-fill OTP; just move to OTP step and start a 5-minute timer
      setOtp("");
      setOtpSent(true);
      setOtpExpiresAt(Date.now() + 5 * 60 * 1000);
    } catch (err) {
      setError(err);
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
        setIsLoginSuccess(true);
        const dest =
          data.role === "admin"
            ? "/admin"
            : "/";
        navigate(dest, { state: { loginSuccess: true } });
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err);
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

  return (
    <>
      {!isLoginSuccess && (
        <AuthSplitLayout
          title="Welcome Back"
          subtitle={
            otpSent
              ? "Enter your one-time password to complete sign in."
              : "Enter your email and password to access your account."
          }
        >
          <ErrorMessage error={error} className="mb-5 rounded-xl" />

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
                labelClassName="mb-1 text-sm font-medium text-slate-600"
                inputClassName="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base shadow-none focus:border-slate-400 focus:ring-slate-300"
              />
              <InputField
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                labelClassName="mb-1 text-sm font-medium text-slate-600"
                inputClassName="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base shadow-none focus:border-slate-400 focus:ring-slate-300"
              />

              <div className="mb-5 flex items-center justify-between text-sm text-slate-500">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                  />
                  Remember me
                </label>
                <Link to="/forgot" className="font-medium text-slate-700 hover:underline">
                  Forgot Password
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-black px-4 py-3 text-base font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Please wait..." : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <InputField
                label="One-Time Password"
                type="text"
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                required
                labelClassName="mb-1 text-sm font-medium text-slate-600"
                inputClassName="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base shadow-none focus:border-slate-400 focus:ring-slate-300"
              />

              <p
                className={`mb-5 text-sm ${
                  timeLeft === 0 ? "text-red-500" : "text-slate-500"
                }`}
              >
                OTP expires in {formatMMSS(timeLeft)}.
              </p>

              <button
                type="submit"
                disabled={loading || timeLeft === 0}
                className="w-full rounded-xl bg-black px-4 py-3 text-base font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Verify and Sign In"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setOtpExpiresAt(null);
                  setTimeLeft(0);
                }}
                className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Use different credentials
              </button>
            </form>
          )}

          {!otpSent && (
            <p className="mt-8 text-center text-sm text-slate-600">
              Need help with password reset?{" "}
              <Link to="/forgot" className="font-semibold text-slate-800 hover:underline">
                Send OTP
              </Link>
            </p>
          )}
        </AuthSplitLayout>
      )}
    </>
  );
};

export default Login;


