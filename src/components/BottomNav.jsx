import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { navConfig } from "../navConfig";

function MoreModal({ show, items, onClose, language, onNavigate }) {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-[999] bg-black/30 backdrop-blur-[2px] flex items-end md:items-center justify-center transition-all"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:w-96 p-6 max-h-[60vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4 text-center">{language === "ar" ? "المزيد" : "More"}</h3>
        <div className="grid grid-cols-4 gap-4">
          {items.map(({ id, path, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => {
                onNavigate(path);
                onClose();
              }}
              className="flex flex-col items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
            >
              <Icon className="w-7 h-7 mb-1 text-blue-500 dark:text-violet-400" />
              <span className="text-xs text-gray-600 dark:text-gray-200 truncate max-w-[60px]">
                {label[language]}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="block w-full mt-6 py-2 text-center text-blue-500 dark:text-violet-400 font-bold bg-gray-50 dark:bg-gray-800 rounded-xl shadow transition"
        >
          {language === "ar" ? "إغلاق" : "Close"}
        </button>
      </div>
    </div>
  );
}

export default function BottomNav({ language, role }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  // Top 4 tabs, update these as per your priority
  const MAIN_TAB_KEYS = [
    "dashboard",
    "messages",
    "customers",
    "notifications"
  ];
  const allNavItems = navConfig.items.filter(item => item.roles.includes(role));
  const mainTabs = allNavItems.filter(item => MAIN_TAB_KEYS.includes(item.id));
  const moreTabs = allNavItems.filter(item => !MAIN_TAB_KEYS.includes(item.id));

  // "More" tab
  const navItems = [
    ...mainTabs,
    {
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
    }
  ];

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
        `}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex w-full justify-between items-end">
          {navItems.map(({ id, path, icon: Icon, label, badge }) => {
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
                  flex flex-col items-center justify-center flex-1 min-w-0 px-1 py-1
                  transition group
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
                  <Icon className={`w-7 h-7 transition-all ${selected ? "text-white" : "text-gray-400 dark:text-gray-400"}`} />
                </span>
                <span className={`text-[11px] mt-0.5 truncate ${selected ? "text-blue-600 dark:text-violet-400" : ""}`}>
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
        onNavigate={navigate}
      />
    </>
  );
}