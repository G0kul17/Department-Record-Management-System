import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved authentication on mount
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Ensure latest profile (including persistent photoUrl) is loaded
  useEffect(() => {
    if (!loading && token) {
      // Fetch and sync profile details so avatar persists across reloads
      refreshUserProfile()?.catch(() => {});
    }
  }, [loading, token]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const refreshUserProfile = async () => {
    // Refresh user profile data from server
    if (!token) return;
    try {
      const apiBase =
        import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
      const response = await fetch(`${apiBase}/student/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data?.profile) {
          updateUser({
            register_number: data.profile.register_number,
            contact_number: data.profile.contact_number,
            leetcode_url: data.profile.leetcode_url,
            hackerrank_url: data.profile.hackerrank_url,
            codechef_url: data.profile.codechef_url,
            github_url: data.profile.github_url,
          });
        }
      }

      // Also refresh generic auth profile for photoUrl/fullName updates
      const authResp = await fetch(`${apiBase}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (authResp.ok) {
        const authData = await authResp.json();
        if (authData?.photoUrl || authData?.fullName) {
          updateUser({
            photoUrl: authData.photoUrl,
            avatarUrl: authData.photoUrl,
            imageUrl: authData.photoUrl,
            profilePic: authData.photoUrl,
            fullName: authData.fullName ?? undefined,
          });
        }
      }
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        updateUser,
        refreshUserProfile,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
