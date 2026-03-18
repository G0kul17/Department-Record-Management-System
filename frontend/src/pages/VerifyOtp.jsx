import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import InputField from "../components/InputField";
import apiClient from "../api/axiosClient";
import { useAuth } from "../hooks/useAuth";
import ErrorMessage from "../components/ErrorMessage";
import AuthSplitLayout from "../components/AuthSplitLayout";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const type = location.state?.type || "register"; // register | login | forgot
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // 5-minute OTP expiry timer
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const email = location.state?.email;
  const { login } = useAuth();

  useEffect(() => {
    if (!email) navigate("/forgot");
    // Start a 5-minute timer upon landing on this screen
    setOtp("");
    setOtpExpiresAt(Date.now() + 5 * 60 * 1000);
  }, [email, navigate]);

  useEffect(() => {
    if (!otpExpiresAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((otpExpiresAt - Date.now()) / 1000)
      );
      setTimeLeft(remaining);
    }, 1000);
    setTimeLeft(Math.max(0, Math.floor((otpExpiresAt - Date.now()) / 1000)));
    return () => clearInterval(interval);
  }, [otpExpiresAt]);

  const formatMMSS = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(secs % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (type === "login") {
        const data = await apiClient.post("/auth/login-verify", {
          email,
          otp: otp.trim(),
        });
        // Expect: { token, role }
        if (data?.token && data?.role) {
          login(
            { email, role: data.role, fullName: data.fullName },
            data.token
          );
          const dest =
            data.role === "admin"
              ? "/admin"
              : "/";
          navigate(dest);
          return;
        }
        navigate("/");
      } else if (type === "forgot") {
        // Validate the OTP now so errors surface here, not on the reset screen
        await apiClient.post("/auth/forgot-verify", { email, otp: otp.trim() });
        navigate("/reset", { state: { email, otp: otp.trim() } });
      } else {
        // registration verification -> backend returns token + role
        const data = await apiClient.post("/auth/verify", {
          email,
          otp: otp.trim(),
        });
        if (data?.token && data?.role) {
          login(
            { email, role: data.role, fullName: data.fullName },
            data.token
          );
          const dest =
            data.role === "admin"
              ? "/admin"
              : "/";
          navigate(dest);
          return;
        }
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Verify OTP"
      subtitle="Enter the one-time password sent to your email address."
      heroTitle="Secure Every Login"
      heroDescription="Your OTP is valid for 5 minutes. Verify quickly to continue to your account."
    >
      <ErrorMessage error={error} className="mb-5 rounded-xl" />

      <form onSubmit={handleSubmit}>
        <InputField
          label="One-Time Password"
          type="text"
          name="otp"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter 6-digit OTP"
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
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        Wrong email address?{" "}
        <Link to="/forgot" className="font-semibold text-slate-800 hover:underline">
          Send OTP again
        </Link>
      </p>
    </AuthSplitLayout>
  );
};

export default VerifyOtp;


