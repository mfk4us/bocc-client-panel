import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { language, setLanguage, lang } from "../lang";
import { supabase } from "../components/supabaseClient";
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  CalendarDaysIcon,
  DocumentChartBarIcon,
  BellIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  GlobeAltIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";

export default function Sidebar({ role }) {
  const currentLang = lang[language] || lang.en;
  const [theme, setTheme] = useState("light");
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : window.innerWidth < 768;
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [tenantPages, setTenantPages] = useState({});
  const [workflowName, setWorkflowName] = useState(localStorage.getItem("workflow_name"));

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTenantPages = async () => {
      const { data, error } = await supabase
        .from("tenant_pages")
        .select("*")
        .eq("workflow_name", workflowName);
      console.log("WORKFLOW NAME:", workflowName);
      console.log("FETCHED TENANT PAGES:", data);
      console.log("SUPABASE ERROR:", error);

      if (!error && data) {
        setTenantPages(data[0] || {});
      }
    };
    if (role === "tenant") {
      fetchTenantPages();
    }
  }, [workflowName]);

  useEffect(() => {
    if (role !== "tenant") return;
    if (!tenantPages || Object.keys(tenantPages).length === 0) return;

    const allowedPaths = {
      dashboard: "/tenant/dashboard",
      messages: "/tenant/messages",
      customers: "/tenant/customers",
      profile: "/tenant/profile",
      bookings: "/tenant/bookings",
      topup: "/tenant/topup",
      analytics: "/tenant/analytics",
      notifications: "/tenant/notifications",
      team: "/tenant/team",
    };

    const currentPath = location.pathname;
    const allowed = Object.entries(allowedPaths).find(
      ([key, path]) => tenantPages[key] && currentPath === path
    );

    if (!allowed) {
      const firstAllowed = Object.entries(allowedPaths).find(([key]) => tenantPages[key]);
      if (firstAllowed) {
        navigate(firstAllowed[1], { replace: true });
      }
    }
  }, [tenantPages, location.pathname]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      // Default to light mode if no preference saved
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (localStorage.getItem('sidebarCollapsed') === null) {
        setIsCollapsed(window.innerWidth < 768);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleLang = () => {
    const newLang = language === "en" ? "ar" : "en";
    setLanguage(newLang);
    window.location.reload();
  };

  const toggleDarkMode = () => {
    if (theme === "dark") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    }
  };

  const links = role === "admin"
    ? [
        { label: currentLang.adminDashboard, path: "/admin/dashboard", icon: HomeIcon },
        { label: currentLang.manageTenants, path: "/admin/tenants", icon: UsersIcon },
        { label: currentLang.managePages || "Manage Pages", path: "/admin/manage-pages", icon: Cog6ToothIcon },
      ]
    : tenantPages && Object.keys(tenantPages).length > 0 ? [
        tenantPages.dashboard && { label: currentLang.dashboard, path: "/tenant/dashboard", icon: HomeIcon },
        tenantPages.messages && { label: currentLang.messages, path: "/tenant/messages", icon: ChatBubbleLeftRightIcon },
        tenantPages.customers && { label: currentLang.customers, path: "/tenant/customers", icon: UsersIcon },
        tenantPages.profile && { label: currentLang.profile, path: "/tenant/profile", icon: Cog6ToothIcon },
        tenantPages.bookings && { label: currentLang.bookings, path: "/tenant/bookings", icon: CalendarDaysIcon },
        tenantPages.topup && { label: currentLang.topup, path: "/tenant/topup", icon: DocumentChartBarIcon },
        tenantPages.analytics && { label: currentLang.analytics, path: "/tenant/analytics", icon: DocumentChartBarIcon },
        tenantPages.notifications && { label: currentLang.notifications, path: "/tenant/notifications", icon: BellIcon },
        tenantPages.team && { label: currentLang.team, path: "/tenant/team", icon: UserGroupIcon },
      ].filter(Boolean) : [];

  console.log("Sidebar links to render:", links);

  return (
    <aside className={`min-h-screen bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 px-3 py-6 flex flex-col justify-between transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div>
        <div className="flex justify-center mb-4">
          <button
            onClick={() => {
              const next = !isCollapsed;
              setIsCollapsed(next);
              localStorage.setItem('sidebarCollapsed', JSON.stringify(next));
            }}
            className="focus:outline-none"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {!isCollapsed ? (
          <div className="flex items-center gap-3 mb-6 px-4">
            <img
              src="/default-avatar.png"
              alt="Profile"
              className="w-12 h-12 rounded-full border"
            />
            <div>
              <p className="text-base font-semibold">John Doe</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{role}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-6">
            <img
              src="/default-avatar.png"
              alt="Profile"
              className="w-10 h-10 rounded-full border"
            />
          </div>
        )}

        <nav className="space-y-3">
          {links.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-md text-sm font-semibold 
                ${isActive ? "bg-blue-100 dark:bg-blue-700 text-blue-900 dark:text-white font-bold" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"}`
              }
            >
              <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {!isCollapsed && label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="space-y-3 text-sm flex flex-col items-center mt-6 relative">
        {!isCollapsed && window.innerWidth >= 768 ? (
          <>
            <button
              onClick={toggleLang}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <GlobeAltIcon className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {currentLang.languageToggle}
              </span>
            </button>

            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === "dark" ? (
                <SunIcon className="w-5 h-5 text-yellow-500" />
              ) : (
                <MoonIcon className="w-5 h-5 text-gray-600" />
              )}
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {theme === "dark" ? currentLang.lightMode : currentLang.darkMode}
              </span>
            </button>

            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {currentLang.logout}
              </span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3">
            <button
              onClick={toggleLang}
              title={currentLang.languageToggle}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 hover:scale-105 shadow transition-transform text-blue-900 dark:text-white"
            >
              🌐
            </button>

            <button
              onClick={toggleDarkMode}
              title={theme === "dark" ? currentLang.lightMode : currentLang.darkMode}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-yellow-100 dark:bg-gray-700 hover:scale-105 shadow transition-transform text-yellow-800 dark:text-yellow-100"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            <button
              onClick={() => setShowLogoutModal(true)}
              title={currentLang.logout}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-700 hover:scale-105 shadow transition-transform text-red-900 dark:text-white"
            >
              🚪
            </button>
          </div>
        )}

        {showLogoutModal && (
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 shadow-lg z-50">
            <p className="text-sm text-gray-800 dark:text-gray-100 mb-4">{currentLang.confirmLogout || "Are you sure you want to logout?"}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                {currentLang.cancel || "Cancel"}
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/";
                }}
                className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
              >
                {currentLang.confirm || "Logout"}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}