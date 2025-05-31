// Reusable ViewMessagesButton component
function ViewMessagesButton({ phone, label, onClick }) {
  return (
    <button
      onClick={(e) => {
        if (e) e.stopPropagation();
        onClick(phone);
      }}
      className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none transition"
      aria-label={label || `View messages for ${phone}`}
      title={label || "View Messages"}
    >
      <ChatBubbleLeftEllipsisIcon className="w-6 h-6" />
    </button>
  );
}
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import jsPDF from "jspdf";
import { ArrowsUpDownIcon, UserCircleIcon, IdentificationIcon, PhoneIcon, TagIcon, PencilSquareIcon, CalendarDaysIcon, ClockIcon, BoltIcon, PaperAirplaneIcon, ArrowDownTrayIcon, TrashIcon, FunnelIcon, ShareIcon, UsersIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';

function exportMessagesToPDF(messages, phone) {
  if (!messages || messages.length === 0) {
    alert("No messages to export!");
    return;
  }

  const doc = new jsPDF({
    orientation: "p",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 36;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.setTextColor(34, 34, 34);
  doc.text(`Chat with ${phone}`, pageWidth / 2, y, { align: "center" });

  y += 24;
  doc.setFontSize(11);

  messages.forEach(msg => {
    if (y > 760) {
      doc.addPage();
      y = 36;
    }

    // Clean content
    let cleanContent = (msg.content || "").replace(/[^\x20-\x7E\r\n]/g, "").trim();
    if (!cleanContent && msg.media_url) {
      cleanContent = "[media]";
    }

    // Bubble coloring & alignment
    let isBot = msg.type && /bot/i.test(msg.type);
    let isUser = msg.type && /user|sent|farhan/i.test(msg.type);
    let align = (isBot || isUser) ? "right" : "left";
    let bgColor, textColor;
    if (isBot) {
      bgColor = [230, 255, 230]; // green
      textColor = [27, 70, 32];
    } else if (isUser) {
      bgColor = [225, 235, 255]; // blue
      textColor = [20, 51, 120];
    } else {
      bgColor = [240, 240, 240]; // grey
      textColor = [70, 70, 70];
    }

    // Split/wrap text for PDF
    let lines = doc.splitTextToSize(cleanContent, 250);
    let dateStr = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : "";

    let lineHeight = 17;
    let bubblePadding = 8;
    let bubbleWidth = Math.max(...lines.map(l => doc.getTextWidth(l))) + bubblePadding * 2;
    if (bubbleWidth < 80) bubbleWidth = 80;
    let bubbleHeight = lines.length * lineHeight + bubblePadding * 2 + 14;
    let x = align === "right" ? pageWidth - bubbleWidth - 40 : 40;

    doc.setFillColor(...bgColor);
    doc.roundedRect(x, y, bubbleWidth, bubbleHeight, 9, 9, "F");

    doc.setTextColor(...textColor);
    doc.setFont("helvetica", "normal");
    lines.forEach((line, i) => {
      doc.text(line, x + bubblePadding, y + bubblePadding + lineHeight * (i + 1) - 6);
    });

    // Date
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text(dateStr, x + bubblePadding, y + bubbleHeight - 4);

    doc.setFontSize(11);
    y += bubbleHeight + 12;
  });

  doc.save(`messages_${phone}.pdf`);
}
import { XCircleIcon, CheckIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
// Custom Audio Player for WhatsApp-style audio messages
function CustomAudioPlayer({ src, bubbleColor, isRight }) {
  const audioRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [cur, setCur] = React.useState(0);

  // Allow only one playing at a time
  React.useEffect(() => {
    const pauseOthers = (e) => {
      if (audioRef.current && e.target !== audioRef.current) {
        audioRef.current.pause();
      }
    };
    window.addEventListener("play", pauseOthers, true);
    return () => window.removeEventListener("play", pauseOthers, true);
  }, []);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };
  React.useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      setProgress((el.currentTime / (el.duration || 1)) * 100);
      setCur(el.currentTime);
    };
    const onLoaded = () => setDuration(el.duration);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("loadedmetadata", onLoaded);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [audioRef]);

  // Progress bar click
  const handleProgressClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (audioRef.current && duration) {
      audioRef.current.currentTime = percent * duration;
    }
  };

  function fmt(t) {
    if (!t || isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  return (
    <div className="w-full flex items-center gap-2">
      <button
        className={`rounded-full p-2 bg-white/80 hover:bg-gray-100 ${bubbleColor} shadow`}
        onClick={handlePlayPause}
        aria-label={isPlaying ? "Pause" : "Play"}
        type="button"
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {isPlaying ? <PauseIcon className="w-5 h-5 text-blue-600" /> : <PlayIcon className="w-5 h-5 text-blue-600" />}
      </button>
      <div className="flex-1 cursor-pointer" onClick={handleProgressClick}>
        <div className="h-2 rounded-full bg-gray-300 dark:bg-gray-700 relative">
          <div
            className="absolute top-0 left-0 h-2 rounded-full"
            style={{
              width: `${progress}%`,
              background: isRight ? "#3b82f6" : "#10b981",
              transition: "width 0.15s"
            }}
          />
        </div>
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-200 ml-2 w-12 text-right">
        {fmt(cur)} / {fmt(duration)}
      </div>
      <audio ref={audioRef} src={src} preload="metadata" style={{ display: "none" }} />
    </div>
  );
}
import { useNavigate } from "react-router-dom";
import { supabase } from "../components/supabaseClient";
import defaultAvatar from "../assets/default-avatar.png";
import { lang } from "../lang";

// In future, this webhook URL will be set from the integration page.
const WELCOME_WEBHOOK_URL = localStorage.getItem("welcomeWebhook") || "/api/send-welcome";

// Toast component for feedback
function Toast({ message, onClose, type = "success" }) {
  React.useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className={`fixed z-50 bottom-8 left-1/2 transform -translate-x-1/2 bg-${type === "success" ? "green" : "red"}-600 text-white px-4 py-2 rounded shadow-lg`}>
      {message}
    </div>
  );
}

// helper to format a timestamp as relative time (days/weeks/years/decades ago)
function formatRelative(dateString, language) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return lang("today", language);
  if (diffDays < 7) return lang("daysAgo", language, diffDays);
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 52) return lang("weeksAgo", language, diffWeeks);
  const diffYears = Math.floor(diffDays / 365);
  if (diffYears < 10) return lang("yearsAgo", language, diffYears);
  const diffDecades = Math.floor(diffYears / 10);
  return lang("decadesAgo", language, diffDecades);
}

// helper to format a timestamp as a duration without "ago" suffix
function formatDuration(dateString, language) {
  const rel = formatRelative(dateString, language);
  const agoSuffix = lang("agoSuffix", language);
  if (rel.endsWith(agoSuffix)) {
    return rel.slice(0, -agoSuffix.length);
  }
  return rel;
}

// Elegant loading spinner component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label="Loading">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
    </div>
  );
}

