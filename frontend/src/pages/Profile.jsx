import React, { useEffect, useState } from "react";
import apiClient from "../api/axiosClient";
import InputField from "../components/InputField";
import { useAuth } from "../hooks/useAuth";

const Profile = () => {
  const { user, updateUser, login, refreshUserProfile } = useAuth();
  const isStaffOrAdmin =
    (user?.role || "").toLowerCase() === "staff" ||
    (user?.role || "").toLowerCase() === "admin";
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
  const [exportsList, setExportsList] = useState([]);
  const [loadingExports, setLoadingExports] = useState(false);

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

    // For staff/admin, load export files list
    if (isStaffOrAdmin) {
      setLoadingExports(true);
      apiClient
        .get("/bulk-export/list")
        .then((data) => {
          if (!mounted) return;
          setExportsList(data?.files || []);
        })
        .catch((err) => {
          console.error("Error fetching exports list:", err);
        })
        .finally(() => setLoadingExports(false));
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
        <div className="glitter-card mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
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
            {/* Register Number is only for students */}
            {user?.role === "student" && (
              <InputField
                label="Register Number"
                type="text"
                name="register_number"
                value={form.register_number}
                onChange={onChange}
                placeholder="Enter your register number"
              />
            )}
            <InputField
              label="Contact Number"
              type="tel"
              name="contact_number"
              value={form.contact_number}
              onChange={onChange}
              placeholder="Enter your contact number"
            />
            {/* Coding platform fields are for students only */}
            {user?.role === "student" && (
              <>
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
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-[#87CEEB] px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>

          {/* Staff/Admin: Show downloaded files from the application */}
          {isStaffOrAdmin && (
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Downloaded Files
                </h3>
                <button
                  type="button"
                  onClick={async () => {
                    setLoadingExports(true);
                    try {
                      const data = await apiClient.get("/bulk-export/list");
                      setExportsList(data?.files || []);
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setLoadingExports(false);
                    }
                  }}
                  className="text-xs rounded-md bg-blue-600 px-3 py-1 font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                  disabled={loadingExports}
                >
                  {loadingExports ? "Refreshing..." : "Refresh"}
                </button>
              </div>
              <div className="mt-3 rounded border border-slate-200 dark:border-slate-700">
                {exportsList.length === 0 ? (
                  <div className="p-4 text-sm text-slate-600 dark:text-slate-300">
                    No files found. Generate one from Bulk Export.
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                    {exportsList.map((f) => (
                      <li
                        key={f.name}
                        className="flex items-center justify-between p-3"
                      >
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-100">
                            {f.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {(f.size / 1024 / 1024).toFixed(2)} MB ·{" "}
                            {new Date(f.modifiedAt).toLocaleString()}
                          </div>
                        </div>
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs rounded-md bg-slate-700 px-3 py-1 font-semibold text-white shadow hover:opacity-90"
                        >
                          Download
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
