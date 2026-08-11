import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

console.log("🚀 main.jsx loading...");
console.log("Root element:", document.getElementById("root"));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);

console.log("✅ React app rendered");