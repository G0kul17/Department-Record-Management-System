import React, { useState, useEffect } from "react";
import apiClient from "../../api/axiosClient";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    staff: 0,
    projects: 0,
    events: 0,
  });
  // tabs removed — show overview content directly

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get("/admin/dashboard-stats");
      setStats(response.stats);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">
              Total Students
            </h3>
            <p className="text-3xl font-bold text-blue-600">{stats.students}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">
              Total Staff
            </h3>
            <p className="text-3xl font-bold text-green-600">{stats.staff}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">
              Total Projects
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {stats.projects}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">
              Total Events
            </h3>
            <p className="text-3xl font-bold text-orange-600">{stats.events}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition">
              Manage Users
            </button>
            <button className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition">
              View All Projects
            </button>
            <button className="bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition">
              Generate Reports
            </button>
            <button className="bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition">
              Manage Events
            </button>
            <button className="bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition">
              Backup to OneDrive
            </button>
            <button className="bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition">
              Moderate Forums
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;