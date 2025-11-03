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
  const email = location.state?.email;
  const devOtp = location.state?.devOtp;
  const { login } = useAuth();

  useEffect(() => {
    if (!email) navigate("/forgot");
    // Pre-fill OTP in dev mode if provided by backend
    if (devOtp) setOtp(devOtp);
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (type === "login") {
        const data = await apiClient.post("/auth/login-verify", { email, otp });
        // Expect: { token, role }
        if (data?.token && data?.role) {
          login({ email, role: data.role }, data.token);
          const dest =
            data.role === "admin"
              ? "/admin"
              : data.role === "staff"
              ? "/staff"
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
          login({ email, role: data.role }, data.token);
          const dest =
            data.role === "admin"
              ? "/admin"
              : data.role === "staff"
              ? "/staff"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
