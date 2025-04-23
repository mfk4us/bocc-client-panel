import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";

// Admin pages
import AdminDashboard from "./admin/AdminDashboard";
import ManageTenants from "./admin/ManageTenants";

// Tenant pages
import Dashboard from "./tenant/Dashboard";
import Messages from "./tenant/Messages";
import Customers from "./tenant/Customers";
import Profile from "./tenant/Profile";
import TopUp from "./tenant/TopUp";
import Bookings from "./tenant/Bookings";
import Analytics from "./tenant/Analytics";
import NotificationSettings from "./tenant/NotificationSettings";
import Team from "./tenant/Team";

export default function App() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("role");
    if (stored) setRole(stored);
  }, []);

  return (
    <Router>
      {!role ? (
        <Routes>
          <Route path="/" element={<Login setRole={setRole} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      ) : (
        <div className="flex h-screen bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 font-sans">
          <Sidebar role={role} />
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-md">
            <Routes>
              {role === "tenant" ? (
                <>
                  <Route path="/tenant/dashboard" element={<Dashboard />} />
                  <Route path="/tenant/messages" element={<Messages />} />
                  <Route path="/tenant/customers" element={<Customers />} />
                  <Route path="/tenant/profile" element={<Profile />} />
                  <Route path="/tenant/topup" element={<TopUp />} />
                  <Route path="/tenant/bookings" element={<Bookings />} />
                  <Route path="/tenant/analytics" element={<Analytics />} />
                  <Route path="/tenant/notifications" element={<NotificationSettings />} />
                  <Route path="/tenant/team" element={<Team />} />
                  <Route path="*" element={<Navigate to="/tenant/dashboard" />} />
                </>
              ) : (
                <>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/tenants" element={<ManageTenants />} />
                  <Route path="*" element={<Navigate to="/admin/dashboard" />} />
                </>
              )}
            </Routes>
          </div>
        </div>
      )}
    </Router>
  );
}