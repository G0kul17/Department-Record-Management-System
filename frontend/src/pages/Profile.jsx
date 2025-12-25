import React, { useEffect, useState } from "react";
import apiClient from "../api/axiosClient";
import InputField from "../components/InputField";
import { useAuth } from "../hooks/useAuth";

const Profile = () => {
  const { user, updateUser, login } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: "",
    rollNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Fetch latest profile from server
    let mounted = true;
    apiClient
      .get("/auth/profile")
      .then((data) => {
        if (!mounted) return;
        setForm({
          fullName: data?.fullName || user?.fullName || "",
          email: data?.email || user?.email || "",
          phone: data?.phone || "",
          rollNumber: data?.rollNumber || "",
        });
      })
      .catch(() => {
        /* ignore and use local */
      });
    return () => {
      mounted = false;
    };
  }, []);

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await apiClient.put("/auth/profile", {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        rollNumber: form.rollNumber,
      });
      // refresh auth state and token if provided
      if (data?.token) {
        login(
          { email: data.email, role: data.role, fullName: data.fullName },
          data.token
        );
      } else {
        updateUser({ fullName: data.fullName, email: data.email });
      }
      setSuccess("Profile updated");
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-xl rounded-lg bg-white p-6 shadow dark:bg-slate-800">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Edit Profile
          </h2>
          {error && (
            <div className="mb-3 rounded border border-red-300 bg-red-100 px-3 py-2 text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-3 rounded border border-green-300 bg-green-100 px-3 py-2 text-green-700">
              {success}
            </div>
          )}
          <form onSubmit={onSubmit}>
            <InputField
              label="Full Name"
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={onChange}
              placeholder="Your full name"
              required
            />
            <InputField
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="Your email"
              required
            />
            <InputField
              label="Phone"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={onChange}
              placeholder="Your phone number"
            />
            <InputField
              label="Roll Number"
              type="text"
              name="rollNumber"
              value={form.rollNumber}
              onChange={onChange}
              placeholder="Your roll number"
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
