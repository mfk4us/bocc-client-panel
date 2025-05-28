import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { navConfig } from "../navConfig";
import { logoutUser } from "../utils/logout";

function getMaxTabs(width) {
  if (width < 420) return 3;
  if (width < 700) return 4;
  if (width < 1100) return 5;
  return 7;
}

function getSize(width) {
  if (width < 500) return "xs";
  if (width < 900) return "sm";
  if (width < 1400) return "md";
  return "lg";
}

function MoreModal({ show, items, onClose, language, onNavigate, onToggleLang, onToggleTheme, onProfile, onLogout, theme, size }) {
  if (!show) return null;

  const iconSizes = {
    xs: "w-6 h-6",
    sm: "w-7 h-7",
    md: "w-8 h-8",
    lg: "w-9 h-9",
  };

  const textSizes = {
    xs: "text-[10px]",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const utilButtons = [
    {
      id: "lang",
      label: language === "en" ? "العربية" : "English",
      icon: (
        <svg className={`${iconSizes[size]}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 20h9" strokeLinecap="round"/>
          <path d="M18 20a6 6 0 0 0-6-6V4h6z" />
          <circle cx="6" cy="14" r="4" />
        </svg>
      ),
      onClick: onToggleLang,
    },
    {
      id: "theme",
      label: theme === "dark" ? (language === "en" ? "Light" : "فاتح") : (language === "en" ? "Dark" : "داكن"),
      icon: theme === "dark"
        ? (<svg className={`${iconSizes[size]}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2m9-9h-2M5 12H3m15.364-7.364l-1.414 1.414M6.05 17.95l-1.415 1.415M17.95 17.95l-1.414-1.414M6.05 6.05L4.636 7.464"/>
          </svg>)
        : (<svg className={`${iconSizes[size]}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>),
      onClick: onToggleTheme,
    },
    {
      id: "profile",
      label: language === "en" ? "Profile" : "الملف",
      icon: (
        <svg className={`${iconSizes[size]}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4" />
          <path d="M2 20c0-4 8-7 10-7s10 3 10 7" />
        </svg>
      ),
      onClick: onProfile,
    },
    {
      id: "logout",
      label: language === "en" ? "Logout" : "تسجيل خروج",
      icon: (
        <svg className={`${iconSizes[size]}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M17 16l4-4m0 0l-4-4m4 4H7" />
          <path d="M3 12a9 9 0 1 1 9 9" />
        </svg>
      ),
      onClick: onLogout,
    },
  ];

  // Responsive grid columns for util buttons
  const utilGridCols = "grid-cols-4";

  // Padding adjustments for modal container based on size
  const modalPadding = size === "xs" ? "p-4" : size === "lg" ? "p-8" : "p-6";

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/30 backdrop-blur-[2px] flex items-end md:items-center justify-center transition-all"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-gray-900 rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:w-96 max-h-[60vh] overflow-y-auto ${modalPadding}`}
        onClick={e => e.stopPropagation()}
        style={{paddingBottom: size === "xs" ? "1.5rem" : undefined}}
      >
        <h3 className={`font-bold mb-4 text-center ${textSizes[size]}`}>
          {language === "ar" ? "المزيد" : "More"}
        </h3>
        <div className="grid grid-cols-4 gap-3 mb-3">
          {items.map(({ id, path, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => {
                onNavigate(path);
                onClose();
              }}
              className={`flex flex-col items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition`}
            >
              <Icon className={`${iconSizes[size]} mb-1 text-blue-500 dark:text-violet-400`} />
              <span className={`${textSizes[size]} text-gray-600 dark:text-gray-200 truncate max-w-[60px]`}>
                {label[language]}
              </span>
            </button>
          ))}
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
        <div className="grid grid-cols-4 gap-3 pt-2">
          {utilButtons.map(util => (
            <button
              key={util.id}
              className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              onClick={() => { util.onClick(); onClose(); }}
            >
              <span className={`mb-1 text-blue-500 dark:text-violet-400`}>{util.icon}</span>
              <span className={`${textSizes[size]} text-gray-600 dark:text-gray-200`}>{util.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className={`block w-full mt-6 py-2 text-center text-blue-500 dark:text-violet-400 font-bold bg-gray-50 dark:bg-gray-800 rounded-xl shadow transition ${textSizes[size]}`}
        >
          {language === "ar" ? "إغلاق" : "Close"}
        </button>
      </div>
    </div>
  );
}

export default function BottomNav({ language, role, theme, setTheme, setLanguage }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);
  const [maxTabs, setMaxTabs] = useState(getMaxTabs(window.innerWidth));
  const [size, setSize] = useState(getSize(window.innerWidth));

  useEffect(() => {
    function handleResize() {
      setMaxTabs(getMaxTabs(window.innerWidth));
      setSize(getSize(window.innerWidth));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const allNavItems = navConfig.items.filter(item => item.roles.includes(role));
  const mainTabs = allNavItems.slice(0, maxTabs);
  const moreTabs = allNavItems.slice(maxTabs);

  function handleToggleLang() {
    setLanguage(language === "en" ? "ar" : "en");
  }
  function handleToggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }
  function handleProfile() {
    navigate("/tenant/profile");
  }
  function handleLogout() {
    logoutUser && logoutUser();
    navigate("/login");
  }

  // Icon and text sizes based on size variable
  const iconSizes = {
    xs: "w-6 h-6",
    sm: "w-7 h-7",
    md: "w-8 h-8",
    lg: "w-9 h-9",
  };

  const textSizes = {
    xs: "text-[10px]",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  // Padding for nav buttons based on size
  const buttonPadding = size === "xs" ? "px-1 py-1" : size === "lg" ? "px-3 py-2" : "px-2 py-1";

  return (
    <>
      <nav
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white/90 dark:bg-gray-900/90
          backdrop-blur-lg border-t border-gray-100 dark:border-gray-800
          shadow-xl flex justify-between px-1 py-2
          rounded-t-2xl
          transition-all
          h-[60px] sm:h-[68px] md:h-[76px]
        `}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex w-full justify-between items-end">
          {[...mainTabs, ...(moreTabs.length > 0 ? [{
            id: "more",
            path: "#more",
            icon: () => (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="5" cy="12" r="2" fill="currentColor"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
                <circle cx="19" cy="12" r="2" fill="currentColor"/>
              </svg>
            ),
            label: { en: "More", ar: "المزيد" }
          }] : [])].map(({ id, path, icon: Icon, label, badge }) => {
            const selected = location.pathname === path ||
              (id === "more" && moreTabs.some(item => location.pathname === item.path));
            return (
              <button
                key={id}
                onClick={() => {
                  if (id === "more") setShowMore(true);
                  else navigate(path);
                }}
                className={`
                  flex flex-col items-center justify-center flex-1 min-w-0
                  transition group
                  ${buttonPadding}
                  ${selected ? "font-bold text-white" : "text-gray-500 dark:text-gray-400"}
                `}
                style={{ minWidth: 0, position: "relative" }}
                title={label[language]}
              >
                <span className={`
                  rounded-full p-2 transition-all duration-200
                  ${selected
                    ? "bg-gradient-to-tr from-blue-600 to-violet-400 shadow-lg"
                    : "bg-transparent"}
                `}>
                  <Icon className={`${iconSizes[size]} transition-all ${selected ? "text-white" : "text-gray-400 dark:text-gray-400"}`} />
                </span>
                <span className={`${textSizes[size]} mt-0.5 truncate ${selected ? "text-blue-600 dark:text-violet-400" : ""}`}>
                  {label[language]}
                </span>
                {badge && (
                  <span className="absolute top-1 right-[22%] bg-gradient-to-br from-red-400 to-pink-500 text-white text-[10px] rounded-full px-1.5 py-0.5 shadow-md">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
      <MoreModal
        show={showMore}
        items={moreTabs}
        onClose={() => setShowMore(false)}
        language={language}
        theme={theme}
        onNavigate={navigate}
        onToggleLang={handleToggleLang}
        onToggleTheme={handleToggleTheme}
        onProfile={handleProfile}
        onLogout={handleLogout}
        size={size}
      />
    </>
  );
}