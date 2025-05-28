import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import { UIProvider } from "./context/UIContext";
import Layout from "./components/Layout";
import RouteRestorer from "./components/RouteRestorer";
import useResponsive from "./utils/useResponsive";

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
import SendMessages from "./tenant/SendMessages";
import Integration from "./tenant/Integration";

// Theme: Load from localStorage or system, and set <html> class
function getInitialTheme() {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    // Optionally, use system preference as fallback
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  }
  return "light";
}

export default function App() {
  const [role, setRole] = useState(localStorage.getItem("role") || null);

  // Language state global sync
  const [language, setLanguage] = useState(localStorage.getItem("language") || "en");
  const { isMobile } = useResponsive();

  const [theme, setTheme] = useState(getInitialTheme());

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  useEffect(() => {
    if (role) {
      localStorage.setItem("role", role);
    }
  }, [role]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  return (
    <UIProvider>
      <Router>
        <RouteRestorer />
        {!role ? (
          <Routes>
            <Route path="/" element={<Login setRole={setRole} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        ) : (
          <Routes>
            <Route
              path="/*"
              element={
                <Layout
                  role={role}
                  language={language}
                  setLanguage={setLanguage}
                  isMobile={isMobile}
                  theme={theme}
                  setTheme={setTheme}
                />
              }
            >
              {role === "tenant" ? (
                <>
                  <Route index element={<Dashboard language={language} />} />
                  <Route path="tenant/dashboard" element={<Dashboard language={language} />} />
                  <Route path="tenant/messages" element={<Messages language={language} />} />
                  <Route path="tenant/customers" element={<Customers language={language} />} />
                  <Route path="tenant/profile" element={<Profile language={language} />} />
                  <Route path="tenant/top-up" element={<TopUp language={language} />} />
                  <Route path="tenant/bookings" element={<Bookings language={language} />} />
                  <Route path="tenant/analytics" element={<Analytics language={language} />} />
                  <Route path="tenant/notification-settings" element={<NotificationSettings language={language} />} />
                  <Route path="tenant/team" element={<Team language={language} />} />
                  <Route path="tenant/send-messages" element={<SendMessages language={language} />} />
                  <Route path="tenant/integration" element={<Integration language={language} />} />
                  <Route path="tenant/*" element={<div className="text-center text-2xl mt-16">Page Not Found</div>} />
                </>
              ) : (
                <>
                  <Route index element={<AdminDashboard language={language} />} />
                  <Route path="admin/dashboard" element={<AdminDashboard language={language} />} />
                  <Route path="admin/tenants" element={<ManageTenants language={language} />} />
                  <Route path="admin/manage-pages" element={<ManagePages language={language} />} />
                  <Route path="admin/*" element={<div className="text-center text-2xl mt-16">Page Not Found</div>} />
                </>
              )}
            </Route>
          </Routes>
        )}
      </Router>
    </UIProvider>
  );
}