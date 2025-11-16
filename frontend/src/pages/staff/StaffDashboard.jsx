import React, { useState, useEffect } from "react";
import apiClient from "../../api/axiosClient";
import { useAuth } from "../../hooks/useAuth";

const StaffDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    try {
      const response = await apiClient.get("/staff/dashboard");
      setEvents(response.events || []);
    } catch (err) {
      console.error("Failed to fetch staff data", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2">{`Welcome, ${
          user?.fullName || user?.email || "Staff"
        }`}</h1>
        <p className="text-gray-600 mb-8">Staff Portal</p>

        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition">
              Create Event
            </button>
            <button className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition">
              Upload Project
            </button>
            <button className="bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition">
              View Student Achievements
            </button>
            <button className="bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition">
              Participate in Forums
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;