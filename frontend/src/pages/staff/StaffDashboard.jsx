import React, { useState, useEffect } from "react";
import apiClient from "../../api/axiosClient";
import { useAuth } from "../../hooks/useAuth";

const StaffDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
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

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 font-semibold ${
                activeTab === "overview"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`px-6 py-3 font-semibold ${
                activeTab === "events"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`px-6 py-3 font-semibold ${
                activeTab === "projects"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab("students")}
              className={`px-6 py-3 font-semibold ${
                activeTab === "students"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              Students
            </button>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-4">
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
            )}

            {activeTab === "events" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Department Events</h3>
                  <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                    Add Event
                  </button>
                </div>
                <p className="text-gray-600">
                  Manage department events and competitions.
                </p>
              </div>
            )}

            {activeTab === "projects" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Projects</h3>
                  <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                    Upload Project
                  </button>
                </div>
                <p className="text-gray-600">
                  View and manage shared projects with version history.
                </p>
              </div>
            )}

            {activeTab === "students" && (
              <div>
                <h3 className="text-xl font-bold mb-4">Student Records</h3>
                <p className="text-gray-600">
                  Access student achievements and project submissions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
