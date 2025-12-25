import React, { useEffect, useState } from "react";
import apiClient from "../api/axiosClient";
import InputField from "../components/InputField";
import { useAuth } from "../hooks/useAuth";

const Profile = () => {
  const { user, updateUser, login, refreshUserProfile } = useAuth();
  const [form, setForm] = useState({
    // Non-editable fields from profile_details
    first_name: "",
    last_name: "",
    department: "",
    course: "",
    year: "",
    section: "",
    email: user?.email || "",
    // Editable fields
    register_number: "",
    contact_number: "",
    leetcode_url: "",
    hackerrank_url: "",
    codechef_url: "",
    github_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Fetch student profile from server
    let mounted = true;
    if (user?.role === "student") {
      apiClient
        .get("/student/profile")
        .then((data) => {
          if (!mounted) return;
          console.log("Profile data received:", data);
          const profile = data?.profile || {};
          setForm({
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            department: profile.department || "",
            course: profile.course || "",
            year: profile.year || "",
            section: profile.section || "",
            email: profile.email || user?.email || "",
            register_number: profile.register_number || "",
            contact_number: profile.contact_number || "",
            leetcode_url: profile.leetcode_url || "",
            hackerrank_url: profile.hackerrank_url || "",
            codechef_url: profile.codechef_url || "",
            github_url: profile.github_url || "",
          });
        })
        .catch((err) => {
          console.error("Error fetching profile:", err);
          setError("Failed to load profile data");
        });
    }
    return () => {
      mounted = false;
    };
  }, [user]);

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (user?.role === "student") {
        // Update student profile
        const data = await apiClient.put("/student/profile", {
          register_number: form.register_number,
          contact_number: form.contact_number,
          leetcode_url: form.leetcode_url,
          hackerrank_url: form.hackerrank_url,
          codechef_url: form.codechef_url,
          github_url: form.github_url,
        });
        setSuccess(data.message || "Profile updated successfully");
        // Refresh user context with updated profile
        await refreshUserProfile();
      } else {
        // Fallback for staff/admin
        const data = await apiClient.put("/auth/profile", {
          fullName: form.first_name + " " + form.last_name,
          email: form.email,
          phone: form.contact_number,
          rollNumber: form.register_number,
        });
        if (data?.token) {
          login(
            { email: data.email, role: data.role, fullName: data.fullName },
            data.token
          );
        } else {
          updateUser({ fullName: data.fullName, email: data.email });
        }
        setSuccess("Profile updated");
      }
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
            {/* Non-editable fields */}
            <div className="mb-4 grid grid-cols-2 gap-4">
              <InputField
                label="First Name"
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={onChange}
                placeholder="First name"
                disabled
                className="bg-gray-100 dark:bg-slate-700 cursor-not-allowed"
              />
              <InputField
                label="Last Name"
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={onChange}
                placeholder="Last name"
                disabled
                className="bg-gray-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            
            <InputField
              label="Department"
              type="text"
              name="department"
              value={form.department}
              onChange={onChange}
              placeholder="Department"
              disabled
              className="bg-gray-100 dark:bg-slate-700 cursor-not-allowed"
            />
            
            <div className="mb-4 grid grid-cols-3 gap-4">
              <InputField
                label="Course"
                type="text"
                name="course"
                value={form.course}
                onChange={onChange}
                placeholder="Course"
                disabled
                className="bg-gray-100 dark:bg-slate-700 cursor-not-allowed"
              />
              <InputField
                label="Year"
                type="text"
                name="year"
                value={form.year}
                onChange={onChange}
                placeholder="Year"
                disabled
                className="bg-gray-100 dark:bg-slate-700 cursor-not-allowed"
              />
              <InputField
                label="Section"
                type="text"
                name="section"
                value={form.section}
                onChange={onChange}
                placeholder="Section"
                disabled
                className="bg-gray-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            
            <InputField
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="Email"
              disabled
              className="bg-gray-100 dark:bg-slate-700 cursor-not-allowed"
            />

            {/* Divider */}
            <div className="my-6 border-t border-slate-200 dark:border-slate-700"></div>
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Editable Information
            </h3>

            {/* Editable fields */}
            <InputField
              label="Register Number"
              type="text"
              name="register_number"
              value={form.register_number}
              onChange={onChange}
              placeholder="Enter your register number"
            />
            <InputField
              label="Contact Number"
              type="tel"
              name="contact_number"
              value={form.contact_number}
              onChange={onChange}
              placeholder="Enter your contact number"
            />
            <InputField
              label="LeetCode Profile"
              type="url"
              name="leetcode_url"
              value={form.leetcode_url}
              onChange={onChange}
              placeholder="https://leetcode.com/your-profile"
            />
            <InputField
              label="HackerRank Profile"
              type="url"
              name="hackerrank_url"
              value={form.hackerrank_url}
              onChange={onChange}
              placeholder="https://hackerrank.com/your-profile"
            />
            <InputField
              label="CodeChef Profile (Optional)"
              type="url"
              name="codechef_url"
              value={form.codechef_url}
              onChange={onChange}
              placeholder="https://codechef.com/users/your-profile"
            />
            <InputField
              label="GitHub Profile"
              type="url"
              name="github_url"
              value={form.github_url}
              onChange={onChange}
              placeholder="https://github.com/your-username"
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