export default function Customers({ language }) {
  // Declare viewingMessagesFor and messagesHistory states first
  const [viewingMessagesFor, setViewingMessagesFor] = useState(null);
  const [messagesHistory, setMessagesHistory] = useState([]);
  // State for date filter in messages modal
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Other state declarations
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  // Workflow name state, loaded from localStorage on mount
  const [workflowName, setWorkflowName] = useState(() => {
    const workflowNameFromStorage = localStorage.getItem('workflow_name');
    console.log('Loaded workflow_name from localStorage:', workflowNameFromStorage);
    return workflowNameFromStorage || null;
  });

  // Sync workflowName from localStorage and storage events
  useEffect(() => {
    const syncWorkflowName = () => {
      const storedWorkflow = localStorage.getItem("workflow_name");
      console.log('Loaded workflow_name from localStorage:', storedWorkflow);
      setWorkflowName(storedWorkflow || null);
    };
    syncWorkflowName();
    window.addEventListener("storage", syncWorkflowName);
    return () => window.removeEventListener("storage", syncWorkflowName);
  }, []);
  // State for delete confirmation modal
  const [deletingCustomerId, setDeletingCustomerId] = useState(null);
  // Handler to open the view messages modal
  const openViewMessagesModal = (phone) => {
    setViewingMessagesFor(phone);
    setExpandedCustomer(null);
  };
  // Handler to close the view messages modal
  const closeViewMessagesModal = () => {
    setViewingMessagesFor(null);
  };
  // Bulk delete/edit modals state
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkTags, setBulkTags] = useState("");
  const [bulkNotes, setBulkNotes] = useState("");
  // Bulk Delete handler
  const handleBulkDelete = () => setShowBulkDeleteModal(true);
  const confirmBulkDelete = async () => {
    const selectedPhones = [...selectedCustomers];
    const selectedIds = customers.filter(c => selectedPhones.includes(c.phone)).map(c => c.id);
    const { error } = await supabase.from("customers").delete().in("id", selectedIds);
    if (error) setToast({ message: "Failed to delete selected customers.", type: "error" });
    else {
      setToast({ message: "Selected customers deleted.", type: "success" });
      setCustomers(prev => prev.filter(c => !selectedIds.includes(c.id)));
      setSelectedCustomers([]);
    }
    setShowBulkDeleteModal(false);
  };
  // Bulk Edit handler
  const handleBulkEdit = () => {
    setBulkTags("");
    setBulkNotes("");
    setShowBulkEditModal(true);
  };
  const confirmBulkEdit = async () => {
    const selectedPhones = [...selectedCustomers];
    await Promise.all(selectedPhones.map(phone =>
      supabase.from("customer_notes")
        .update({ tags: bulkTags, notes: bulkNotes })
        .eq("customer_number", phone)
        .eq("workflow_name", workflowName)
    ));
    setToast({ message: "Updated notes/tags for selected customers.", type: "success" });
    const { data: notesData } = await supabase
      .from("customer_notes")
      .select("*")
      .eq("workflow_name", workflowName);
    const map = {};
    (notesData || []).forEach(note => {
      if(note.customer_number) map[note.customer_number] = note;
      else if(note.phone) map[note.phone] = note;
    });
    setNotesMap(map);
    setShowBulkEditModal(false);
  };
  const [focusedRow, setFocusedRow] = useState(null);
  const selectAllCheckboxRef = useRef(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [alertMsg, setAlertMsg] = useState("");
  const isPremium = false;

  // WhatsApp-style selection state for mobile UI
  const [mobileSelectMode, setMobileSelectMode] = useState(false);
  // Visual feedback for holding on card
  const [holdingPhone, setHoldingPhone] = useState(null);

  // Helper: handle long-press for mobile select with visual feedback
  const longPressTimeout = useRef(null);
  const handleCardPressStart = (phone) => {
    if (isMobile) {
      setHoldingPhone(phone);
      longPressTimeout.current = setTimeout(() => {
        setMobileSelectMode(true);
        if (!selectedCustomers.includes(phone)) {
          setSelectedCustomers([phone]);
        }
        setHoldingPhone(null);
      }, 400); // 400ms for long press
    }
  };
  const handleCardPressEnd = () => {
    clearTimeout(longPressTimeout.current);
    setHoldingPhone(null);
  };

  // Top bar select all/deselect all logic for mobile
  const handleMobileSelectAll = () => {
    if (selectedCustomers.length === paginatedCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(paginatedCustomers.map(c => c.phone));
    }
  };

  // Mobile action: cancel selection mode
  const handleMobileCancel = () => {
    setMobileSelectMode(false);
    setSelectedCustomers([]);
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 767);
  const [isPortrait, setIsPortrait] = useState(window.innerHeight >= window.innerWidth);
  // Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Detect sidebar width and set collapsed state
  useEffect(() => {
    const sidebar = document.querySelector("#sidebar");
    if (!sidebar) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setSidebarCollapsed(entry.contentRect.width < 150);
      }
    });

    resizeObserver.observe(sidebar);

    return () => resizeObserver.disconnect();
  }, []);

  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [notesMap, setNotesMap] = useState({});
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState({
    name: "",
    phone: "",
    tags: "",
    notes: "",
    first_seen: "",
    last_seen: ""
  });
  // Workflow debug state for display
  const [workflowDebug, setWorkflowDebug] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(99999);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortContainerRef = useRef(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterContainerRef = useRef(null);
  // Fetch messages for the View Messages modal
  useEffect(() => {
    if (!viewingMessagesFor) {
      setMessagesHistory([]);
      return;
    }
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("number", viewingMessagesFor)
        .order("timestamp", { ascending: true });
      if (error) {
        console.error("Failed to fetch messages:", error);
        setMessagesHistory([]);
      } else {
        setMessagesHistory(data || []);
      }
    };
    fetchMessages();
  }, [viewingMessagesFor]);

  // Filtering and sorting logic
  const filteredCustomers = useMemo(() => {
    return customers.filter(cust => {
      const noteEntry = notesMap[cust.phone] || {};
      const haystackGlobal = [
        cust.name,
        cust.phone,
        noteEntry.tags,
        noteEntry.notes
      ].join(" | ").toLowerCase();
      if (!haystackGlobal.includes(globalFilter.toLowerCase())) return false;
      const values = {
        name: cust.name || "",
        phone: cust.phone || "",
        tags: noteEntry.tags || "",
        notes: noteEntry.notes || "",
        first_seen: cust.first_seen ? new Date(cust.first_seen).toLocaleString() : "",
        last_seen: cust.last_seen ? new Date(cust.last_seen).toLocaleString() : ""
      };
      return Object.entries(columnFilters).every(([col, filter]) =>
        values[col].toLowerCase().includes(filter.toLowerCase())
      );
    });
  }, [customers, notesMap, globalFilter, columnFilters]);

  const sortedCustomers = useMemo(() => {
    if (!sortConfig.key) return filteredCustomers;
    const sorted = [...filteredCustomers].sort((a, b) => {
      let aVal = a[sortConfig.key] || "";
      let bVal = b[sortConfig.key] || "";
      if (sortConfig.key === "tags" || sortConfig.key === "notes") {
        aVal = notesMap[a.phone]?.[sortConfig.key] || "";
        bVal = notesMap[b.phone]?.[sortConfig.key] || "";
      }
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredCustomers, sortConfig, notesMap]);

  const pageCount = Math.ceil(sortedCustomers.length / pageSize);
  const paginatedCustomers = sortedCustomers.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  // Responsive/resize effects
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    const onResize = () => setIsSmallScreen(window.innerWidth <= 767);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    const handleOrientation = () => setIsPortrait(window.innerHeight >= window.innerWidth);
    window.addEventListener("resize", handleOrientation);
    return () => window.removeEventListener("resize", handleOrientation);
  }, []);

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const allSelected =
        paginatedCustomers.length > 0 &&
        paginatedCustomers.every(c => selectedCustomers.includes(c.phone));
      const someSelected =
        paginatedCustomers.some(c => selectedCustomers.includes(c.phone)) &&
        !allSelected;
      selectAllCheckboxRef.current.indeterminate = someSelected;
    }
  }, [paginatedCustomers, selectedCustomers]);

  // Keyboard shortcut: global handler for 'w' when a row is focused
  useEffect(() => {
    function handler(e) {
      if ((e.key === "w" || e.key === "W") && focusedRow) {
        e.preventDefault();
        sendWelcome(focusedRow);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focusedRow]);

  // Bulk selection handlers
  const handleSelectAll = () => {
    const pagePhones = paginatedCustomers.map(c => c.phone);
    let next;
    if (pagePhones.every(phone => selectedCustomers.includes(phone))) {
      next = selectedCustomers.filter(phone => !pagePhones.includes(phone));
    } else {
      next = Array.from(new Set([...selectedCustomers, ...pagePhones]));
    }
    setSelectedCustomers(next);
  };

  const handleSelectRow = (phone) => {
    let next;
    if (selectedCustomers.includes(phone)) {
      next = selectedCustomers.filter(p => p !== phone);
    } else {
      next = [...selectedCustomers, phone];
    }
    setSelectedCustomers(next);
  };

  // Export to Excel function
  const exportToExcel = () => {
    if (selectedCustomers.length === 0) {
      setToast({ message: "No customers selected to export.", type: "error" });
      return;
    }
    const dataToExport = customers
      .filter(cust => selectedCustomers.includes(cust.phone))
      .map(cust => ({
        Name: cust.name || '',
        Phone: cust.phone || '',
        Tags: notesMap[cust.phone]?.tags || '',
        Notes: notesMap[cust.phone]?.notes || '',
        'First Seen': cust.first_seen || '',
        'Last Seen': cust.last_seen || '',
      }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "customers_export.xlsx");
  };

  useEffect(() => {
    setSelectedCustomers(prev =>
      prev.filter(phone => customers.some(c => c.phone === phone))
    );
  }, [customers]);

  // When switching back to desktop, clear mobile select mode
  useEffect(() => {
    if (!isMobile) setMobileSelectMode(false);
  }, [isMobile]);

  // Bulk message navigation (send full customer objects)
  const handleBulkMessage = () => {
    if (selectedCustomers.length === 0) return;
    const selectedData = customers.filter(cust => selectedCustomers.includes(cust.phone));
    navigate("/tenant/campaigns", { state: { importedData: selectedData } });
  };

  // Bulk share handler
  const handleBulkShare = async () => {
    if (selectedCustomers.length === 0) return;
    const selectedData = customers.filter(cust => selectedCustomers.includes(cust.phone));
    const shareText = selectedData.map(c => `Name: ${c.name || ''}\nPhone: ${c.phone || ''}`).join('\n\n');
    const shareData = {
      title: 'Customer Contacts',
      text: shareText,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        alert('Sharing is not supported on this browser. Customer info copied to clipboard.');
        await navigator.clipboard.writeText(shareText);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // Share single customer helper
  const handleShareSingle = async (cust) => {
    const shareText = `Name: ${cust.name || ''}\nPhone: ${cust.phone || ''}`;
    const shareData = {
      title: 'Customer Contact',
      text: shareText,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        alert('Sharing not supported. Customer info copied to clipboard.');
        await navigator.clipboard.writeText(shareText);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };
  // State for sent messages count in last 24h
  const [sentMessagesCount24h, setSentMessagesCount24h] = useState(0);

  // Effect to fetch 24h sent messages count
  useEffect(() => {
    const fetchSentCount = async () => {
      if (!workflowName) return;

      // Assuming you have a Supabase table 'messages' with user and timestamp info
      // Adjust this query according to your actual data model and user identification
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("messages")
        .select("id", { count: "exact" })
        .eq("workflow_name", workflowName)
        .gt("timestamp", cutoff);

      if (!error && data) {
        setSentMessagesCount24h(data.length);
      }
    };

    fetchSentCount();
    const interval = setInterval(fetchSentCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [workflowName]);

  // Welcome message handler (SendMessages.jsx logic and keys)
  const sendWelcome = async (phone) => {
    if (!workflowName) {
      setToast({ message: "Workflow not selected", type: "error" });
      return;
    }

    // Normalize phone number: replace leading zero with '966'
    const fullNumber = phone.replace(/^0/, "966");

    // Calculate cutoff time for last 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    try {
      // Check if chat exists in last 24 hours
      const { data: existing, error: fetchErr } = await supabase
        .from("messages")
        .select("id")
        .eq("number", fullNumber)
        .eq("workflow_name", workflowName)
        .gt("timestamp", cutoff)
        .limit(1);

      if (fetchErr) {
        console.error("Error checking existing chat:", fetchErr);
        setToast({ message: "Failed to check existing chat", type: "error" });
        return;
      }

      if (existing && existing.length > 0) {
        // Navigate to existing chat
        navigate(`/tenant/messages?number=${encodeURIComponent(fullNumber)}`);
        return;
      }

      // Insert welcome message into Supabase with same keys as SendMessages.jsx
      const { error: insertErr } = await supabase.from("messages").insert([
        {
          timestamp: new Date().toISOString(),
          type: "Farhan Khan",             // Use same 'type' as in SendMessages.jsx
          number: fullNumber,
          content: lang("welcomeMessage", language) || "Welcome!",
          media_url: null,
          contact_name: "",               // Empty string if contact name unknown
          workflow_name: workflowName,
          // sender field removed
        },
      ]);

      if (insertErr) {
        console.error("Error inserting welcome message:", insertErr);
        setToast({ message: "Failed to send welcome message", type: "error" });
        return;
      }

      setToast({ message: "Welcome message sent!", type: "success" });
    } catch (e) {
      console.error("Unexpected error sending welcome message:", e);
      setToast({ message: "Failed to send welcome message", type: "error" });
    }
  };

  const handleSave = async () => {
    if (editingNoteId) {
      const { error } = await supabase
        .from("customer_notes")
        .update({ notes, tags })
        .eq("id", editingNoteId)
        .eq("workflow_name", workflowName);

      if (!error) {
        setNotesMap((prev) => ({
          ...prev,
          [editingCustomer]: { ...prev[editingCustomer], notes, tags, id: editingNoteId },
        }));
      }
    } else {
      const { data, error } = await supabase
        .from("customer_notes")
        .insert([
          {
            customer_number: editingCustomer,
            workflow_name: workflowName,
            notes,
            tags,
          },
        ])
        .select();

      if (!error && data) {
        setNotesMap((prev) => ({
          ...prev,
          [editingCustomer]: data[0],
        }));
      }
    }

    setEditingCustomer(null);
    setEditingNoteId(null);
    setNotes("");
    setTags("");
  };

  // (Removed: Load workflow name from localStorage on mount -- now handled above)

// --- Fetch customers with workflow_name filter using Supabase SDK ---

  useEffect(() => {
    setWorkflowDebug(workflowName);
    if (!workflowName) return;
    // Supabase fetch logic
    const fetchData = async () => {
      const workflow_name = localStorage.getItem('workflow_name');
      console.log('Loaded workflow_name from localStorage:', workflow_name);

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('workflow_name', workflow_name);

      if (error) {
        console.error('Supabase fetch error:', error);
      } else {
        setCustomers(data);
      }
    };
    fetchData();

    // Also fetch notes from Supabase as before
    const fetchNotes = async () => {
      const { data: notesData, error: notesError } = await supabase
        .from("customer_notes")
        .select("*")
        .eq("workflow_name", workflowName);
      if (!notesError) {
        const map = {};
        (notesData || []).forEach(note => {
          if(note.customer_number) {
            map[note.customer_number] = note;
          } else if(note.phone) {
            map[note.phone] = note;
          }
        });
        setNotesMap(map);
      }
    };
    fetchNotes();
  }, [workflowName]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (showSortMenu && sortContainerRef.current && !sortContainerRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSortMenu]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (showFilterMenu && filterContainerRef.current && !filterContainerRef.current.contains(event.target)) {
        setShowFilterMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterMenu]);

  // --- Render ---
  if (!workflowName) {
    return (
      <div className="p-10 bg-white dark:bg-gray-800 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="mb-4 text-red-700 text-lg font-bold flex items-center gap-2">
          ⚠️ {lang("noWorkflowSelected", language) || "No workflow selected!"}
        </div>
      </div>
    );
  }
  if (customers.length === 0) {
    return <LoadingSpinner />;
  }
  return (
    <>
    <div className="flex flex-col h-[100vh] min-h-0 p-2" dir={localStorage.getItem("lang") === "ar" ? "rtl" : "ltr"}>
      {/* MOBILE: Selection header and search/buttons wrapper */}
      <div className="relative">
        {/* Mobile selection header */}
        {isMobile && mobileSelectMode && (
          <div
            className="fixed top-0 left-0 right-0 z-[60] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3 py-2 shadow-md"
            style={{
              minHeight: 56,
              boxShadow: "0 2px 10px 0 rgba(0,0,0,0.06)",
              alignItems: "center",
              paddingBottom: 8, // to add some bottom space under the header
            }}
          >
            <button
              onClick={handleMobileSelectAll}
              className="w-auto min-w-[44px] h-8 flex items-center justify-center rounded-full bg-transparent text-blue-600 font-semibold text-base whitespace-nowrap focus:outline-none"
              aria-label={selectedCustomers.length === paginatedCustomers.length ? "Clear All" : "Select All"}
              style={{ paddingLeft: 8, paddingRight: 8 }}
            >
              {selectedCustomers.length === paginatedCustomers.length ? "Clear All" : "Select All"}
            </button>
            <span className="font-semibold text-base text-gray-900 dark:text-gray-100">
              {selectedCustomers.length} {lang("selected", language) || "selected"}
            </span>
            <button
              className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-100 font-bold text-base shadow hover:bg-gray-300 dark:hover:bg-gray-800 transition"
              style={{ minWidth: 44, minHeight: 44 }}
              onClick={handleMobileCancel}
              aria-label="Cancel selection"
            >
              <XCircleIcon className="w-7 h-7" />
            </button>
          </div>
        )}
        {/* Search and buttons bar, with marginTop if mobileSelectMode */}
        <div
          className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full"
          style={
            isMobile && mobileSelectMode
              ? { marginTop: 64 }
              : undefined
          }
        >
          {!(isMobile && mobileSelectMode && selectedCustomers.length > 0) && (
            <h1
              className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white truncate flex items-center gap-2"
              style={{ minWidth: 0 }}
            >
              <UsersIcon className="w-8 h-8" aria-hidden="true" />
              {lang("Manage Customers", language) || "Manage Customers"}
            </h1>
          )}
          <div className="flex flex-grow items-center gap-2 relative">
            <div className="flex-grow">
              <input
                type="text"
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                placeholder={lang("searchCustomers", language) || "Search customers..."}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm sm:text-base"
                aria-label={lang("searchCustomers", language) || "Search customers"}
              />
            </div>
            <div className="flex space-x-2 ml-auto">
              <div ref={sortContainerRef} className="relative">
                {/* Sort button and menu */}
                <button
                  onClick={() => {
                    setShowSortMenu((v) => !v);
                    setShowFilterMenu(false);
                  }}
                  aria-label="Sort"
                  aria-haspopup="true"
                  aria-expanded={showSortMenu}
                  tabIndex={0}
                  className={`flex items-center px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition text-gray-700 dark:text-gray-200 ${showSortMenu ? "ring-2 ring-blue-500 dark:ring-blue-400" : ""}`}
                  type="button"
                >
                  <ArrowsUpDownIcon className="w-5 h-5" aria-hidden="true" />
                </button>
                {showSortMenu && (
                  <div
                    className="absolute z-40 mt-2 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 px-3"
                    tabIndex={-1}
                    style={{ right: 0, left: "auto" }}
                  >
                    <button
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-800 ${
                        sortConfig.key === "name" ? "font-bold text-blue-700 dark:text-blue-300" : "text-gray-800 dark:text-gray-200"
                      }`}
                      onClick={() => {
                        setSortConfig({ key: "name", direction: sortConfig.direction === "asc" ? "desc" : "asc" });
                        setShowSortMenu(false);
                      }}
                      aria-label="Sort by name"
                    >
                      {lang("nameHeader", language)} {sortConfig.key === "name" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-800 ${
                        sortConfig.key === "phone" ? "font-bold text-blue-700 dark:text-blue-300" : "text-gray-800 dark:text-gray-200"
                      }`}
                      onClick={() => {
                        setSortConfig({ key: "phone", direction: sortConfig.direction === "asc" ? "desc" : "asc" });
                        setShowSortMenu(false);
                      }}
                      aria-label="Sort by phone"
                    >
                      {lang("phoneHeader", language)} {sortConfig.key === "phone" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-800 ${
                        sortConfig.key === "first_seen" ? "font-bold text-blue-700 dark:text-blue-300" : "text-gray-800 dark:text-gray-200"
                      }`}
                      onClick={() => {
                        setSortConfig({ key: "first_seen", direction: sortConfig.direction === "asc" ? "desc" : "asc" });
                        setShowSortMenu(false);
                      }}
                      aria-label="Sort by first seen"
                    >
                      {lang("First Seen", language) || "First Seen"} {sortConfig.key === "first_seen" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-800 ${
                        sortConfig.key === "last_seen" ? "font-bold text-blue-700 dark:text-blue-300" : "text-gray-800 dark:text-gray-200"
                      }`}
                      onClick={() => {
                        setSortConfig({ key: "last_seen", direction: sortConfig.direction === "asc" ? "desc" : "asc" });
                        setShowSortMenu(false);
                      }}
                      aria-label="Sort by last seen"
                    >
                      {lang("Last Seen", language) || "Last Seen"} {sortConfig.key === "last_seen" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                    </button>
                  </div>
                )}
              </div>
              <div ref={filterContainerRef} className="relative">
                {/* Filter button and menu */}
                <button
                  onClick={() => {
                    setShowFilterMenu((v) => !v);
                    setShowSortMenu(false);
                  }}
                  aria-label="Filter"
                  aria-haspopup="true"
                  aria-expanded={showFilterMenu}
                  tabIndex={0}
                  className={`flex items-center px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition text-gray-700 dark:text-gray-200 ${showFilterMenu ? "ring-2 ring-blue-500 dark:ring-blue-400" : ""}`}
                  type="button"
                >
                  <FunnelIcon className="w-5 h-5" aria-hidden="true" />
                </button>
                {showFilterMenu && (
                  <div
                    className="absolute z-40 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 px-3"
                    tabIndex={-1}
                    style={{ right: 0, left: "auto" }}
                  >
                    <div className="mb-2 font-semibold text-gray-800 dark:text-gray-200 text-sm">
                      {lang("Filter Customers", language) || "Filter Customers"}
                    </div>
                    <div className="flex flex-col gap-3">
                      <input
                        type="text"
                        className="w-full p-2 text-xs rounded border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring focus:ring-blue-300 dark:focus:ring-blue-600"
                        placeholder={lang("nameHeader", language) || "Name"}
                        value={columnFilters.name}
                        onChange={(e) => setColumnFilters((f) => ({ ...f, name: e.target.value }))}
                        aria-label={lang("filterByName", language)}
                        autoFocus
                      />
                      <input
                        type="text"
                        className="w-full p-2 text-xs rounded border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring focus:ring-blue-300 dark:focus:ring-blue-600"
                        placeholder={lang("phoneHeader", language) || "Phone"}
                        value={columnFilters.phone}
                        onChange={(e) => setColumnFilters((f) => ({ ...f, phone: e.target.value }))}
                        aria-label={lang("filterByPhone", language)}
                      />
                      <input
                        type="text"
                        className="w-full p-2 text-xs rounded border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring focus:ring-blue-300 dark:focus:ring-blue-600"
                        placeholder={lang("tagsHeader", language) || "Tags"}
                        value={columnFilters.tags}
                        onChange={(e) => setColumnFilters((f) => ({ ...f, tags: e.target.value }))}
                        aria-label={lang("filterByTags", language)}
                      />
                      <input
                        type="text"
                        className="w-full p-2 text-xs rounded border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring focus:ring-blue-300 dark:focus:ring-blue-600"
                        placeholder={lang("notesHeader", language) || "Notes"}
                        value={columnFilters.notes}
                        onChange={(e) => setColumnFilters((f) => ({ ...f, notes: e.target.value }))}
                        aria-label={lang("filterByNotes", language)}
                      />
                      <input
                        type="text"
                        className="w-full p-2 text-xs rounded border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring focus:ring-blue-300 dark:focus:ring-blue-600"
                        placeholder={lang("First Seen", language) || "First Seen"}
                        value={columnFilters.first_seen}
                        onChange={(e) => setColumnFilters((f) => ({ ...f, first_seen: e.target.value }))}
                        aria-label={lang("filterByFirstSeen", language)}
                      />
                      <input
                        type="text"
                        className="w-full p-2 text-xs rounded border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring focus:ring-blue-300 dark:focus:ring-blue-600"
                        placeholder={lang("Last Seen", language) || "Last Seen"}
                        value={columnFilters.last_seen}
                        onChange={(e) => setColumnFilters((f) => ({ ...f, last_seen: e.target.value }))}
                        aria-label={lang("filterByLastSeen", language)}
                      />
                      <label className="block mb-2 mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {/* Intentionally blank for spacing, or you could add helper text */}
                      </label>
                      <div className="flex justify-end">
                        <button
                          className="text-xs px-3 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                          onClick={() => {
                            setColumnFilters({
                              name: "",
                              phone: "",
                              tags: "",
                              notes: "",
                              first_seen: "",
                              last_seen: ""
                            });
                            setShowFilterMenu(false);
                          }}
                          aria-label={lang("clearFilters", language) || "Clear Filters"}
                        >
                          {lang("clearFilters", language) || "Clear Filters"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bulk action navbar */}
      {isMobile && mobileSelectMode && selectedCustomers.length > 0 && (
        <>
          {/* Hide main bottom navbar when in mobile select mode */}
          <style>{`
            #main-bottom-navbar {
              display: none !important;
            }
          `}</style>
          <nav
            className="fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-md flex justify-around items-center p-2"
            style={{ minHeight: 56, paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <button
              onClick={handleBulkMessage}
              aria-label="Bulk message"
              className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md min-w-[44px] min-h-[44px] bg-transparent"
            >
              <PaperAirplaneIcon className="w-6 h-6 text-blue-500" />
              <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">Bulk Message</span>
            </button>
            <button
              onClick={exportToExcel}
              aria-label="Export to Excel"
              className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md min-w-[44px] min-h-[44px] bg-transparent"
            >
              <ArrowDownTrayIcon className="w-6 h-6 text-green-500" />
              <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">Export</span>
            </button>
            <button
              onClick={handleBulkShare}
              aria-label="Share contacts"
              className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md min-w-[44px] min-h-[44px] bg-transparent"
            >
              <ShareIcon className="w-6 h-6 text-indigo-500" />
              <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">Share</span>
            </button>
            <button
              onClick={handleBulkEdit}
              aria-label="Bulk edit"
              className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md min-w-[44px] min-h-[44px] bg-transparent"
            >
              <PencilSquareIcon className="w-6 h-6 text-yellow-400" />
              <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">Edit</span>
            </button>
            <button
              onClick={handleBulkDelete}
              aria-label="Bulk delete"
              className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md min-w-[44px] min-h-[44px] bg-transparent"
            >
              <TrashIcon className="w-6 h-6 text-red-500" />
              <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">Delete</span>
            </button>
          </nav>
        </>
      )}

      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: "96px + env(safe-area-inset-bottom)" }}>
        {/* Table for desktop, cards for mobile */}
        {!isMobile && (
          <table className="w-full table-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
            <thead className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700 shadow-sm">
              <tr className="uppercase tracking-wide font-semibold text-xs sm:text-sm text-gray-600 dark:text-gray-300 select-none">
                <th className="p-3 text-center align-middle border-r border-gray-200 dark:border-gray-700 w-12">
                  <input
                    type="checkbox"
                    ref={selectAllCheckboxRef}
                    checked={
                      paginatedCustomers.length > 0 &&
                      paginatedCustomers.every((c) => selectedCustomers.includes(c.phone))
                    }
                    onChange={handleSelectAll}
                    aria-label={lang("Select All", language)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="p-3 text-center align-middle border-r border-gray-200 dark:border-gray-700 w-10 text-gray-500">#</th>
                <th className="p-3 text-center align-middle border-r border-gray-200 dark:border-gray-700 w-16">
                  <UserCircleIcon className="w-5 h-5 mx-auto text-gray-500 dark:text-gray-400" aria-hidden="true" />
                  <span className="sr-only">{lang("avatar", language)}</span>
                </th>
                <th className="p-3 text-center align-middle border-r border-gray-200 dark:border-gray-700 min-w-[140px]">
                  <div className="flex items-center justify-center gap-2 select-none">
                    <IdentificationIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{lang("nameHeader", language)}</span>
                  </div>
                </th>
                <th className="p-3 text-center align-middle border-r border-gray-200 dark:border-gray-700 min-w-[120px]">
                  <div className="flex items-center justify-center gap-2 select-none">
                    <PhoneIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{lang("phoneHeader", language)}</span>
                  </div>
                </th>
                <th className="p-3 text-center align-middle border-r border-gray-200 dark:border-gray-700 min-w-[140px]">
                  <div className="flex items-center justify-center gap-2 select-none">
                    <TagIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{lang("tagsHeader", language)}</span>
                  </div>
                </th>
                <th className="p-3 text-center align-middle border-r border-gray-200 dark:border-gray-700 min-w-[180px]">
                  <div className="flex items-center justify-center gap-2 select-none">
                    <PencilSquareIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{lang("notesHeader", language)}</span>
                  </div>
                </th>
                <th className="p-3 text-center align-middle border-r border-gray-200 dark:border-gray-700 min-w-[120px]">
                  <div className="flex items-center justify-center gap-2 select-none">
                    <CalendarDaysIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">First Seen</span>
                  </div>
                </th>
                <th className="p-3 text-center align-middle border-r border-gray-200 dark:border-gray-700 min-w-[120px]">
                  <div className="flex items-center justify-center gap-2 select-none">
                    <ClockIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Last Seen</span>
                  </div>
                </th>
                <th className="p-3 text-center align-middle w-28">
                  <div className="flex items-center justify-center gap-2 select-none">
                    <BoltIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{lang("actions", language)}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((cust, index) => {
                const noteEntry = notesMap[cust.phone] || {};
                return (
                  <tr
                    key={cust.id}
                    className="border-t hover:bg-blue-50 dark:hover:bg-gray-800 transition"
                    tabIndex={0}
                    onFocus={() => setFocusedRow(cust.phone)}
                    style={{ outline: "none" }}
                    aria-label={`Row for ${cust.name || cust.phone}`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(cust.phone)}
                        onChange={() => handleSelectRow(cust.phone)}
                        aria-label={`Select ${cust.name || cust.phone}`}
                      />
                    </td>
                    <td className="p-3 text-center font-medium text-gray-900 dark:text-white">{pageIndex * pageSize + index + 1}</td>
                    <td className="p-3 text-center">
                      <img src={defaultAvatar} alt={lang("avatarAlt", language)} className="w-8 h-8 rounded-full mx-auto" />
                    </td>
                    <td className="p-3 text-left font-medium text-gray-900 dark:text-white">{cust.name}</td>
                    <td className="p-3 text-center text-gray-900 dark:text-white">{cust.phone}</td>
                    <td className="p-3 text-left text-sm text-gray-700 dark:text-gray-300">{noteEntry.tags}</td>
                    <td className="p-3 text-left text-sm text-gray-700 dark:text-gray-300">{noteEntry.notes}</td>
                    <td className="p-3 text-center text-gray-900 dark:text-white">
                      {cust.first_seen ? formatDuration(cust.first_seen, language) : ""}
                    </td>
                    <td className="p-3 text-center text-gray-900 dark:text-white">
                      {cust.last_seen ? formatRelative(cust.last_seen, language) : ""}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex flex-row flex-nowrap items-center justify-center gap-[1px] sm:gap-[2px] md:gap-[3px] w-full">
                    <button
                      onClick={() => setDeletingCustomerId(cust.id)}
                      className="p-2 rounded-md text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label={`Delete ${cust.name || cust.phone}`}
                      title="Delete"
                    >
                      <TrashIcon className="w-6 h-6" />
                    </button>
                    <ViewMessagesButton
                      phone={cust.phone}
                      label={`View messages for ${cust.name || cust.phone}`}
                      onClick={openViewMessagesModal}
                    />
                        <button
                          onClick={() => {
                            setEditingCustomer(cust.phone);
                            setEditingNoteId(noteEntry.id || null);
                            setNotes(noteEntry.notes || "");
                            setTags(noteEntry.tags || "");
                          }}
                          className="p-2 rounded-md text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label={lang("edit", language)}
                          title={lang("edit", language)}
                        >
                          <PencilSquareIcon className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => sendWelcome(cust.phone)}
                          className="p-2 rounded-md text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                          aria-label={lang("sendWelcome", language) || "Send Welcome"}
                          title={lang("sendWelcome", language) || "Send Welcome"}
                        >
                          <PaperAirplaneIcon className="w-6 h-6" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {isMobile && (
          <div className="space-y-4 mt-1 pb-32">
            {paginatedCustomers.map((cust, idx) => {
              const noteEntry = notesMap[cust.phone] || {};
              const isSelected = selectedCustomers.includes(cust.phone);
              const isHolding = holdingPhone === cust.phone;
              // Always disable user selection on card for mobile cards
              return (
                <div
                  key={cust.id}
                  className={`relative flex items-center mx-2 my-1 rounded-2xl shadow-xl
                    ${isHolding ? "opacity-80 border-blue-400" : ""}
                    ${isSelected ? "border-2 border-blue-600 bg-blue-50 dark:bg-blue-900" : "border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"}
                  `}
                  style={{
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    marginTop: idx === 0 ? 0 : 12,
                    marginBottom: 0,
                    boxShadow: "0 6px 32px 0 rgba(30,30,30,0.10), 0 2px 8px 0 rgba(30,30,30,0.07)",
                    minHeight: 80,
                    transition: "border 0.18s, opacity 0.18s",
                    ...(isHolding ? { border: "2px solid #60a5fa", opacity: 0.8 } : {}),
                  }}
                  onTouchStart={() => handleCardPressStart(cust.phone)}
                  onTouchEnd={handleCardPressEnd}
                  onMouseDown={() => handleCardPressStart(cust.phone)}
                  onMouseUp={handleCardPressEnd}
                  onMouseLeave={handleCardPressEnd}
                  onClick={() => {
                    if (mobileSelectMode) {
                      handleSelectRow(cust.phone);
                    } else {
                      setExpandedCustomer(expandedCustomer === cust.phone ? null : cust.phone);
                    }
                  }}
                  tabIndex={0}
                  aria-label={`Card for ${cust.name || cust.phone}`}
                >
                  {/* Checkmark icon for selected cards */}
                  {isSelected && (
                    <span className="absolute top-2 right-2 z-10 bg-blue-600 rounded-full p-1">
                      <CheckIcon className="w-5 h-5 text-white" />
                    </span>
                  )}
                  {/* Card content */}
                  <div className="flex-1 px-4 py-3">
                    <div className="flex flex-row items-center gap-4">
                      <div className="relative">
                        <img
                          src={defaultAvatar}
                          alt={lang("avatarAlt", language)}
                          className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 shadow"
                          style={{ minWidth: 40, minHeight: 40, objectFit: "cover" }}
                        />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-base font-bold text-gray-900 dark:text-white truncate"
                            style={{ maxWidth: "8rem" }}
                          >
                            {cust.name || cust.phone}
                          </span>
                          {cust.name && (
                            <span
                              className="text-xs text-gray-500 dark:text-gray-300 truncate"
                              style={{ maxWidth: "10rem" }}
                              title={cust.phone}
                            >
                              {cust.phone}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 text-xs">
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900 rounded-full text-blue-700 dark:text-blue-300 font-medium truncate max-w-[7rem]">
                            {noteEntry.tags || lang("dash", language)}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-800 dark:text-gray-200 truncate max-w-[7rem]">
                            {noteEntry.notes || lang("dash", language)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between pt-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        <span className="font-medium">{lang("firstSeenLabel", language)}:</span>{" "}
                        {cust.first_seen ? formatDuration(cust.first_seen, language) : lang("dash", language)}
                      </span>
                      <span>
                        <span className="font-medium">{lang("lastSeenLabel", language)}:</span>{" "}
                        {cust.last_seen ? formatRelative(cust.last_seen, language) : lang("dash", language)}
                      </span>
                    </div>
                    {/* Expanded actions for mobile card */}
                    {(expandedCustomer === cust.phone || mobileSelectMode) && (
                      <div
                        className={`flex flex-row items-center justify-center gap-4 px-2 pb-1 pt-2 ${mobileSelectMode ? "opacity-50 pointer-events-none" : ""}`}
                        style={{
                          borderTop: "1px solid #e5e7eb",
                          marginTop: 8,
                          paddingTop: 10,
                          transition: "opacity 0.2s",
                          ...(mobileSelectMode ? { display: "none" } : {}),
                        }}
                      >
                        {/* Only show if not in select mode */}
                        {!mobileSelectMode && (
                          <>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                sendWelcome(cust.phone);
                                setExpandedCustomer(null);
                              }}
                              className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 shadow hover:bg-green-200 dark:hover:bg-green-800 focus:outline-none transition"
                              aria-label={lang("sendWelcome", language) || "Send Welcome"}
                            >
                              <PaperAirplaneIcon className="w-6 h-6" />
                            </button>
                            <ViewMessagesButton
                              phone={cust.phone}
                              label={`View messages for ${cust.name || cust.phone}`}
                              onClick={openViewMessagesModal}
                            />
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleShareSingle(cust);
                                setExpandedCustomer(null);
                              }}
                              className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 shadow hover:bg-indigo-200 dark:hover:bg-indigo-800 focus:outline-none transition"
                              aria-label={`Share ${cust.name || cust.phone}`}
                            >
                              <ShareIcon className="w-6 h-6" />
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setEditingCustomer(cust.phone);
                                setEditingNoteId(noteEntry.id || null);
                                setNotes(noteEntry.notes || "");
                                setTags(noteEntry.tags || "");
                                setExpandedCustomer(null);
                              }}
                              className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shadow hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none transition"
                              aria-label={lang("edit", language)}
                            >
                              <PencilSquareIcon className="w-6 h-6" />
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setDeletingCustomerId(cust.id);
                                setExpandedCustomer(null);
                              }}
                              className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 shadow hover:bg-red-200 dark:hover:bg-red-800 focus:outline-none transition"
                              aria-label={lang("delete", language)}
                            >
                              <TrashIcon className="w-6 h-6" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bulk Message, Export, Edit, Delete, and Clear Selection Floating Buttons (desktop) */}
      {!isMobile && selectedCustomers.length > 0 && (
        <div className="fixed bottom-8 right-8 z-40 flex space-x-4">
          <button
            className="bg-blue-600 text-white px-5 py-2 rounded-full shadow hover:bg-blue-700 text-sm font-semibold flex items-center gap-3"
            onClick={handleBulkMessage}
            aria-label="Bulk message"
          >
            <span className="text-lg">📤</span>
            Bulk message ({selectedCustomers.length})
            <span className="ml-4 text-xs bg-blue-300 dark:bg-blue-700 rounded px-2 py-0.5 whitespace-nowrap">
              Sent last 24h: {sentMessagesCount24h}
            </span>
          </button>
          <button
            className="bg-green-600 text-white px-5 py-2 rounded-full shadow hover:bg-green-700 text-sm font-semibold flex items-center gap-2"
            onClick={exportToExcel}
            aria-label="Export to Excel"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Export to Excel
          </button>
          <button
            className="bg-yellow-500 text-white px-5 py-2 rounded-full shadow hover:bg-yellow-600 text-sm font-semibold flex items-center gap-2"
            onClick={handleBulkEdit}
            aria-label="Bulk edit"
          >
            <PencilSquareIcon className="w-5 h-5" />
            Bulk edit
          </button>
          <button
            className="bg-red-600 text-white px-5 py-2 rounded-full shadow hover:bg-red-700 text-sm font-semibold flex items-center gap-2"
            onClick={handleBulkDelete}
            aria-label="Bulk delete"
          >
            <TrashIcon className="w-5 h-5" />
            Bulk delete
          </button>
          <button
            className="bg-red-100 text-red-700 px-5 py-2 rounded-full shadow hover:bg-red-200 text-sm font-semibold flex items-center gap-2"
            onClick={() => setSelectedCustomers([])}
            aria-label="Clear selection"
          >
            <XCircleIcon className="w-5 h-5" />
            Clear selection
          </button>
        </div>
      )}

      {!isMobile && (
        <nav id="main-bottom-navbar" className="sticky bottom-0 w-full bg-white dark:bg-gray-800 p-2 flex justify-center items-center">
          <div className="text-center text-gray-700 dark:text-gray-300">
            {lang(
              "showingCustomers",
              language,
              (pageIndex * pageSize) + 1,
              Math.min((pageIndex + 1) * pageSize, sortedCustomers.length),
              sortedCustomers.length
            )}
          </div>
        </nav>
      )}

      {/* Edit Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              ✏️ {lang("edit", language)} {editingCustomer}
            </h3>

            <label className="block mb-2 font-medium text-gray-900 dark:text-gray-100">{lang("tagsCommaSeparated", language)}</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full p-2 border rounded mb-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              placeholder={lang("tagsPlaceholder", language)}
            />

            <label className="block mb-2 font-medium text-gray-900 dark:text-gray-100">{lang("notesLabel", language)}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border rounded mb-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              placeholder={lang("notesPlaceholder", language)}
              rows={4}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditingCustomer(null);
                  setEditingNoteId(null);
                  setNotes("");
                  setTags("");
                  setMobileSelectMode(false);
                }}
                className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded text-gray-900 dark:text-gray-100"
              >
                {lang("cancel", language)}
              </button>
              <button
                onClick={() => {
                  handleSave();
                  setMobileSelectMode(false);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {lang("save", language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    {/* Toast for feedback */}
    <Toast
      message={toast.message}
      onClose={() => setToast({ message: "", type: "success" })}
      type={toast.type}
    />
    {/* Modal/alert for selection limit */}
    {alertMsg && (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg max-w-xs text-center">
          <div className="text-red-600 font-bold mb-2">Limit Exceeded</div>
          <div className="mb-4">{alertMsg}</div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => setAlertMsg("")}
          >
            OK
          </button>
        </div>
      </div>
    )}
    {/* Delete confirmation modal */}
    {deletingCustomerId && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg max-w-sm w-full text-center">
          <div className="text-xl font-semibold text-red-700 mb-4">Delete Customer</div>
          <div className="mb-6 text-gray-700 dark:text-gray-200">
            Are you sure you want to delete this customer? This action cannot be undone.
          </div>
          <div className="mb-6 text-xs text-gray-500 dark:text-gray-400">
            Note: If this customer contacts your business again, they will automatically reappear in your customer list.
          </div>
          <div className="flex justify-center gap-4">
            <button
              className="bg-gray-200 dark:bg-gray-700 px-5 py-2 rounded text-gray-900 dark:text-gray-100 font-semibold"
              onClick={() => setDeletingCustomerId(null)}
            >
              Cancel
            </button>
            <button
              className="bg-red-600 text-white px-5 py-2 rounded font-semibold hover:bg-red-700"
              onClick={async () => {
                const { error } = await supabase
                  .from("customers")
                  .delete()
                  .eq("id", deletingCustomerId);

                if (error) {
                  setToast({ message: "Failed to delete customer.", type: "error" });
                  console.error(error);
                } else {
                  setToast({ message: "Customer deleted successfully.", type: "success" });
                  setCustomers(prev => prev.filter(cust => cust.id !== deletingCustomerId));
                  setSelectedCustomers(prev => prev.filter(phone => {
                    const cust = customers.find(c => c.id === deletingCustomerId);
                    if (!cust) return true;
                    return phone !== cust.phone;
                  }));
                }
                setDeletingCustomerId(null);
              }}
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </div>
    )}
    {/* Bulk Delete Confirmation Modal */}
    {showBulkDeleteModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg max-w-sm w-full text-center">
          <div className="text-xl font-semibold text-red-700 mb-4">Delete Selected Customers</div>
          <div className="mb-6 text-gray-700 dark:text-gray-200">
            Are you sure you want to delete {selectedCustomers.length} selected customers? This action cannot be undone.
          </div>
          <div className="mb-6 text-xs text-gray-500 dark:text-gray-400">
            Note: If any of these customers contacts your business again, they will automatically reappear in your customer list.
          </div>
          <div className="flex justify-center gap-4">
            <button className="bg-gray-200 dark:bg-gray-700 px-5 py-2 rounded text-gray-900 dark:text-gray-100 font-semibold"
              onClick={() => {
                setShowBulkDeleteModal(false);
              }}>
              Cancel
            </button>
            <button className="bg-red-600 text-white px-5 py-2 rounded font-semibold hover:bg-red-700"
              onClick={() => {
                confirmBulkDelete();
              }}>
              Confirm Delete
            </button>
          </div>
        </div>
      </div>
    )}
    {/* Bulk Edit Modal */}
    {showBulkEditModal && (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Bulk Edit {selectedCustomers.length} Customers
          </h3>
          <label className="block mb-2 font-medium text-gray-900 dark:text-gray-100">Tags (comma separated)</label>
          <input type="text" value={bulkTags} onChange={e => setBulkTags(e.target.value)}
            className="w-full p-2 border rounded mb-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            placeholder="Enter tags" />
          <label className="block mb-2 font-medium text-gray-900 dark:text-gray-100">Notes</label>
          <textarea value={bulkNotes} onChange={e => setBulkNotes(e.target.value)}
            className="w-full p-2 border rounded mb-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            placeholder="Enter notes" rows={3} />
          <div className="flex justify-end gap-2">
            <button onClick={() => {
              setShowBulkEditModal(false);
            }}
              className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded text-gray-900 dark:text-gray-100">
              Cancel
            </button>
            <button onClick={() => {
              confirmBulkEdit();
            }}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    )}
    {/* View Messages Modal (centered, responsive, outside cards/UI) */}
    {viewingMessagesFor && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-900 max-w-[95vw] w-full sm:max-w-lg max-h-[85vh] rounded-lg shadow-lg flex flex-col p-4 overflow-y-auto relative">
          {/* Date Filter Modal */}
          {showDateFilter && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-xs flex flex-col items-center">
                <h4 className="text-base font-semibold mb-4 text-gray-900 dark:text-gray-100">Filter by Date Range</h4>
                <div className="flex flex-col gap-4 w-full mb-4">
                  <label className="flex flex-col text-sm font-medium text-gray-700 dark:text-gray-200">
                    From
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className="mt-1 p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </label>
                  <label className="flex flex-col text-sm font-medium text-gray-700 dark:text-gray-200">
                    To
                    <input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className="mt-1 p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </label>
                </div>
                <div className="flex gap-3 w-full justify-end">
                  <button
                    className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    onClick={() => setShowDateFilter(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => {
                      setShowDateFilter(false);
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button
                className="mr-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
                aria-label="Filter messages"
                type="button"
                onClick={() => setShowDateFilter(true)}
              >
                <FunnelIcon className="w-6 h-6 text-blue-500" />
              </button>
              {/* PDF download button */}
              <button
                className="ml-1 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
                aria-label="Download messages as PDF"
                type="button"
                onClick={() => {
                  // Filter messages according to current date filter
                  let filtered = messagesHistory;
                  if (dateFrom) {
                    const fromDate = new Date(dateFrom + "T00:00:00");
                    filtered = filtered.filter(m => new Date(m.timestamp) >= fromDate);
                  }
                  if (dateTo) {
                    const toDate = new Date(dateTo + "T23:59:59.999");
                    filtered = filtered.filter(m => new Date(m.timestamp) <= toDate);
                  }
                  // TODO: Implement PDF export logic here (replace this with your PDF export function)
                  exportMessagesToPDF(filtered, viewingMessagesFor);
                }}
              >
                <ArrowDownTrayIcon className="w-6 h-6 text-green-600" />
              </button>
              {/* Show clear filter button if filter is active */}
              {(dateFrom || dateTo) && (
                <button
                  className="ml-1 p-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-600 focus:outline-none"
                  aria-label="Clear date filter"
                  title="Clear date filter"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              )}
            </div>
            <h3 className="flex-1 text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
              Messages for {viewingMessagesFor}
            </h3>
            <button
              onClick={closeViewMessagesModal}
              aria-label="Close messages modal"
              className="ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col space-y-2 overflow-y-auto max-h-[calc(85vh-100px)] px-1">
            {(() => {
              // Filter messagesHistory by dateFrom/dateTo if set
              let filtered = messagesHistory;
              if (dateFrom) {
                // dateFrom is yyyy-mm-dd, convert to start of day
                const fromDate = new Date(dateFrom + "T00:00:00");
                filtered = filtered.filter(m => new Date(m.timestamp) >= fromDate);
              }
              if (dateTo) {
                // dateTo is yyyy-mm-dd, convert to end of day
                const toDate = new Date(dateTo + "T23:59:59.999");
                filtered = filtered.filter(m => new Date(m.timestamp) <= toDate);
              }
              if (filtered.length === 0) {
                return (
                  <div className="text-center text-gray-500 dark:text-gray-400 italic">
                    No messages found.
                  </div>
                );
              }
              return filtered.map((msg) => {
                // Determine sender type and bubble styles
                let isBot = msg.type && (msg.type.toLowerCase().includes("bot") || msg.type.toLowerCase().includes("assistant"));
                let isUser = msg.type && (
                  msg.type.toLowerCase().includes("user") ||
                  msg.type.toLowerCase().includes("admin") ||
                  msg.type.toLowerCase().includes("owner") ||
                  msg.type.toLowerCase().includes("agent") ||
                  msg.type === "Farhan Khan"
                );
                let isCustomer = !isBot && !isUser;
                let align = isCustomer ? "items-start" : "items-end";
                let bubbleColor =
                  isBot
                    ? "bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-200"
                    : isUser
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100";

                return (
                  <div
                    key={msg.id}
                    className={`flex ${align} w-full`}
                  >
                    <div
                      className={`
                        max-w-[85%] px-4 py-2 rounded-2xl shadow
                        ${bubbleColor}
                        ${isCustomer ? "rounded-bl-none" : "rounded-br-none"}
                        text-sm break-words
                      `}
                      style={{
                        alignSelf: isCustomer ? "flex-start" : "flex-end",
                        marginLeft: isCustomer ? 0 : "auto",
                        marginRight: isCustomer ? "auto" : 0,
                      }}
                    >
                      {/* If there is an image */}
                      {msg.media_url && (msg.media_url.endsWith('.jpg') || msg.media_url.endsWith('.jpeg') || msg.media_url.endsWith('.png') || msg.media_url.endsWith('.gif')) && (
                        <img src={msg.media_url} alt="media" className="max-w-[240px] mb-2 rounded-lg border border-gray-200 dark:border-gray-700" />
                      )}
                      {/* If there is an audio file */}
                      {msg.media_url && (msg.media_url.endsWith('.ogg') || msg.media_url.endsWith('.mp3') || msg.media_url.endsWith('.wav')) && (
                        <CustomAudioPlayer key={msg.id} src={msg.media_url} bubbleColor={bubbleColor} isRight={!isCustomer} />
                      )}
                      {/* Main text content */}
                      {msg.content && (
                        <span style={{ whiteSpace: "pre-line" }}>{msg.content}</span>
                      )}
                      {/* If no content, but media was shown above */}
                      {!msg.content && !msg.media_url && (
                        <span className="italic text-gray-500 dark:text-gray-400">No text</span>
                      )}
                      <div className={`text-[11px] mt-2 ${isCustomer ? "text-left" : "text-right"} text-gray-400`}>
                        {new Date(msg.timestamp).toLocaleString([], { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    )}
    </>
  );
}