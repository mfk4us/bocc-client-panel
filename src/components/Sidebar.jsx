import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { navConfig } from "../navConfig";
import logo from "../assets/varibotix-logo.jpg";

// Heroicons imports for controls
import { SunIcon, MoonIcon, UserCircleIcon, ArrowRightOnRectangleIcon, LanguageIcon } from "@heroicons/react/24/outline";

export default function Sidebar({ language, setLanguage, theme, setTheme, role }) {
  const [expanded, setExpanded] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const sidebarRef = useRef();
  // Language toggle handler
  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };
  // Theme toggle handler
  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };
  // Language label
  const languageLabel = language === "en" ? "English" : "العربية";
  // Theme label
  const themeLabel = theme === "light" ? "Light" : "Dark";
  useEffect(() => {
    if (!expanded) return;
    function handleClickOutside(event) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [expanded]);

  return (
    <aside
      ref={sidebarRef}
      className={`
        ${navConfig.palette.bgSidebar}
        ${navConfig.palette.borderSidebar}
        h-screen flex flex-col items-center py-4
        transition-all duration-200 ease-in-out
        ${expanded ? "w-60" : "w-20"} rounded-xl
      `}
      onMouseEnter={() => setExpanded(true)}
    >
      <div className="mb-8 flex items-center justify-center select-none transition-all">
        <img
          src={logo}
          alt="VARIBOTIX Logo"
          className={expanded ? "h-10 w-auto transition-all" : "h-10 w-10 transition-all"}
          style={{ borderRadius: 10, boxShadow: expanded ? "0 4px 12px #dbeafe" : "none" }}
        />
        {expanded && (
          <span className="ml-3 text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-tr from-blue-600 to-violet-400">
            VARIBOTIX
          </span>
        )}
      </div>
      <div className="flex-1 w-full overflow-y-auto max-h-[calc(100vh-10rem)] custom-scrollbar">
        <nav className="flex flex-col gap-2 w-full items-center">
          {navConfig.items.filter(item => item.roles.includes(role)).map(({ id, path, icon: Icon, label, badge }) => (
            <NavLink
              key={id}
              to={path}
              className={({ isActive }) =>
                `${
                  expanded
                    ? "flex items-center h-12 w-full px-4 justify-between rounded-xl transition-all"
                    : "flex items-center h-12 w-12 mx-auto justify-center rounded-xl transition-all"
                }
                ${
                  isActive
                    ? expanded
                      ? "bg-gradient-to-br from-blue-100 to-violet-100 text-blue-700 shadow-sm ring-1 ring-blue-300 font-bold rounded-l-xl rounded-r-md mr-1"
                      : "bg-gradient-to-br from-blue-100 to-violet-100 text-blue-700 shadow-sm ring-1 ring-blue-300 font-bold"
                    : "text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900"
                }
                `
              }
              title={label[language]}
            >
              <div className={`flex items-center gap-4 ${expanded ? "" : "justify-center w-full"}`}>
                <Icon className="w-6 h-6" />
                {expanded && (
                  <span className="font-medium">{label[language]}</span>
                )}
              </div>
              {badge && expanded && (
                <span className="ml-2 bg-gradient-to-r from-pink-100 via-rose-100 to-pink-100 text-rose-600 text-xs rounded-full px-2 py-0.5 flex items-center justify-center min-w-[24px] h-5 select-none">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      {/* Controls section - visually separated footer */}
      <div className="w-full px-0 mt-3 border-t border-gray-200 dark:border-gray-800 pt-4 pb-4 bg-gray-50 dark:bg-gray-900/60 rounded-b-2xl shadow-inner flex flex-col gap-2 items-center">
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className={`${
            expanded
              ? "flex items-center h-12 w-11/12 px-3 justify-start rounded-xl transition"
              : "flex items-center h-12 w-12 mx-auto justify-center rounded-xl transition"
          } ${navConfig.palette.textInactive}`}
          title={languageLabel}
        >
          <LanguageIcon className="w-6 h-6" />
          {expanded && <span className="ml-4 font-medium">{languageLabel}</span>}
        </button>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`${
            expanded
              ? "flex items-center h-12 w-11/12 px-3 justify-start rounded-xl transition"
              : "flex items-center h-12 w-12 mx-auto justify-center rounded-xl transition"
          } ${navConfig.palette.textInactive}`}
          title={themeLabel}
        >
          {theme === "light" ? (
            <SunIcon className="w-6 h-6" />
          ) : (
            <MoonIcon className="w-6 h-6" />
          )}
          {expanded && <span className="ml-4 font-medium">{themeLabel}</span>}
        </button>
        {/* Profile Button */}
        <button
          onClick={() => navigate('/tenant/profile')}
          className={`${
            expanded
              ? "flex items-center h-12 w-11/12 px-3 justify-start rounded-xl transition"
              : "flex items-center h-12 w-12 mx-auto justify-center rounded-xl transition"
          } ${navConfig.palette.textInactive}`}
          title="Profile"
        >
          <UserCircleIcon className="w-6 h-6" />
          {expanded && <span className="ml-4 font-medium">Profile</span>}
        </button>
        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutModal(true)}
          className={`${
            expanded
              ? "flex items-center h-12 w-11/12 px-3 justify-start rounded-xl transition"
              : "flex items-center h-12 w-12 mx-auto justify-center rounded-xl transition"
          } ${navConfig.palette.textInactive}`}
          title="Logout"
        >
          <ArrowRightOnRectangleIcon className="w-6 h-6" />
          {expanded && <span className="ml-4 font-medium">Logout</span>}
        </button>
      </div>
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl p-8 w-80 max-w-full text-center shadow-2xl border border-blue-100 dark:border-violet-900 backdrop-filter backdrop-blur-lg">
            <h2 className="text-2xl font-extrabold mb-6 text-blue-600 dark:text-blue-300">Log out?</h2>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  localStorage.clear();
                  setShowLogoutModal(false);
                  navigate('/');
                }}
                className="bg-gradient-to-r from-blue-500 via-violet-500 to-blue-600 hover:from-blue-600 hover:to-violet-600 text-white font-extrabold py-3 rounded-xl shadow-lg text-lg tracking-wide"
              >
                Logout
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-300 font-semibold py-3 rounded-xl text-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

// Minimal custom-scrollbar styling
<style>
  {`
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #c7d2fe;
      border-radius: 6px;
    }
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #c7d2fe transparent;
    }
  `}
</style>