export const language = localStorage.getItem("lang") || "en";

export const setLanguage = (lang) => {
  localStorage.setItem("lang", lang);
};

// 🌍 Language dictionary
export const lang = {
  en: {
    // Generic
    sidebar: "Sidebar",
    logout: "Logout",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",

    // Navigation
    dashboard: "Dashboard",
    messages: "Messages",
    customers: "Customers",
    profile: "Profile",
    bookings: "Bookings",
    topup: "Top-Up",
    analytics: "Analytics",
    notifications: "Notifications",
    team: "Team Access",

    // Admin
    adminDashboard: "Admin Dashboard",
    manageTenants: "Manage Tenants",

    // Dashboard Stats
    totalMessages: "Total Messages",
    sentToday: "Sent Today",

    // Settings
    languageToggle: "Arabic",

    // Login
    email: "Email",
    password: "Password",
    login: "Log In",
    loginError: "Login failed. Please try again.",

    // Forms & Tables
    actions: "Actions",
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",

    // Profile Section
    companyName: "Company Name",
    serviceSettings: "Service Settings",
    workingHours: "Working Hours",
    services: "Services",
    employees: "Employees",

    // Notifications
    aiSuggestions: "AI Suggestions",
    lowBalanceAlerts: "Low Balance Alerts",
    emailNotifications: "Email Notifications",

    // Team
    teamMembers: "Team Members",
    role: "Role",
    invite: "Invite",
    owner: "Owner",
    manager: "Manager",
    staff: "Staff"
  },

  ar: {
    // Generic
    sidebar: "القائمة",
    logout: "تسجيل خروج",
    darkMode: "الوضع الداكن",
    lightMode: "الوضع الفاتح",

    // Navigation
    dashboard: "لوحة التحكم",
    messages: "الرسائل",
    customers: "العملاء",
    profile: "الملف الشخصي",
    bookings: "الحجوزات",
    topup: "شحن الرصيد",
    analytics: "الإحصائيات",
    notifications: "الإشعارات",
    team: "فريق العمل",

    // Admin
    adminDashboard: "لوحة المشرف",
    manageTenants: "إدارة المستأجرين",

    // Dashboard Stats
    totalMessages: "إجمالي الرسائل",
    sentToday: "المرسلة اليوم",

    // Settings
    languageToggle: "الإنجليزية",

    // Login
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    login: "تسجيل الدخول",
    loginError: "فشل تسجيل الدخول. حاول مرة أخرى.",

    // Forms & Tables
    actions: "الإجراءات",
    add: "إضافة",
    edit: "تعديل",
    delete: "حذف",
    save: "حفظ",
    cancel: "إلغاء",

    // Profile Section
    companyName: "اسم الشركة",
    serviceSettings: "إعدادات الخدمة",
    workingHours: "ساعات العمل",
    services: "الخدمات",
    employees: "الموظفون",

    // Notifications
    aiSuggestions: "اقتراحات الذكاء الاصطناعي",
    lowBalanceAlerts: "تنبيهات الرصيد المنخفض",
    emailNotifications: "إشعارات البريد الإلكتروني",

    // Team
    teamMembers: "أعضاء الفريق",
    role: "الدور",
    invite: "دعوة",
    owner: "المالك",
    manager: "المدير",
    staff: "الموظف"
  },
};