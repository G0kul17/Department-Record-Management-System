import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import apiClient from "../api/axiosClient";
import ErrorMessage from "../components/ErrorMessage";
import AuthSplitLayout from "../components/AuthSplitLayout";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await apiClient.post("/auth/forgot", { email });
      setSuccess("OTP sent to your email!");
      setTimeout(
        () => navigate("/verify-otp", { state: { email, type: "forgot" } }),
        1200
      );
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Forgot Password"
      subtitle="Enter your registered email and we will send a one-time password."
      heroTitle="Recover Access Fast"
      heroDescription="Security-first recovery flow helps you reset your account safely in a few quick steps."
    >
      <ErrorMessage error={error} className="mb-5 rounded-xl" />

      {success && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <InputField
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your registered email"
          required
          labelClassName="mb-1 text-sm font-medium text-slate-600"
          inputClassName="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base shadow-none focus:border-slate-400 focus:ring-slate-300"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-black px-4 py-3 text-base font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send OTP"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        Remembered your password?{" "}
        <Link to="/login" className="font-semibold text-slate-800 hover:underline">
          Back to Login
        </Link>
      </p>
    </AuthSplitLayout>
  );
};

export default ForgotPassword;

