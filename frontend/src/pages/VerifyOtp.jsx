import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import InputField from "../components/InputField";
import apiClient from "../api/axiosClient";
import { useAuth } from "../hooks/useAuth";

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
        const data = await apiClient.post("/auth/login-verify", { email, otp });
        // Expect: { token, role }
        if (data?.token && data?.role) {
          login(
            { email, role: data.role, fullName: data.fullName },
            data.token
          );
          const dest =
            data.role === "admin"
              ? "/admin"
              : data.role === "staff"
              ? "/"
              : "/student";
          navigate(dest);
          return;
        }
        navigate("/");
      } else if (type === "forgot") {
        // Just verify presence then go to reset screen
        await apiClient.post("/auth/verify", { email, otp });
        navigate("/reset", { state: { email, otp } });
      } else {
        // registration verification -> backend returns token + role
        const data = await apiClient.post("/auth/verify", { email, otp });
        if (data?.token && data?.role) {
          login(
            { email, role: data.role, fullName: data.fullName },
            data.token
          );
          const dest =
            data.role === "admin"
              ? "/admin"
              : data.role === "staff"
              ? "/"
              : "/student";
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-3xl font-bold text-center mb-6">Verify OTP</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <InputField
            label="OTP"
            type="text"
            name="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit OTP"
            required
          />
          <p className="text-sm text-gray-500 mb-4">
            OTP expires in {formatMMSS(timeLeft)}.
          </p>

          <button
            type="submit"
            disabled={loading || timeLeft === 0}
            className="w-full bg-[#87CEEB] text-white py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
