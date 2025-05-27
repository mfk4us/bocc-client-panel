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
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";


export default function Sidebar({ role }) {
  // Full-screen More menu state for mobile bottom nav
  const [showFullMoreMenu, setShowFullMoreMenu] = useState(false);
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

  // Detect mobile/tablet/TV vs desktop
  function detectMobileUI() {
    const ua = navigator.userAgent;
    const isTablet = /iPad|Android(?!.*Mobile)|Tablet|PlayBook|Silk/i.test(ua);
    const isMobile = /Mobi|Android|iPhone|BlackBerry|Opera Mini|IEMobile/i.test(ua);
    const isTV = /SmartTV|AppleTV|GoogleTV|Roku|Xbox|PlayStation/i.test(ua);
    return isMobile || isTablet || isTV;
  }
  const [isMobileUI, setIsMobileUI] = useState(detectMobileUI());
  useEffect(() => {
    const onResize = () => {
      const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 768;
      setIsMobileUI(detectMobileUI() || smallScreen);
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
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
      sendmessages: "/tenant/send-messages",
      integrations: "/tenant/integrations",
      reports: "/tenant/reports",
    };

    const currentPath = location.pathname;
    const allowed = Object.entries(allowedPaths).find(
      ([key, path]) =>
        (
          key === "sendmessages" ||
          key === "integrations" ||
          key === "reports" ||
          tenantPages[key]
        ) && currentPath === path
    );

    if (!allowed) {
      const firstAllowed = Object.entries(allowedPaths).find(
        ([key]) =>
          tenantPages[key] ||
          key === "sendmessages" ||
          key === "integrations" ||
          key === "reports"
      );
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

  // Split tenant links into "useful" and "more" sections per requirements
  let links = [];
  let moreLinks = [];
  if (role === "admin") {
    links = [
      { label: currentLang.adminDashboard, path: "/admin/dashboard", icon: HomeIcon },
      { label: currentLang.manageTenants, path: "/admin/tenants", icon: UsersIcon },
      { label: currentLang.managePages || "Manage Pages", path: "/admin/manage-pages", icon: Cog6ToothIcon },
    ];
    moreLinks = [];
  } else if (tenantPages && Object.keys(tenantPages).length > 0) {
    links = [
      tenantPages.dashboard && { label: currentLang.dashboard, path: "/tenant/dashboard", icon: HomeIcon },
      tenantPages.messages && { label: language === "ar" ? "الدردشات النشطة" : "Active Chats", path: "/tenant/messages", icon: ChatBubbleLeftRightIcon },
      tenantPages.customers && { label: currentLang.customers, path: "/tenant/customers", icon: UsersIcon },
      tenantPages.sendmessages && { label: currentLang.sendMessages, path: "/tenant/send-messages", icon: ChatBubbleLeftRightIcon },
      tenantPages.bookings && { label: currentLang.bookings, path: "/tenant/bookings", icon: CalendarDaysIcon },
      tenantPages.topup && { label: currentLang.topup, path: "/tenant/topup", icon: DocumentChartBarIcon },
      tenantPages.reports && { label: language === "ar" ? "التقارير" : "Reports", path: "/tenant/reports", icon: DocumentChartBarIcon },
    ].filter(Boolean);

    moreLinks = [
      tenantPages.analytics && { label: currentLang.analytics, path: "/tenant/analytics", icon: DocumentChartBarIcon },
      tenantPages.team && { label: currentLang.team, path: "/tenant/team", icon: UserGroupIcon },
      tenantPages.notifications && { label: currentLang.notifications, path: "/tenant/notifications", icon: BellIcon },
      tenantPages.integration && { label: language === "ar" ? "التكاملات" : "Integrations", path: "/tenant/integrations", icon: Cog6ToothIcon },
    ].filter(Boolean);
  }

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
  const isSendMessages = !!useMatch({ path: "/tenant/send-messages", end: true });

  // Determine max items to show in mobile bottom nav
  const maxVisibleNavItems = 3;
  const visibleLinks = links.slice(0, maxVisibleNavItems);
  // For mobile, hidden links are the rest of the "useful" links plus all "more" links
  const hiddenLinks = links.slice(maxVisibleNavItems).concat(moreLinks || []);

  // show bottom nav only on mobile for dashboard, customers, or send-messages (hide on any messages routes)
  // Instead of early return, render conditionally at the end

  console.log("Sidebar links to render:", links);

  // Hide sidebar on any mobile UI for any messages page
  if (isMobileUI && location.pathname.startsWith("/tenant/messages")) {
    return null;
  }

  // "More" collapsible menu for sidebar
  // For tenant: only "useful" links are shown directly, all others in "More"
  const visibleSidebarLinks = links;
  const moreSidebarLinks = moreLinks;
  const [showMoreLinks, setShowMoreLinks] = useState(false);

  return (
    <>
      {(isMobileUI && !isMessageDetail && (isDashboard || isCustomers || isSendMessages)) ? (
        <>
          <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-around py-2 sm:py-3 z-50">
            {visibleLinks.map(({ path, icon: Icon, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex flex-col items-center text-xs sm:text-sm ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
                  }`
                }
                aria-label={label}
                title={label}
              >
                <Icon className="w-6 h-6 sm:w-8 sm:h-8" aria-hidden="true" />
                <span className="mt-1">{label}</span>
              </NavLink>
            ))}
            {/* More toggle button */}
            {hiddenLinks.length > 0 && (
              <button
                onClick={() => setShowFullMoreMenu(true)}
                aria-label="More navigation"
                title="More"
                className="flex flex-col items-center text-xs sm:text-sm text-gray-600 dark:text-gray-300 focus:outline-none"
                type="button"
              >
                {/* Icon: three dots horizontal */}
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
                <span className="mt-1">More</span>
              </button>
            )}
          </nav>

          {/* Full-screen More menu overlay */}
          {showFullMoreMenu && (
            <div className="fixed inset-0 z-60 bg-white dark:bg-gray-900 overflow-auto pb-20">
              <div className="flex justify-between items-center p-4 border-b border-gray-300 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">More</h2>
                <button
                  onClick={() => setShowFullMoreMenu(false)}
                  aria-label="Close More menu"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="p-4 space-y-2">
                {hiddenLinks.map(({ path, icon: Icon, label }) => (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={() => setShowFullMoreMenu(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-md text-base font-semibold transition-colors ${
                        isActive
                          ? "bg-blue-100 dark:bg-blue-700 text-blue-900 dark:text-white font-bold"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`
                    }
                    aria-label={label}
                    title={label}
                  >
                    <Icon className="w-6 h-6" aria-hidden="true" />
                    {label}
                  </NavLink>
                ))}

                <hr className="my-4 border-gray-300 dark:border-gray-700" />

                {/* Language toggle */}
                <button
                  onClick={() => {
                    toggleLang();
                    setShowFullMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-base text-gray-700 dark:text-gray-300 font-semibold"
                >
                  <GlobeAltIcon className="w-6 h-6" aria-hidden="true" />
                  {currentLang.languageToggle}
                </button>

                {/* Dark mode toggle */}
                <button
                  onClick={() => {
                    toggleDarkMode();
                    setShowFullMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-base text-gray-700 dark:text-gray-300 font-semibold"
                >
                  {theme === "dark" ? (
                    <SunIcon className="w-6 h-6" aria-hidden="true" />
                  ) : (
                    <MoonIcon className="w-6 h-6" aria-hidden="true" />
                  )}
                  {theme === "dark" ? currentLang.lightMode : currentLang.darkMode}
                </button>

                {/* Logout button */}
                <button
                  onClick={() => {
                    setShowLogoutModal(true);
                    setShowFullMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-red-50 dark:hover:bg-red-900 text-base text-red-600 font-semibold relative z-70"
                >
                  <ArrowRightOnRectangleIcon className="w-6 h-6" aria-hidden="true" />
                  {currentLang.logout}
                </button>
              </nav>
            </div>
          )}

          {/* Logout Modal (mobile bottom nav) */}
          {showLogoutModal && (
            <div className="fixed inset-0 flex items-center justify-center z-70 bg-black bg-opacity-40">
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
        </>
      ) : (
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
                {visibleSidebarLinks.map(({ label, path, icon: Icon }) => (
                  <NavLink
                    key={path}
                    to={path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2 rounded-md text-sm font-semibold ${isActive ? "bg-blue-100 dark:bg-blue-700 text-blue-900 dark:text-white font-bold" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"}`
                    }
                  >
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    {!isCollapsed && label}
                  </NavLink>
                ))}
                {moreSidebarLinks.length > 0 && (
                  <>
                    <button
                      onClick={() => setShowMoreLinks((prev) => !prev)}
                      className="flex items-center gap-3 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 w-full"
                      aria-expanded={showMoreLinks}
                      aria-controls="sidebar-more-links"
                      type="button"
                    >
                      <Cog6ToothIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      {!isCollapsed && "More"}
                      {!isCollapsed && (
                        showMoreLinks
                          ? <ChevronUpIcon className="w-5 h-5 ml-auto" />
                          : <ChevronDownIcon className="w-5 h-5 ml-auto" />
                      )}
                    </button>
                    {showMoreLinks && (
                      <div id="sidebar-more-links" className="pl-8 space-y-2">
                        {moreSidebarLinks.map(({ label, path, icon: Icon }) => (
                          <NavLink
                            key={path}
                            to={path}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-4 py-2 rounded-md text-sm font-semibold ${isActive ? "bg-blue-100 dark:bg-blue-700 text-blue-900 dark:text-white font-bold" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"}`
                            }
                          >
                            <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            {!isCollapsed && label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </nav>
            </div>

            <div className="space-y-3 text-sm flex flex-col items-center mt-6 relative w-full">
              {isCollapsed ? (
                <div className="flex flex-col items-center space-y-4 py-4">
                  <button
                    onClick={toggleLang}
                    title={currentLang.languageToggle}
                    aria-label={currentLang.languageToggle}
                    className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    type="button"
                  >
                    <GlobeAltIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={toggleDarkMode}
                    title={theme === "dark" ? currentLang.lightMode : currentLang.darkMode}
                    aria-label={theme === "dark" ? currentLang.lightMode : currentLang.darkMode}
                    className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    type="button"
                  >
                    {theme === "dark" ? (
                      <SunIcon className="w-6 h-6 text-yellow-400" />
                    ) : (
                      <MoonIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    title={currentLang.logout}
                    aria-label={currentLang.logout}
                    className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-red-600"
                    type="button"
                  >
                    <ArrowRightOnRectangleIcon className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                <>
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
                </>
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
      )}
    </>
  );
}