import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import RouteRestorer from "./components/RouteRestorer";

// Admin pages
import AdminDashboard from "./admin/AdminDashboard";
import ManageTenants from "./admin/ManageTenants";
import ManagePages from "./admin/ManagePages";

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

  // Language state global sync
  const [language, setLanguage] = useState(localStorage.getItem("language") || "en");
  useEffect(() => {
    const storedLang = localStorage.getItem("language") || "en";
    setLanguage(storedLang);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("role");
    if (stored) setRole(stored);
  }, []);

  return (
    <Router>
      <RouteRestorer />
      {!role ? (
        <Routes>
          <Route path="/" element={<Login setRole={setRole} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      ) : (
        <div dir={language === "ar" ? "rtl" : "ltr"} className="h-screen bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 font-sans">
          <div className={`flex h-full ${language === "ar" ? "flex-row-reverse" : "flex-row"}`}>
            <Sidebar role={role} language={language} setLanguage={setLanguage} />
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-md">
              <Routes>
                {role === "tenant" ? (
                  <>
                    <Route path="/tenant/dashboard" element={<Dashboard language={language} />} />
                    <Route path="/tenant/messages" element={<Messages language={language} />} />
                    <Route path="/tenant/customers" element={<Customers language={language} />} />
                    <Route path="/tenant/profile" element={<Profile language={language} />} />
                    <Route path="/tenant/topup" element={<TopUp language={language} />} />
                    <Route path="/tenant/bookings" element={<Bookings language={language} />} />
                    <Route path="/tenant/analytics" element={<Analytics language={language} />} />
                    <Route path="/tenant/notifications" element={<NotificationSettings language={language} />} />
                    <Route path="/tenant/team" element={<Team language={language} />} />
                    <Route path="/tenant/*" element={<div className="text-center text-2xl mt-16">Page Not Found</div>} />
                  </>
                ) : (
                  <>
                    <Route path="/admin/dashboard" element={<AdminDashboard language={language} />} />
                    <Route path="/admin/tenants" element={<ManageTenants language={language} />} />
                    <Route path="/admin/manage-pages" element={<ManagePages language={language} />} />
                    <Route path="/admin/*" element={<div className="text-center text-2xl mt-16">Page Not Found</div>} />
                  </>
                )}
              </Routes>
            </div>
          </div>
        </div>
      )}
    </Router>
  );
}