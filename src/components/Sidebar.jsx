import React, { useState, useEffect } from "react";
import DefaultAvatar from "../assets/default-avatar.png";
import { NavLink, useLocation, useNavigate, useMatch } from "react-router-dom";
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
  Bars3Icon,
} from "@heroicons/react/24/outline";


export default function Sidebar({ role }) {
  const currentLang = {
    languageToggle: lang("languageToggle"),
    lightMode: lang("lightMode"),
    darkMode: lang("darkMode"),
    logout: lang("logout"),
    confirmLogout: lang("confirmLogout"),
    cancel: lang("cancel"),
    confirm: lang("confirm"),
    adminDashboard: lang("adminDashboard"),
    manageTenants: lang("manageTenants"),
    managePages: lang("managePages"),
    dashboard: lang("dashboard"),
    messages: lang("messages"),
    customers: lang("customers"),
    profile: lang("profile"),
    bookings: lang("bookings"),
    topup: lang("topup"),
    analytics: lang("analytics"),
    notifications: lang("notifications"),
    team: lang("team"),
    sendMessages: language === "ar" ? "مركز الرسائل" : "Message Center",
  };
  const [theme, setTheme] = useState("light");
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved
      ? JSON.parse(saved)
      : (window.innerWidth < 768 && window.innerHeight >= window.innerWidth);
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // toggle for settings menu (logout, theme, language)
  const [showSettings, setShowSettings] = useState(false);

  // Detect portrait orientation
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  useEffect(() => {
    const onResize = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Detect mobile (width < 768)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const location = useLocation();
  const navigate = useNavigate();

  const [tenantPages, setTenantPages] = useState({});
  const [workflowName, setWorkflowName] = useState(localStorage.getItem("workflow_name"));
  const [customerName, setCustomerName] = useState("");
  const [isLoadingName, setIsLoadingName] = useState(true);

  const fetchCustomerName = async () => {
    if (!workflowName) {
      console.error("Workflow name missing.");
      setIsLoadingName(false);
      return;
    }

    console.log("Fetching customer name for workflow:", workflowName);

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("customer_name")
        .eq("workflow_name", workflowName)
        .single();

      if (profileError) {
        console.error("Supabase error fetching profile:", profileError.message);
        setCustomerName(""); // fallback
      } else if (profileData && profileData.customer_name) {
        console.log("Fetched customer name:", profileData.customer_name);
        setCustomerName(profileData.customer_name);
      } else {
        console.error("No customer profile found for workflow:", workflowName);
        setCustomerName(""); // fallback
      }
    } catch (err) {
      console.error("Unexpected error fetching customer name:", err.message);
      setCustomerName(""); // fallback
    }
    setIsLoadingName(false);
  };

  useEffect(() => {
    if (workflowName) {
      fetchCustomerName();
    }
  }, [workflowName]);

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
      sendMessages: "/tenant/send-messages",
    };

    const currentPath = location.pathname;
    const allowed = Object.entries(allowedPaths).find(
      ([key, path]) => (key === "sendMessages" || tenantPages[key]) && currentPath === path
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
        setIsCollapsed(window.innerWidth < 768 && window.innerHeight >= window.innerWidth);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        { label: currentLang.sendMessages, path: "/tenant/send-messages", icon: ChatBubbleLeftRightIcon },
      ].filter(Boolean) : [];

  const toggleLang = () => {
    const newLang = language === "en" ? "ar" : "en";
    setLanguage(newLang);
    // Store current route before reload
    localStorage.setItem("last_route", window.location.pathname + window.location.search);
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

  // precise route matching for bottom nav
  const isDashboard = useMatch({ path: "/tenant/dashboard", end: true });
  const isMessagesList = useMatch({ path: "/tenant/messages", end: true });
  const isCustomers = useMatch({ path: "/tenant/customers", end: true });
  // Detect individual chat-history pages
  const isMessageDetail = !!useMatch({ path: "/tenant/messages/:id", end: true });

  // show bottom nav only on mobile for dashboard or customers (hide on any messages routes)
  if (isMobile && !isMessageDetail && (isDashboard || isCustomers)) {
    return (
      <>
      <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-around py-2 sm:py-3 z-50">
        {links.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs sm:text-sm ${
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
              }`
            }
          >
            <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="mt-1">{label}</span>
          </NavLink>
        ))}
        {/* settings toggle */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded bg-white dark:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800"
          aria-label="Open settings"
        >
          <Bars3Icon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600 dark:text-gray-300" />
        </button>
      </nav>
      {showSettings && (
        <div className="fixed bottom-20 right-4 flex flex-col items-center z-50">
          <button
            onClick={toggleLang}
            aria-label="Toggle Language"
            title={currentLang.languageToggle}
            className="rounded-full w-14 h-14 flex items-center justify-center bg-white dark:bg-gray-800 shadow-lg hover:scale-105 transition-transform mb-3"
          >
            <GlobeAltIcon className="w-8 h-8 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={toggleDarkMode}
            aria-label="Toggle Theme"
            title={theme === "dark" ? currentLang.lightMode : currentLang.darkMode}
            className="rounded-full w-14 h-14 flex items-center justify-center bg-white dark:bg-gray-800 shadow-lg hover:scale-105 transition-transform mb-3"
          >
            {theme === "dark" ? (
              <SunIcon className="w-8 h-8 text-yellow-400" />
            ) : (
              <MoonIcon className="w-8 h-8 text-gray-600 dark:text-gray-300" />
            )}
          </button>
          <button
            onClick={() => setShowLogoutModal(true)}
            aria-label="Logout"
            title={currentLang.logout}
            className="rounded-full w-14 h-14 flex items-center justify-center bg-white dark:bg-gray-800 shadow-lg hover:scale-105 transition-transform"
          >
            <ArrowRightOnRectangleIcon className="w-8 h-8 text-red-600" />
          </button>
        </div>
      )}
      </>
    );
  }

  console.log("Sidebar links to render:", links);

  // Hide sidebar on phone portrait for any messages page
  if (isMobile && isPortrait && location.pathname.startsWith("/tenant/messages")) {
    return null;
  }

  return (
    <div className={language === "ar" ? "flex flex-row-reverse" : "flex flex-row"}>
    <aside className={`min-h-screen bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 px-3 py-6 flex flex-col justify-between transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} ${language === "ar" ? 'border-l border-l-gray-200 dark:border-l-gray-700 border-r-0' : 'border-r border-r-gray-200 dark:border-r-gray-700'}`}>
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
              src={DefaultAvatar}
              alt="Profile"
              className="w-12 h-12 rounded-full border"
            />
            <div>
              {isLoadingName ? (
                <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-base font-semibold">{customerName || (role === "admin" ? "Admin User" : "John Doe")}</p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">{role}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-6">
            <img
              src={DefaultAvatar}
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

      <div className="space-y-3 text-sm flex flex-col items-center mt-6 relative w-full">
        {/* Desktop/expanded: show settings as full-width buttons */}
        {(!isCollapsed && window.innerWidth >= 1024) ? (
          <div className="w-full flex flex-col space-y-3 pb-4 mt-8 mb-4">
            <button
              onClick={toggleLang}
              className="flex items-center justify-center w-full min-w-0 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-semibold gap-2"
            >
              <GlobeAltIcon className="w-6 h-6 text-blue-500" />
              <span className="text-gray-800 dark:text-gray-100 truncate">{currentLang.languageToggle}</span>
            </button>
            <button
              onClick={toggleDarkMode}
              className="flex items-center justify-center w-full min-w-0 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-semibold gap-2"
            >
              {theme === "dark" ? (
                <SunIcon className="w-6 h-6 text-yellow-400" />
              ) : (
                <MoonIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              )}
              <span className="text-gray-800 dark:text-gray-100 truncate">
                {theme === "dark" ? currentLang.lightMode : currentLang.darkMode}
              </span>
            </button>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center justify-center w-full min-w-0 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 transition-colors text-sm font-semibold gap-2"
            >
              <ArrowRightOnRectangleIcon className="w-6 h-6 text-red-500" />
              <span className="text-gray-800 dark:text-gray-100 truncate">{currentLang.logout}</span>
            </button>
          </div>
        ) : (
          // Show hamburger (settings) button only if collapsed or narrow
          <div className="flex justify-end w-full">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              aria-label="Open settings"
            >
              <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
            {/* The settings menu (popover) */}
            {showSettings && (
              <div className="absolute left-0 bottom-12 mb-2 w-56 space-y-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-50">
                <button
                  onClick={toggleLang}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                >
                  🌐 {currentLang.languageToggle}
                </button>
                <button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                >
                  {theme === "dark" ? "☀️ " + currentLang.lightMode : "🌙 " + currentLang.darkMode}
                </button>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                >
                  🚪 {currentLang.logout}
                </button>
              </div>
            )}
          </div>
        )}

        {showLogoutModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl w-full max-w-xs text-center">
              <p className="text-base text-gray-800 dark:text-gray-100 mb-6">{currentLang.confirmLogout || "Are you sure you want to logout?"}</p>
              <div className="flex flex-row gap-4">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold"
                >
                  {currentLang.cancel || "Cancel"}
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = "/";
                  }}
                  className="flex-1 px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 font-semibold"
                >
                  {currentLang.confirm || "Logout"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
    </div>
  );
}