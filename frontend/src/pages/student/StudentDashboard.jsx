import React, { useState, useEffect } from "react";
import apiClient from "../../api/axiosClient";
import { useAuth } from "../../hooks/useAuth";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [achievements, setAchievements] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const response = await apiClient.get("/student/dashboard");
      setAchievements(response.achievements || []);
      setProjects(response.projects || []);
    } catch (err) {
      console.error("Failed to fetch student data", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">
          {user?.role === "alumni" ? "Alumni Dashboard" : "Student Dashboard"}
        </h1>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 font-semibold whitespace-nowrap ${
                activeTab === "overview"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("achievements")}
              className={`px-6 py-3 font-semibold whitespace-nowrap ${
                activeTab === "achievements"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              Achievements
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`px-6 py-3 font-semibold whitespace-nowrap ${
                activeTab === "projects"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab("community")}
              className={`px-6 py-3 font-semibold whitespace-nowrap ${
                activeTab === "community"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              Community
            </button>
            <button
              onClick={() => setActiveTab("placement")}
              className={`px-6 py-3 font-semibold whitespace-nowrap ${
                activeTab === "placement"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              Placement DB
            </button>
            <button
              onClick={() => setActiveTab("alumni")}
              className={`px-6 py-3 font-semibold whitespace-nowrap ${
                activeTab === "alumni"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              Alumni Network
            </button>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition">
                    Add Achievement
                  </button>
                  <button className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition">
                    Upload Project
                  </button>
                  <button className="bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition">
                    Post Update
                  </button>
                  <button className="bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition">
                    Join Discussion
                  </button>
                  <button className="bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition">
                    View Events
                  </button>
                  <button className="bg-pink-600 text-white py-3 px-4 rounded-lg hover:bg-pink-700 transition">
                    Connect with Alumni
                  </button>
                </div>
              </div>
            )}

            {activeTab === "achievements" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">My Achievements</h3>
                  <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                    Add Achievement
                  </button>
                </div>
                <div className="text-gray-600">
                  {achievements.length === 0 ? (
                    <p>
                      No achievements yet. Start adding your accomplishments!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {achievements.map((ach, idx) => (
                        <div key={idx} className="border p-4 rounded-lg">
                          <h4 className="font-semibold">{ach.title}</h4>
                          <p className="text-sm text-gray-500">{ach.date}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "projects" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">My Projects</h3>
                  <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                    Upload Project
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">
                      Upload Project Files:
                    </h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      <li>SRS Document (PDF/Word)</li>
                      <li>Presentation (PPT)</li>
                      <li>Research Papers (PDF)</li>
                      <li>Source Code (ZIP)</li>
                      <li>Application Files (APK/EXE)</li>
                    </ul>
                  </div>

                  {projects.length === 0 ? (
                    <p className="text-gray-600">No projects uploaded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {projects.map((proj, idx) => (
                        <div key={idx} className="border p-4 rounded-lg">
                          <h4 className="font-semibold">{proj.title}</h4>
                          <p className="text-sm text-gray-500">
                            {proj.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "community" && (
              <div>
                <h3 className="text-xl font-bold mb-4">Community Updates</h3>
                <p className="text-gray-600 mb-4">
                  Share your achievements and projects with the community.
                </p>
                <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                  Create Post
                </button>
              </div>
            )}

            {activeTab === "placement" && (
              <div>
                <h3 className="text-xl font-bold mb-4">Placement Database</h3>
                <p className="text-gray-600">
                  Access placement opportunities and contribute to the placement
                  database.
                </p>
              </div>
            )}

            {activeTab === "alumni" && (
              <div>
                <h3 className="text-xl font-bold mb-4">Alumni Network</h3>
                <p className="text-gray-600 mb-4">
                  Connect with alumni, view profiles, and send messages.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                    Browse Alumni
                  </button>
                  <button className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition">
                    My Connections
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
