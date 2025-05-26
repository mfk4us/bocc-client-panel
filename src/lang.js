export const language = localStorage.getItem("lang") || "en";

export const setLanguage = (lang) => {
  localStorage.setItem("lang", lang);
};

export const translations = {
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
    staff: "Staff",

    // Customer Table Headers & Filters
    nameHeader: "Name",
    phoneHeader: "Phone",
    tagsHeader: "Tags",
    notesHeader: "Notes",
    customerAgeHeader: "Customer Age (days)",
    daysSinceContactHeader: "Days Since Contact",
    actionsHeader: "Actions",
    avatarHeader: "Avatar",
    nameFilter: "Filter name",
    phoneFilter: "Filter phone",
    tagsFilter: "Filter tags",
    notesFilter: "Filter notes",
    first_seenFilter: "Filter first seen",
    last_seenFilter: "Filter last seen",
    dash: "-",
    avatarAlt: "avatar",

    // Customers Page Specific
    customerNotesTags: "Customer Notes & Tags",
    searchCustomers: "Search customers...",
    sortOptions: "Sort Options",
    tagsCommaSeparated: "Tags (comma separated)",
    tagsPlaceholder: "Add tags here...",
    notesLabel: "Notes",
    notesPlaceholder: "Write notes here...",
    filter: "Filter",
    backToDashboard: "Back to Dashboard",
    firstSeenLabel: "First Seen",
    lastSeenLabel: "Last Seen",
    prev: "Prev",
    next: "Next",
    agoSuffix: " ago",
    today: "Today",
    daysAgo: (n) => `${n} day${n === 1 ? "" : "s"} ago`,
    weeksAgo: (n) => `${n} week${n === 1 ? "" : "s"} ago`,
    monthsAgo: (n) => `${n} month${n === 1 ? "" : "s"} ago`,
    yearsAgo: (n) => `${n} year${n === 1 ? "" : "s"} ago`,
    decadesAgo: (n) => `${n} decade${n === 1 ? "" : "s"} ago`,
    showingCustomers: (from, to, total) =>
      `Showing ${from}-${to} of ${total} customers`,
    perPage: (n) => `Per page: ${n}`,

    // Messages Page Specific
    recentChats: "Recent Chats",
    showingLast24Hours: "Showing only messages from the last 24 hours",
    searchPlaceholder: "Search number or preview…",
    typeMessagePlaceholder: "Type a message...",
    customerDetails: "Customer Details",
    selectCustomer: "Select a customer to view conversation",
    noMessages: "No messages yet",
    close: "Close",
    copy: "Copy",
    copied: "Copied!",
    returnToTop: "Return to Top",
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
    staff: "الموظف",

    // Customer Table Headers & Filters
    nameHeader: "الاسم",
    phoneHeader: "رقم الجوال",
    tagsHeader: "الوسوم",
    notesHeader: "ملاحظات",
    customerAgeHeader: "عمر العميل (بالأيام)",
    daysSinceContactHeader: "أيام منذ آخر تواصل",
    actionsHeader: "الإجراءات",
    avatarHeader: "الصورة",
    nameFilter: "فلتر الاسم",
    phoneFilter: "فلتر الجوال",
    tagsFilter: "فلتر الوسوم",
    notesFilter: "فلتر الملاحظات",
    first_seenFilter: "فلتر أول تواجد",
    last_seenFilter: "فلتر آخر تواجد",
    dash: "-",
    avatarAlt: "الصورة",

    // Customers Page Specific
    customerNotesTags: "ملاحظات العملاء والوسوم",
    searchCustomers: "ابحث عن العملاء...",
    sortOptions: "خيارات الفرز",
    tagsCommaSeparated: "الوسوم (مفصولة بفاصلة)",
    tagsPlaceholder: "أضف الوسوم هنا...",
    notesLabel: "ملاحظات",
    notesPlaceholder: "أضف ملاحظات هنا...",
    filter: "تصفية",
    backToDashboard: "العودة للوحة التحكم",
    firstSeenLabel: "أول ظهور",
    lastSeenLabel: "آخر ظهور",
    prev: "السابق",
    next: "التالي",
    agoSuffix: " مضت",
    today: "اليوم",
    daysAgo: (n) => `قبل ${n} يوم`,
    weeksAgo: (n) => `قبل ${n} أسبوع`,
    monthsAgo: (n) => `قبل ${n} شهر`,
    yearsAgo: (n) => `قبل ${n} سنة`,
    decadesAgo: (n) => `قبل ${n} عقد`,
    showingCustomers: (from, to, total) =>
      `عرض ${from} إلى ${to} من أصل ${total} عميل`,
    perPage: (n) => `لكل صفحة: ${n}`,

    // Messages Page Specific
    recentChats: "الدردشات الأخيرة",
    showingLast24Hours: "عرض الرسائل من آخر 24 ساعة فقط",
    searchPlaceholder: "ابحث برقم العميل أو معاينة...",
    typeMessagePlaceholder: "اكتب رسالة...",
    customerDetails: "تفاصيل العميل",
    selectCustomer: "اختر عميلًا لعرض المحادثة",
    noMessages: "لا توجد رسائل بعد",
    close: "إغلاق",
    copy: "نسخ",
    copied: "تم النسخ!",
    returnToTop: "العودة للأعلى",
  },
};

export function lang(key, ...params) {
  const selected = language || "en";
  const dict = translations[selected] || translations["en"];
  const value = dict[key];
  if (typeof value === "function") {
    return value(...params);
  }
  return value || key;
}