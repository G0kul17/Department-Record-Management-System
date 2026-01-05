import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved authentication on mount
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedSessionToken = localStorage.getItem("sessionToken");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    if (storedSessionToken) {
      setSessionToken(storedSessionToken);
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

  const login = (userData, authToken, sessionTokenValue = null) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(userData));

    if (sessionTokenValue) {
      setSessionToken(sessionTokenValue);
      localStorage.setItem("sessionToken", sessionTokenValue);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setSessionToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("sessionToken");
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const refreshUserProfile = async () => {
    // Refresh user profile data from server
    if (!token || !user) return;
    try {
      const apiBase =
        import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Add session token to headers if available
      if (sessionToken) {
        headers["x-session-token"] = sessionToken;
      }

      // Only fetch student profile for student users
      if (user.role !== "student") return;

      const response = await fetch(`${apiBase}/student/profile`, {
        headers,
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
        headers,
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
        sessionToken,
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

