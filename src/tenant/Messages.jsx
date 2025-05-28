import React, { useState, useEffect, useRef } from "react";
// Detect mobile/tablet/TV vs desktop (improved)
function detectMobileUI() {
  const ua = navigator.userAgent;
  // Modern iPads sometimes use a desktop user agent, so also check for iPad via platform or maxTouchPoints
  const isIPad = (
    /iPad/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
  const isTablet = (
    isIPad ||
    (/Android/i.test(ua) && !/Mobile/i.test(ua)) ||
    /Tablet|PlayBook|Silk/i.test(ua)
  );
  const isMobile = (
    /Mobi|Android|iPhone|BlackBerry|Opera Mini|IEMobile/i.test(ua)
  );
  const isTV = /SmartTV|AppleTV|GoogleTV|Roku|Xbox|PlayStation/i.test(ua);

  // For your UI logic, treat iPad/tablet/mobile/TV as "mobile"
  if (isTablet || isMobile || isTV) return true;

  // Fallback: treat small screens as mobile UI
  if (window.innerWidth <= 1100) return true;

  return false;
}
import { ArrowsUpDownIcon, MicrophoneIcon, PaperClipIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import varibotixLogo from "../assets/varibotix-logo.jpg";
import { MagnifyingGlassIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
// Inject Google Fonts Material Icons if not already present
function useMaterialIconsFont() {
  useEffect(() => {
    if (!document.getElementById('material-icons-font')) {
      const link = document.createElement('link');
      link.id = 'material-icons-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
      document.head.appendChild(link);
    }
  }, []);
}
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Transition, Dialog } from '@headlessui/react';
import { Fragment } from 'react';
import { FiFileText, FiFile, FiFilePlus } from 'react-icons/fi';
import { supabase } from "../components/supabaseClient";
import defaultAvatar from "../assets/default-avatar.png";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { lang } from "../lang";

// Utility for showing back button in chat header
const getShowBackButton = (isMobileUI, mobileView, windowWidth, selectedNumber) => {
  // Show back button if:
  // - On mobile (chat view, number selected)
  // - On tablet/desktop where sidebar isn't visible (width < 1100, number selected)
  return (
    (!!selectedNumber) && (
      (isMobileUI && mobileView === "chat") ||
      (!isMobileUI && windowWidth < 1100)
    )
  );
};

export default function Messages() {
  // Global style override for font and background
  useEffect(() => {
    document.body.style.fontFamily = "'Inter', 'Roboto', 'Open Sans', sans-serif";
    document.body.style.backgroundColor = "#f7f8fa";
    return () => {
      document.body.style.fontFamily = "";
      document.body.style.backgroundColor = "";
    };
  }, []);
  // Material Icons font
  useMaterialIconsFont();
  const [workflow, setWorkflow] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [leftSearchTerm, setLeftSearchTerm] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  // Mobile view state: "list" or "chat"
  const [mobileView, setMobileView] = useState("list");

  // left pane sort state and ref
  const [leftShowSortMenu, setLeftShowSortMenu] = useState(false);
  const leftSortRef = useRef(null);
  // left pane sort configuration
  const [leftSortConfig, setLeftSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  // sort toggle and configuration for chat history
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const sortContainerRef = useRef(null);
  // click-outside for left sort menu only
  useEffect(() => {
    function handleClickOutside(event) {
      if (leftShowSortMenu && leftSortRef.current && !leftSortRef.current.contains(event.target)) {
        setLeftShowSortMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [leftShowSortMenu]);
  // click-outside for chat sort menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (showSortMenu && sortContainerRef.current && !sortContainerRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSortMenu]);

  const [isMobileUI, setIsMobileUI] = useState(detectMobileUI());
  // Track window width for responsive back button
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  // Sidebar show/hide state based on window width
  // For desktop/web, sidebar is always visible. Only used for mobile/tablet.
  const [showSidebar, setShowSidebar] = useState(true);
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    function onResize() {
      // Always treat tablets as mobile UI, regardless of window size
      const isMobileOrTablet = detectMobileUI();
      setIsMobileUI(isMobileOrTablet);
      // If no longer on mobile/tablet, reset to list view
      if (!isMobileOrTablet) setMobileView("list");
    }
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  // Parse 'number' from query string and set selectedNumber
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const num = params.get('number');
    if (num) {
      setSelectedNumber(num);
    }
  }, [location.search]);

  // for swipe gesture on mobile
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

  // auto-scroll to bottom when chatHistory updates
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Image preview modal state
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  // for message input and file attachments
  const [newMessage, setNewMessage] = useState("");
  const fileInputRef = useRef(null);
  // Attachment preview/caption state
  const [pendingMedia, setPendingMedia] = useState(null);
  const [pendingMediaPreview, setPendingMediaPreview] = useState(null);
  // voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  // scroll-to-bottom arrow state
  const [showScrollDown, setShowScrollDown] = useState(false);

  // Sending state to prevent duplicate sends
  const [isSending, setIsSending] = useState(false);

  // Portal tenant name from profiles table
  const [portalUserName, setPortalUserName] = useState("");

  // Show back button in chat header (mobile/tablet/small desktop)
  // On desktop/web, never show back button (sidebar is always visible).
  const showBackButton = (!!selectedNumber) && (
    (isMobileUI && mobileView === "chat")
  );
  useEffect(() => {
    if (!workflow) return;
    supabase
      .from("profiles")
      .select("customer_name")
      .eq("workflow_name", workflow)
      .single()
      .then(({ data, error }) => {
        if (data?.customer_name) setPortalUserName(data.customer_name);
        else setPortalUserName("");
      });
  }, [workflow]);
  // handler for scroll-to-bottom arrow
  const handleChatScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 50);
  };
  // send text message or file/caption
  const sendMessage = async () => {
    if (isSending || (!newMessage.trim() && !pendingMedia)) return;
    setIsSending(true);
    // Ensure selectedNumber and workflow are always present
    if (!selectedNumber || !workflow) {
      alert("Select a customer and ensure workflow is loaded.");
      setIsSending(false);
      return;
    }
    const customer = customers.find(c => c.number === selectedNumber);
    const contactName = customer?.contact_name || selectedNumber || "Unknown";
    let media_url = null;
    let fileType = null;

    // Handle file upload if present
    if (pendingMedia) {
      const ext = pendingMedia.name.split('.').pop();
      const fileName = `${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase
        .storage.from("attachments")
        .upload(fileName, pendingMedia);
      if (uploadError) {
        console.error("Upload error:", uploadError, { fileName, file: pendingMedia });
        alert("Upload failed: " + uploadError.message);
        setIsSending(false);
        return;
      }
      const { data: urlData } = supabase
        .storage.from("attachments")
        .getPublicUrl(fileName);
      media_url = urlData.publicUrl;
      if (pendingMedia.type.startsWith("image/")) fileType = "image";
      else if (pendingMedia.type.startsWith("audio/")) fileType = "audio";
      else if (pendingMedia.type === "application/pdf") fileType = "pdf";
      else fileType = "file";
    }

    // Build the message object
    const newMsg = {
      timestamp: new Date().toISOString(),
      number: selectedNumber,
      content: newMessage.trim() || "", // always string
      type: fileType || portalUserName,
      contact_name: contactName,
      workflow_name: workflow,
      media_url: media_url || null,
    };

    // Insert to Supabase
    const { error, data } = await supabase.from("messages").insert([newMsg]).select();
    if (error) {
      alert("Failed to send: " + error.message);
      console.error("Supabase insert error:", error);
      setIsSending(false);
      return;
    }
    setNewMessage("");
    setPendingMedia(null);
    setPendingMediaPreview(null);
    setIsSending(false);
  };

  // handle file attachment, show preview but don't upload yet
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingMedia(file);
    setPendingMediaPreview(URL.createObjectURL(file));
    // Don't upload or send yet!
  };

  // Start recording (prefer .mp3 if supported, else fallback)
  const startRecording = async () => {
    if (!navigator.mediaDevices) {
      alert("Audio recording is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mp3Mime = 'audio/mpeg';
      const mimeType = MediaRecorder.isTypeSupported(mp3Mime) ? mp3Mime : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        recorder.stream.getTracks().forEach(track => track.stop());
        if (!chunks.length) return;
        setIsRecording(false);
        clearInterval(intervalId);
        setRecordingDuration(0);
        const type = recorder.mimeType;
        let ext = 'mp3';
        const blob = new Blob(chunks, { type });
        if (blob.size < 100) {
          alert("Recording failed or too short.");
          return;
        }

        setIsSending(true);
        const fileName = `attachments/audio_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase
          .storage.from("attachments")
          .upload(fileName, blob);
        if (uploadError) {
          alert("Upload failed: " + uploadError.message);
          setIsSending(false);
          return;
        }

        const { data: urlData } = supabase
          .storage.from("attachments")
          .getPublicUrl(fileName);

        const customer = customers.find(c => c.number === selectedNumber);
        const contactName = customer?.contact_name || selectedNumber || "Unknown";
        await supabase.from("messages").insert([{
          timestamp: new Date().toISOString(),
          number: selectedNumber,
          content: "",
          type: "audio",
          contact_name: contactName,
          workflow_name: workflow,
          media_url: urlData.publicUrl,
        }]);
        setIsSending(false);
      };

      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
      // Correct timer: avoid stale recordingStartTime, use local start variable
      const start = Date.now();
      setRecordingStartTime(start);
      setRecordingDuration(0);
      setIntervalId(setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - start) / 1000));
      }, 1000));
      recorder.start();
      // Removed the 30-second auto-stop setTimeout.
    } catch (err) {
      alert("Microphone error: " + err.message);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      clearInterval(intervalId);
    }
  };

  const exportCSV = () => {
    const rows = chatHistory
      .filter(m => !selectedDate || m.timestamp.slice(0,10) === selectedDate)
      .map(m => ({ Timestamp: m.timestamp, Sender: m.type, Content: m.content }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Chat');
    XLSX.writeFile(wb, `chat_${selectedNumber || 'all'}.xlsx`);
  };
  const exportCSVfile = () => {
    const rows = chatHistory
      .filter(m => !selectedDate || m.timestamp.slice(0,10) === selectedDate)
      .map(m => ({ Timestamp: m.timestamp, Sender: m.type, Content: m.content }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `chat_${selectedNumber || 'all'}.csv`;
    link.click();
  };
  const exportPDF = () => {
    const doc = new jsPDF();
    const rows = chatHistory
      .filter(m => !selectedDate || m.timestamp.slice(0,10) === selectedDate)
      .map(m => [new Date(m.timestamp).toLocaleString(), m.type, m.content]);
    autoTable(doc, {
      head: [['Timestamp', 'Sender', 'Content']],
      body: rows,
      startY: 10,
    });
    doc.save(`chat_${selectedNumber || 'all'}.pdf`);
  };

  const leftPaneRef = useRef();
  const rightPaneRef = useRef();

  // fetch workflow_name on mount
  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) return;
    supabase
      .from("profiles")
      .select("workflow_name")
      .eq("email", email)
      .single()
      .then(({ data }) => {
        if (data?.workflow_name) {
          setWorkflow(data.workflow_name.trim());
        }
      });
  }, []);

  // fetch list of unique customer numbers (only with messages in last 24 hours)
  useEffect(() => {
    if (!workflow) return;
    supabase
      .from("messages")
      .select("number, content, contact_name, timestamp")
      .eq("workflow_name", workflow)
      .order("timestamp", { ascending: false })
      .then(({ data }) => {
        // group by number, pick latest content & contact_name, only for messages in last 24h
        const map = {};
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        data.forEach((m) => {
          if (new Date(m.timestamp) < twentyFourHoursAgo) return;
          if (!map[m.number]) {
            map[m.number] = {
              number: m.number,
              contact_name: m.contact_name,
              preview: m.content,
              timestamp: m.timestamp,
            };
          }
        });
        setCustomers(Object.values(map));
      });
  }, [workflow]);

  // fetch messages for selected customer
  useEffect(() => {
    if (!workflow || !selectedNumber) return;
    supabase
      .from("messages")
      .select("*")
      .eq("workflow_name", workflow)
      .eq("number", selectedNumber)
      .order("timestamp", { ascending: true })
      .then(({ data }) => setChatHistory(data));
  }, [workflow, selectedNumber]);

  // subscribe to new messages for this workflow and update customer list and chat history in real time
  useEffect(() => {
    if (!workflow) return;
    // Subscribe to all new messages for this workflow
    const channel = supabase
      .channel(`messages_${workflow}_all`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `workflow_name=eq.${workflow}`,
        },
        (payload) => {
          const m = payload.new;
          // Update chat history if selected
          if (m.number === selectedNumber) {
            setChatHistory((prev) => [...prev, m]);
          }
          // Always update customers list (recent chats)
          setCustomers((prev) => {
            // Only update if within last 24h
            const now = new Date();
            const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            if (new Date(m.timestamp) < twentyFourHoursAgo) return prev;
            let updated = prev.slice();
            const idx = updated.findIndex(c => c.number === m.number);
            if (idx > -1) {
              // update preview/timestamp/contact_name
              updated[idx] = {
                ...updated[idx],
                preview: m.content,
                timestamp: m.timestamp,
                contact_name: m.contact_name,
              };
            } else {
              // add new customer
              updated.push({
                number: m.number,
                contact_name: m.contact_name,
                preview: m.content,
                timestamp: m.timestamp,
              });
            }
            // Remove any chats older than 24h
            return updated.filter(
              c => new Date(c.timestamp) > twentyFourHoursAgo
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workflow, selectedNumber]);

  // apply left-pane search filter and sort
  const filteredCustomers = customers
    .filter(c => {
      const term = leftSearchTerm.toLowerCase();
      return c.number.toLowerCase().includes(term)
        || (c.contact_name || "").toLowerCase().includes(term)
        || (c.preview || "").toLowerCase().includes(term);
    })
    .sort((a, b) => {
      const { key, direction } = leftSortConfig;
      let aVal = a[key];
      let bVal = b[key];
      if (key === 'timestamp') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else {
        // string comparison
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });

  // Chat list pane JSX (responsive version)
  const chatListPane = (
    <div
      ref={leftPaneRef}
      className={`
        absolute inset-0 z-20 bg-white/70 backdrop-blur-lg overflow-y-auto overflow-x-hidden p-0 box-border
        ${isMobileUI ? 'w-full max-w-full min-h-screen flex flex-col' : 'sm:relative sm:inset-auto sm:z-auto sm:block sm:w-80'}
        rounded-xl shadow-sm
      `}
      style={isMobileUI ? { minHeight: "100vh" } : {}}
    >
      {/* Removed logo from chat list pane */}
      <div className="sticky top-0 z-10 bg-white/70 backdrop-blur-lg pt-2 pb-1 px-1 shadow-sm rounded-t-xl">
        <div className="flex items-start space-x-2 px-2 mb-1">
          {/* Back button: show only on small screens (<=767px width) and only if in chat view */}
          {isMobileUI && mobileView === "chat" && (
            <button
              onClick={() => setMobileView("list")}
              className="p-2 focus:outline-none"
              aria-label={lang("back")}
              title={lang("back")}
            >
              <span className="material-icons text-[#7a859e]">arrow_back</span>
            </button>
          )}
          {/* On mobile, in list view, show back to dashboard button */}
          {isMobileUI && mobileView === "list" && (
            <button
              onClick={() => navigate('/tenant/dashboard')}
              className="p-2 focus:outline-none"
              aria-label={lang("backToDashboard")}
              title={lang("backToDashboard")}
            >
              <span className="material-icons text-[#7a859e]">arrow_back</span>
            </button>
          )}
          <div className="flex-1">
            <span className="block font-medium text-base text-[#2a3444] truncate">{lang("recentChats")}</span>
            <p className="mt-1 text-[13px] md:text-[14px] text-[#7a859e]">{lang("showingLast24Hours")}</p>
          </div>
        </div>
        <div ref={leftSortRef} className="flex items-center space-x-2 px-2 relative">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={lang("searchPlaceholder")}
              value={leftSearchTerm}
              onChange={e => setLeftSearchTerm(e.target.value)}
              className="w-full pr-8 px-3 py-2 rounded-xl shadow-sm focus:ring-2 focus:ring-primary text-[15px] bg-[#eaf0f6] border-none text-[#2a3444]"
              aria-label={lang("searchPlaceholder")}
              style={{ fontFamily: "'Inter', 'Roboto', 'Open Sans', sans-serif" }}
            />
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <span className="material-icons text-[#7a859e] text-[22px]">search</span>
            </span>
            {leftSearchTerm && (
              <button
                onClick={() => setLeftSearchTerm("")}
                className="absolute right-8 top-1/2 transform -translate-y-1/2 text-red-600 font-bold"
                aria-label={lang("clearSearch")}
                title={lang("clearSearch")}
                type="button"
              >×</button>
            )}
          </div>
          <button
            onClick={() => setLeftShowSortMenu(!leftShowSortMenu)}
            className="p-2 bg-white rounded-xl focus:outline-none"
            aria-label={lang("sortChats")}
            title={lang("sortChats")}
          >
            <span className="material-icons text-[#7a859e] text-[22px]">sort</span>
          </button>
          {leftShowSortMenu && (
            <div className="absolute mt-10 right-2 bg-white border rounded shadow p-2 z-40 w-40">
              {['contact_name','preview','timestamp'].map(key => (
                <button
                  key={key}
                  onClick={() => {
                    const newDirection = leftSortConfig.key === key && leftSortConfig.direction === 'asc' ? 'desc' : 'asc';
                    setLeftSortConfig({ key, direction: newDirection });
                    setLeftShowSortMenu(false);
                  }}
                  className="flex justify-between w-full px-2 py-1 text-xs text-[#2a3444] hover:bg-[#eaf0f6] rounded"
                >
                  <span>
                    {key === 'contact_name'
                      ? lang("customerDetails")
                      : key === 'preview'
                        ? lang("searchPlaceholder")
                        : lang("showingLast24Hours")}
                  </span>
                  {leftSortConfig.key === key && (
                    <span className="ml-1">{leftSortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="pt-1 pb-2">
      {filteredCustomers.map((c) => (
        <div
          key={c.number}
          onClick={() => {
            setSelectedNumber(c.number);
            if (isMobileUI) setMobileView("chat");
          }}
          className={`${c.number === selectedNumber
            ? 'bg-[#eaf0f6] shadow border border-[#eaf0f6]'
            : 'bg-white shadow-sm border border-transparent'
          } flex justify-between items-center px-3 py-3 my-1 rounded-xl cursor-pointer transition duration-150 hover:bg-[#f7f8fa] hover:border-[#eaf0f6]`}
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <img
              src={defaultAvatar}
              alt="avatar"
              className="w-10 h-10 rounded-full flex-shrink-0 object-cover ring-2 ring-[#eaf0f6]"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-base text-[#2a3444] truncate">{c.contact_name || c.number}</div>
              <div className="text-sm text-[#7a859e] truncate">{c.preview}</div>
            </div>
          </div>
          <div className="text-xs text-[#7a859e] ml-2 flex-shrink-0">
            {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ))}
      {filteredCustomers.length === 0 && (
        <div className="p-6 text-center text-[#7a859e] flex flex-col items-center">
          <span className="material-icons text-[48px] mb-2 text-[#eaf0f6]">chat_bubble_outline</span>
          <span className="font-medium text-base text-[#2a3444] truncate">{lang("noMessages")}</span>
        </div>
      )}
      </div>
    </div>
  );

  // Chat conversation pane JSX
  const chatConversationPane = (
    <div
      ref={rightPaneRef}
      onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
      onTouchEnd={e => {
        setTouchEndX(e.changedTouches[0].clientX);
        if (isMobileUI && e.changedTouches[0].clientX - touchStartX > 100) {
          setMobileView("list");
        }
      }}
      className="absolute inset-0 z-10 bg-white dark:bg-gray-800 flex flex-col h-full overflow-hidden p-0 box-border sm:relative sm:inset-auto sm:z-auto sm:flex-1"
    >
      {/* Desktop/web blurred logo background */}
      {!isMobileUI && (
        <div className="absolute inset-0 pointer-events-none select-none flex justify-center items-center z-0">
          <img
            src={varibotixLogo}
            alt="Background Logo"
            className="w-96 h-96 object-contain"
            style={{ filter: "blur(24px)", opacity: 0.03 }}
          />
        </div>
      )}
      {selectedNumber ? (
        // Mobile: keep as before. Desktop: wrap header/messages/input for sticky input
        isMobileUI ? (
          <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
            {/* Chat header for mobile: minimal, no logo, no extra spacing */}
            <div className="flex-shrink-0 flex items-center justify-between p-2 bg-white rounded-xl shadow-sm relative">
              <div className="flex items-center space-x-2 min-w-0">
                {showBackButton && (
                  <button
                    onClick={() => {
                      if (isMobileUI) setMobileView("list");
                      else navigate('/tenant/dashboard');
                    }}
                    className="p-2 focus:outline-none"
                    aria-label={lang("back")}
                    title={lang("back")}
                    style={{ marginRight: 8 }}
                  >
                    <span className="material-icons text-[#7a859e]">arrow_back</span>
                  </button>
                )}
                <button onClick={() => setIsCustomerModalOpen(true)} className="focus:outline-none flex-shrink-0">
                  <img
                    src={defaultAvatar}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-[#eaf0f6]"
                  />
                </button>
                <h2 className="flex-1 font-medium text-base md:text-lg text-[#2a3444] truncate">
                  {customers.find(c => c.number === selectedNumber)?.contact_name || selectedNumber}
                </h2>
              </div>
              <div className="flex-none flex items-center space-x-2">
                {!searchOpen ? (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-2 hover:bg-[#eaf0f6] rounded-xl"
                    aria-label={lang("searchChat")}
                    title={lang("searchChat")}
                  >
                    <span className="material-icons text-[#7a859e]">search</span>
                  </button>
                ) : (
                  <div ref={sortContainerRef} className="relative flex items-center space-x-1 transition-all duration-200">
                    <input
                      type="text"
                      placeholder={lang("searchPlaceholder")}
                      autoFocus
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="flex-1 pr-2 py-1 rounded-xl border-none focus:ring-2 focus:ring-primary text-[15px] bg-[#eaf0f6] text-[#2a3444]"
                      aria-label={lang("searchPlaceholder")}
                      style={{ fontFamily: "'Inter', 'Roboto', 'Open Sans', sans-serif" }}
                    />
                    <button
                      onClick={() => { setSearchTerm(''); setSearchOpen(false); }}
                      className="p-1 text-red-600 font-bold text-lg focus:outline-none"
                      aria-label={lang("clearSearch")}
                      title={lang("clearSearch")}
                    >
                      ×
                    </button>
                    <button
                      onClick={() => setShowSortMenu(!showSortMenu)}
                      className="p-2 bg-white rounded-xl focus:outline-none ml-1"
                      aria-label={lang("sortMessages")}
                      title={lang("sortMessages")}
                      type="button"
                    >
                      <span className="material-icons text-[#7a859e]">sort</span>
                    </button>
                    {showSortMenu && (
                      <div className="absolute mt-10 right-0 bg-white border rounded shadow p-2 z-40 w-40">
                        {['timestamp','type','content'].map(key => (
                          <button
                            key={key}
                            onClick={() => {
                              const newDirection = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
                              setSortConfig({ key, direction: newDirection });
                              setShowSortMenu(false);
                            }}
                            className="flex justify-between w-full px-2 py-1 text-xs text-[#2a3444] hover:bg-[#eaf0f6] rounded"
                          >
                            <span>
                              {key === 'timestamp'
                                ? lang("showingLast24Hours")
                                : key === 'type'
                                  ? lang("customerDetails")
                                  : lang("typeMessagePlaceholder")}
                            </span>
                            {sortConfig.key === key && (
                              <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* Date filter toggle / date picker */}
                {!dateOpen ? (
                  <button
                    onClick={() => setDateOpen(true)}
                    className="p-2 hover:bg-[#eaf0f6] rounded-xl"
                    aria-label={lang("filterByDate")}
                    title={lang("filterByDate")}
                  >
                    <span className="material-icons text-[#7a859e]">event</span>
                  </button>
                ) : (
                  <div className="w-56 relative transition-all duration-200">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="w-full pr-8 p-1 rounded-xl border-none focus:ring-2 focus:ring-primary text-[15px] bg-[#eaf0f6] text-[#2a3444]"
                      aria-label={lang("chooseDate")}
                      style={{ fontFamily: "'Inter', 'Roboto', 'Open Sans', sans-serif" }}
                    />
                    <button
                      onClick={() => {
                        setSelectedDate("");
                        setDateOpen(false);
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 font-bold text-2xl leading-none focus:outline-none"
                      aria-label={lang("clearDateFilter")}
                      title={lang("clearDateFilter")}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                )}
                <Menu as="div" className="relative inline-block text-left ml-2">
                  <Menu.Button className="inline-flex justify-center items-center p-2 border-none rounded-xl bg-[#eaf0f6] shadow-sm hover:bg-[#f7f8fa] focus:outline-none focus:ring-2 focus:ring-primary">
                    <span className="material-icons text-[#7a859e]">download</span>
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-40 bg-white border rounded-xl shadow-lg focus:outline-none z-10">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={exportCSVfile}
                            className={`${active ? 'bg-[#eaf0f6]' : ''} group flex items-center px-4 py-2 text-sm w-full text-[#2a3444]`}
                            aria-label={lang("exportCSV")}
                            title={lang("exportCSV")}
                          >
                            <span className="material-icons mr-2 text-[#7a859e]">download</span> {lang("exportCSV")}
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={exportCSV}
                            className={`${active ? 'bg-[#eaf0f6]' : ''} group flex items-center px-4 py-2 text-sm w-full text-[#2a3444]`}
                            aria-label={lang("exportExcel")}
                            title={lang("exportExcel")}
                          >
                            <span className="material-icons mr-2 text-[#7a859e]">download</span> {lang("exportExcel")}
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={exportPDF}
                            className={`${active ? 'bg-[#eaf0f6]' : ''} group flex items-center px-4 py-2 text-sm w-full text-[#2a3444]`}
                            aria-label={lang("exportPDF")}
                            title={lang("exportPDF")}
                          >
                            <span className="material-icons mr-2 text-[#7a859e]">download</span> {lang("exportPDF")}
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
            <div
              ref={scrollRef}
              onScroll={handleChatScroll}
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-1 relative"
              style={{
                // Ensures scroll area ends exactly at top of input bar for mobile/iPad
                height: isMobileUI
                  ? `calc(100dvh - 56px - env(safe-area-inset-bottom))`
                  : undefined,
                maxHeight: isMobileUI
                  ? `calc(100dvh - 56px - env(safe-area-inset-bottom))`
                  : undefined,
                paddingBottom: isMobileUI
                  ? '0px'
                  : '0px'
              }}
            >
              {chatHistory
                .filter(m => {
                  const matchesText = (m.content || "").toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesDate = !selectedDate || m.timestamp.slice(0,10) === selectedDate;
                  return matchesText && matchesDate;
                })
                .sort((a, b) => {
                  if (sortConfig.key) {
                    let aVal = sortConfig.key === 'timestamp' ? new Date(a[sortConfig.key]) : (a[sortConfig.key] || '').toString().toLowerCase();
                    let bVal = sortConfig.key === 'timestamp' ? new Date(b[sortConfig.key]) : (b[sortConfig.key] || '').toString().toLowerCase();
                    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                  }
                  return new Date(a.timestamp) - new Date(b.timestamp);
                })
                .map((m, idx) => {
                  // Alignment: only type === "customer" is left; all others right
                  const isCustomer = m.type === "customer";
                  // Bubble color: customer = white (left), bot = green, all others = blue (right)
                  const bubbleClass = m.type === "customer"
                    ? "bg-white text-gray-900 dark:text-gray-100 rounded-tl-lg rounded-tr-lg rounded-br-lg"
                    : m.type === "bot"
                      ? "bg-[#d9fdd2] text-gray-900 rounded-tl-lg rounded-tr-lg rounded-bl-lg"
                      : "bg-blue-100 text-gray-900 rounded-tl-lg rounded-tr-lg rounded-bl-lg";
                  return (
                    <div
                      key={m.id}
                      className={`flex mb-2 ${isCustomer ? "justify-start" : "justify-end"} ${isMobileUI && idx === chatHistory.length - 1 ? 'mb-28' : ''}`}
                    >
                      <div
                        className={`max-w-[90%] px-3 py-1 shadow break-words whitespace-normal ${bubbleClass}`}
                      >
                        {/* MEDIA PREVIEW SECTION */}
                        {m.media_url && (
                          <>
                            {/* Image Preview */}
                            {m.media_url.match(/\.(jpeg|jpg|png|gif|bmp|webp)$/i) && (
                              <img
                                src={m.media_url}
                                alt="attachment"
                                className={`max-w-xs max-h-48 rounded mb-2 border cursor-pointer transition-transform hover:scale-105 ${isCustomer ? "" : "ml-auto"}`}
                                onClick={() => setImagePreviewUrl(m.media_url)}
                              />
                            )}
                            {/* Video Preview */}
                            {m.media_url.match(/\.(mp4|webm|ogg)$/i) && (
                              <video
                                src={m.media_url}
                                controls
                                className={`max-w-xs max-h-48 rounded mb-2 border ${isCustomer ? "" : "ml-auto"}`}
                              />
                            )}
                            {/* Audio Preview */}
                            {m.media_url.match(/\.(ogg|mp3|wav|aac|m4a)$/i) && !m.content && (
  <audio
    src={m.media_url}
    controls
    className="w-full rounded-md"
    style={{ height: "40px", minWidth: "320px", maxWidth: "720px" }}
  />
)}
                            {/* PDF Preview/Download */}
                            {m.media_url.match(/\.pdf$/i) && (
                              <a
                                href={m.media_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline mb-2 block"
                              >
                                📄 {lang("openPDF")}
                              </a>
                            )}
                          </>
                        )}
                        {/* Always show the message content, if any */}
                        {m.content && <p className="text-sm sm:text-base">{m.content}</p>}
                        <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5 text-right">
                          {new Date(m.timestamp).toLocaleString([], {
                            hour: "2-digit", minute: "2-digit", month: "short", day: "numeric"
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              {showScrollDown && (
                <button
                  onClick={() => {
                    const el = scrollRef.current;
                    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
                    setShowScrollDown(false);
                  }}
                  className="fixed inset-x-0 mx-auto bottom-28 z-30 flex justify-center w-fit bg-blue-500 text-white rounded-full shadow-lg p-3 opacity-90 hover:opacity-100 transition-all"
                  style={{ left: '50%', transform: 'translateX(-50%)' }}
                  title={lang("scrollToLatestMessage")}
                  aria-label={lang("scrollToBottom")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
            {/* Attachment preview area */}
            {pendingMediaPreview && (
              <div className="flex items-center space-x-2 mb-2 border p-2 rounded bg-gray-50 relative">
                {pendingMedia.type.startsWith("image/") ? (
                  <img src={pendingMediaPreview} alt={lang("imagePreview")} className="max-h-32 rounded" />
                ) : false ? (
                  <audio controls src={pendingMediaPreview} className="max-w-xs" />
                ) : pendingMedia.type === "application/pdf" ? (
                  <span className="text-sm sm:text-base text-gray-700">{lang("pdfReadyToSend")}: {pendingMedia.name}</span>
                ) : (
                  <span className="text-sm sm:text-base text-gray-700">{lang("fileReady")}: {pendingMedia.name}</span>
                )}
                <button
                  onClick={() => { setPendingMedia(null); setPendingMediaPreview(null); }}
                  className="ml-2 text-red-500 hover:text-red-700 font-bold"
                  aria-label={lang("removeFile")}
                  title={lang("removeFile")}
                >×</button>
              </div>
            )}
            <div
              className={`flex-shrink-0 ${
                isMobileUI
                  ? "fixed bottom-0 left-0 w-full z-40"
                  : "sticky bottom-0 left-0 w-full"
              }`}
              style={isMobileUI ? { paddingBottom: "env(safe-area-inset-bottom)", maxWidth: "100vw" } : {}}
            >
              <div className="bg-white/80 backdrop-blur-lg border-t border-[#eaf0f6] shadow-sm">
                <div className="px-2 py-2">
                  {!isRecording ? (
                    <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-[40px] shadow border border-[#d5dae1]">
                      <input
                        type="text"
                        placeholder={lang("typeMessagePlaceholder")}
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendMessage()}
                        className="flex-1 border-none bg-transparent focus:ring-0 outline-none text-base text-[#656e83] font-normal placeholder-[#656e83]"
                        style={{ fontFamily: "'Inter', 'Roboto', 'Open Sans', sans-serif" }}
                      />
                      <button
                        onClick={() => startRecording()}
                        aria-label={lang("startRecording")}
                        title={lang("startRecording")}
                        className="p-2 rounded-full bg-[#f4f6fa] hover:bg-[#eaf0f6] focus:outline-none flex items-center justify-center"
                        type="button"
                      >
                        <MicrophoneIcon className="h-6 w-6 text-[#7a859e]" />
                      </button>
                      <input
                        type="file"
                        accept="image/*,audio/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current.click()}
                        className="p-2 rounded-full bg-[#f4f6fa] hover:bg-[#eaf0f6] focus:outline-none flex items-center justify-center"
                        aria-label={lang("attachFile")}
                        title={lang("attachFile")}
                        type="button"
                      >
                        <PaperClipIcon className="h-6 w-6 text-[#7a859e]" />
                      </button>
                      <button
                        onClick={sendMessage}
                        disabled={isSending || (!newMessage.trim() && !pendingMedia)}
                        aria-label={lang("sendMessage")}
                        title={lang("sendMessage")}
                        className={`p-2 rounded-full flex items-center justify-center ${isSending ? 'bg-[#eaf0f6] cursor-not-allowed' : 'bg-[#2563eb] hover:bg-blue-600'} text-white focus:outline-none`}
                        type="button"
                      >
                        <PaperAirplaneIcon className="h-6 w-6" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 h-10 bg-blue-200 rounded-full animate-pulse" />
                      <button
                        onClick={stopRecording}
                        aria-label={lang("stopRecordingAndSend")}
                        title={lang("stopRecordingAndSend")}
                        className="p-2 bg-red-500 rounded-full shadow hover:bg-red-600 focus:outline-none text-white"
                      >
                        {/* Send SVG */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="white" viewBox="0 0 24 24">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Desktop layout: sticky footer input, scrollable messages
          <div className="flex flex-1 flex-col min-h-0 h-full overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-between mb-4 p-2 bg-white rounded-xl shadow-sm relative">
              {/* same header as above */}
              <div className="flex items-center space-x-2 min-w-0">
                {/* Show back button if sidebar/nav is missing (mobile or tablet landscape etc.) */}
                {showBackButton && (
                  <button
                    onClick={() => {
                      if (isMobileUI) setMobileView("list");
                      else navigate('/tenant/dashboard');
                    }}
                    className="p-2 focus:outline-none text-lg"
                    aria-label={lang("back")}
                    title={lang("back")}
                    style={{ marginRight: 8 }}
                  >
                    ←
                  </button>
                )}
                <button onClick={() => setIsCustomerModalOpen(true)} className="focus:outline-none flex-shrink-0">
                  <img
                    src={defaultAvatar}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-[#eaf0f6]"
                  />
                </button>
                <h2 className="flex-1 font-medium text-base md:text-lg text-[#2a3444] truncate">
                  {customers.find(c => c.number === selectedNumber)?.contact_name || selectedNumber}
                </h2>
              </div>
              <div className="flex-none flex items-center space-x-2">
                {!searchOpen ? (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-2 hover:bg-[#eaf0f6] rounded-xl"
                    aria-label={lang("searchChat")}
                    title={lang("searchChat")}
                  >
                    <span className="material-icons text-[#7a859e]">search</span>
                  </button>
                ) : (
                  <div ref={sortContainerRef} className="relative flex items-center space-x-1 transition-all duration-200">
                    <input
                      type="text"
                      placeholder={lang("searchPlaceholder")}
                      autoFocus
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="flex-1 pr-2 py-1 rounded-xl border-none focus:ring-2 focus:ring-primary text-[15px] bg-[#eaf0f6] text-[#2a3444]"
                      aria-label={lang("searchPlaceholder")}
                      style={{ fontFamily: "'Inter', 'Roboto', 'Open Sans', sans-serif" }}
                    />
                    <button
                      onClick={() => { setSearchTerm(''); setSearchOpen(false); }}
                      className="p-1 text-red-600 font-bold text-lg focus:outline-none"
                      aria-label={lang("clearSearch")}
                      title={lang("clearSearch")}
                    >
                      ×
                    </button>
                    <button
                      onClick={() => setShowSortMenu(!showSortMenu)}
                      className="p-2 bg-white rounded-xl focus:outline-none ml-1"
                      aria-label={lang("sortMessages")}
                      title={lang("sortMessages")}
                      type="button"
                    >
                      <span className="material-icons text-[#7a859e]">sort</span>
                    </button>
                    {showSortMenu && (
                      <div className="absolute mt-10 right-0 bg-white border rounded shadow p-2 z-40 w-40">
                        {['timestamp','type','content'].map(key => (
                          <button
                            key={key}
                            onClick={() => {
                              const newDirection = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
                              setSortConfig({ key, direction: newDirection });
                              setShowSortMenu(false);
                            }}
                            className="flex justify-between w-full px-2 py-1 text-xs text-[#2a3444] hover:bg-[#eaf0f6] rounded"
                          >
                            <span>
                              {key === 'timestamp'
                                ? lang("showingLast24Hours")
                                : key === 'type'
                                  ? lang("customerDetails")
                                  : lang("typeMessagePlaceholder")}
                            </span>
                            {sortConfig.key === key && (
                              <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* Date filter toggle / date picker */}
                {!dateOpen ? (
                  <button
                    onClick={() => setDateOpen(true)}
                    className="p-2 hover:bg-[#eaf0f6] rounded-xl"
                    aria-label={lang("filterByDate")}
                    title={lang("filterByDate")}
                  >
                    <span className="material-icons text-[#7a859e]">event</span>
                  </button>
                ) : (
                  <div className="w-56 relative transition-all duration-200">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="w-full pr-8 p-1 rounded-xl border-none focus:ring-2 focus:ring-primary text-[15px] bg-[#eaf0f6] text-[#2a3444]"
                      aria-label={lang("chooseDate")}
                      style={{ fontFamily: "'Inter', 'Roboto', 'Open Sans', sans-serif" }}
                    />
                    <button
                      onClick={() => {
                        setSelectedDate("");
                        setDateOpen(false);
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 font-bold text-2xl leading-none focus:outline-none"
                      aria-label={lang("clearDateFilter")}
                      title={lang("clearDateFilter")}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                )}
                <Menu as="div" className="relative inline-block text-left ml-2">
                  <Menu.Button className="inline-flex justify-center items-center p-2 border-none rounded-xl bg-[#eaf0f6] shadow-sm hover:bg-[#f7f8fa] focus:outline-none focus:ring-2 focus:ring-primary">
                    <span className="material-icons text-[#7a859e]">download</span>
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-40 bg-white border rounded-xl shadow-lg focus:outline-none z-10">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={exportCSVfile}
                            className={`${active ? 'bg-[#eaf0f6]' : ''} group flex items-center px-4 py-2 text-sm w-full text-[#2a3444]`}
                            aria-label={lang("exportCSV")}
                            title={lang("exportCSV")}
                          >
                            <span className="material-icons mr-2 text-[#7a859e]">download</span> {lang("exportCSV")}
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={exportCSV}
                            className={`${active ? 'bg-[#eaf0f6]' : ''} group flex items-center px-4 py-2 text-sm w-full text-[#2a3444]`}
                            aria-label={lang("exportExcel")}
                            title={lang("exportExcel")}
                          >
                            <span className="material-icons mr-2 text-[#7a859e]">download</span> {lang("exportExcel")}
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={exportPDF}
                            className={`${active ? 'bg-[#eaf0f6]' : ''} group flex items-center px-4 py-2 text-sm w-full text-[#2a3444]`}
                            aria-label={lang("exportPDF")}
                            title={lang("exportPDF")}
                          >
                            <span className="material-icons mr-2 text-[#7a859e]">download</span> {lang("exportPDF")}
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-1 relative" ref={scrollRef} onScroll={handleChatScroll}>
              {chatHistory
                .filter(m => {
                  const matchesText = (m.content || "").toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesDate = !selectedDate || m.timestamp.slice(0,10) === selectedDate;
                  return matchesText && matchesDate;
                })
                .sort((a, b) => {
                  if (sortConfig.key) {
                    let aVal = sortConfig.key === 'timestamp' ? new Date(a[sortConfig.key]) : (a[sortConfig.key] || '').toString().toLowerCase();
                    let bVal = sortConfig.key === 'timestamp' ? new Date(b[sortConfig.key]) : (b[sortConfig.key] || '').toString().toLowerCase();
                    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                  }
                  return new Date(a.timestamp) - new Date(b.timestamp);
                })
                .map((m, idx) => {
                  // Alignment: only type === "customer" is left; all others right
                  const isCustomer = m.type === "customer";
                  // Bubble color: customer = white (left), bot = green, all others = blue (right)
                  const bubbleClass = m.type === "customer"
                    ? "bg-white text-gray-900 dark:text-gray-100 rounded-tl-lg rounded-tr-lg rounded-br-lg"
                    : m.type === "bot"
                      ? "bg-[#d9fdd2] text-gray-900 rounded-tl-lg rounded-tr-lg rounded-bl-lg"
                      : "bg-blue-100 text-gray-900 rounded-tl-lg rounded-tr-lg rounded-bl-lg";
                  return (
                    <div
                      key={m.id}
                      className={`flex mb-2 ${isCustomer ? "justify-start" : "justify-end"} ${isMobileUI && idx === chatHistory.length - 1 ? 'mb-28' : ''}`}
                    >
                      <div
                        className={`max-w-[90%] px-3 py-1 shadow break-words whitespace-normal ${bubbleClass}`}
                      >
                        {/* MEDIA PREVIEW SECTION */}
                        {m.media_url && (
                          <>
                            {/* Image Preview */}
                            {m.media_url.match(/\.(jpeg|jpg|png|gif|bmp|webp)$/i) && (
                              <img
                                src={m.media_url}
                                alt="attachment"
                                className={`max-w-xs max-h-48 rounded mb-2 border cursor-pointer transition-transform hover:scale-105 ${isCustomer ? "" : "ml-auto"}`}
                                onClick={() => setImagePreviewUrl(m.media_url)}
                              />
                            )}
                            {/* Video Preview */}
                            {m.media_url.match(/\.(mp4|webm|ogg)$/i) && (
                              <video
                                src={m.media_url}
                                controls
                                className={`max-w-xs max-h-48 rounded mb-2 border ${isCustomer ? "" : "ml-auto"}`}
                              />
                            )}
                            {/* Audio Preview */}
                            {m.media_url.match(/\.(ogg|mp3|wav|aac|m4a)$/i) && !m.content && (
  <audio
    src={m.media_url}
    controls
    className="w-full rounded-md"
    style={{ height: "40px", minWidth: "320px", maxWidth: "720px" }}
  />
)}
                            {/* PDF Preview/Download */}
                            {m.media_url.match(/\.pdf$/i) && (
                              <a
                                href={m.media_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline mb-2 block"
                              >
                                📄 {lang("openPDF")}
                              </a>
                            )}
                          </>
                        )}
                        {/* Always show the message content, if any */}
                        {m.content && <p className="text-sm sm:text-base">{m.content}</p>}
                        <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5 text-right">
                          {new Date(m.timestamp).toLocaleString([], {
                            hour: "2-digit", minute: "2-digit", month: "short", day: "numeric"
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              {showScrollDown && (
                <button
                  onClick={() => {
                    const el = scrollRef.current;
                    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
                    setShowScrollDown(false);
                  }}
                  className="fixed inset-x-0 mx-auto bottom-28 z-30 flex justify-center w-fit bg-blue-500 text-white rounded-full shadow-lg p-3 opacity-90 hover:opacity-100 transition-all"
                  style={{ left: '50%', transform: 'translateX(-50%)' }}
                  title={lang("scrollToLatestMessage")}
                  aria-label={lang("scrollToBottom")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
            {pendingMediaPreview && (
              <div className="flex items-center space-x-2 mb-2 border p-2 rounded bg-gray-50 relative">
                {pendingMedia.type.startsWith("image/") ? (
                  <img src={pendingMediaPreview} alt={lang("imagePreview")} className="max-h-32 rounded" />
                ) : false ? (
                  <audio controls src={pendingMediaPreview} className="max-w-xs" />
                ) : pendingMedia.type === "application/pdf" ? (
                  <span className="text-sm sm:text-base text-gray-700">{lang("pdfReadyToSend")}: {pendingMedia.name}</span>
                ) : (
                  <span className="text-sm sm:text-base text-gray-700">{lang("fileReady")}: {pendingMedia.name}</span>
                )}
                <button
                  onClick={() => { setPendingMedia(null); setPendingMediaPreview(null); }}
                  className="ml-2 text-red-500 hover:text-red-700 font-bold"
                  aria-label={lang("removeFile")}
                  title={lang("removeFile")}
                >×</button>
              </div>
            )}
            <div
              className={`flex-shrink-0 ${
                isMobileUI
                  ? "fixed bottom-0 left-0 w-full z-40"
                  : "sticky bottom-0 left-0 w-full"
              }`}
              style={isMobileUI ? { paddingBottom: "env(safe-area-inset-bottom)", maxWidth: "100vw" } : {}}
            >
              <div className="bg-white/80 backdrop-blur-lg border-t border-[#eaf0f6] shadow-sm">
                <div className="px-2 py-2">
                  {!isRecording ? (
                    <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-[40px] shadow border border-[#d5dae1]">
                      <input
                        type="text"
                        placeholder={lang("typeMessagePlaceholder")}
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendMessage()}
                        className="flex-1 border-none bg-transparent focus:ring-0 outline-none text-base text-[#656e83] font-normal placeholder-[#656e83]"
                        style={{ fontFamily: "'Inter', 'Roboto', 'Open Sans', sans-serif" }}
                      />
                      <button
                        onClick={() => startRecording()}
                        aria-label={lang("startRecording")}
                        title={lang("startRecording")}
                        className="p-2 rounded-full bg-[#f4f6fa] hover:bg-[#eaf0f6] focus:outline-none flex items-center justify-center"
                        type="button"
                      >
                        <MicrophoneIcon className="h-6 w-6 text-[#7a859e]" />
                      </button>
                      <input
                        type="file"
                        accept="image/*,audio/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current.click()}
                        className="p-2 rounded-full bg-[#f4f6fa] hover:bg-[#eaf0f6] focus:outline-none flex items-center justify-center"
                        aria-label={lang("attachFile")}
                        title={lang("attachFile")}
                        type="button"
                      >
                        <PaperClipIcon className="h-6 w-6 text-[#7a859e]" />
                      </button>
                      <button
                        onClick={sendMessage}
                        disabled={isSending || (!newMessage.trim() && !pendingMedia)}
                        aria-label={lang("sendMessage")}
                        title={lang("sendMessage")}
                        className={`p-2 rounded-full flex items-center justify-center ${isSending ? 'bg-[#eaf0f6] cursor-not-allowed' : 'bg-[#2563eb] hover:bg-blue-600'} text-white focus:outline-none`}
                        type="button"
                      >
                        <PaperAirplaneIcon className="h-6 w-6" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 h-10 bg-blue-200 rounded-full animate-pulse" />
                      <button
                        onClick={stopRecording}
                        aria-label={lang("stopRecordingAndSend")}
                        title={lang("stopRecordingAndSend")}
                        className="p-2 bg-red-500 rounded-full shadow hover:bg-red-600 focus:outline-none text-white"
                      >
                        {/* Send SVG */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="white" viewBox="0 0 24 24">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
          {lang("selectCustomer")}
        </div>
      )}
    </div>
  );

  // Main return with conditional panes for mobile/desktop
  return (
    <>
      <div className="flex w-full h-screen min-h-0 overflow-hidden m-0 p-0" style={{ background: "#f7f8fa" }}>
        {isMobileUI ? (
          // For all mobile UI (including tablets/iPads), always single-pane view
          <div className="w-full">
            {mobileView === "list" && chatListPane}
            {mobileView === "chat" && chatConversationPane}
          </div>
        ) : (
          // Desktop/web: always show sidebar and chat panes side by side
          <>
            <div className="w-80 flex-shrink-0 h-full">{chatListPane}</div>
            <div className="flex-1 flex flex-col h-full">{chatConversationPane}</div>
          </>
        )}
      </div>
    {/* Image Preview Modal */}
    {imagePreviewUrl && (
      <Transition show={!!imagePreviewUrl} as={Fragment}>
        <Dialog
          onClose={() => setImagePreviewUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50 z-0" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="relative z-10 bg-white dark:bg-gray-900 rounded-lg shadow-xl p-4 max-w-lg w-full">
              <img src={imagePreviewUrl} alt="Preview" className="w-full max-h-[70vh] object-contain rounded"/>
              <button
                onClick={() => setImagePreviewUrl(null)}
                className="absolute top-2 right-2 text-gray-300 hover:text-white bg-black bg-opacity-50 rounded-full px-3 py-1 font-bold"
                aria-label={lang("closeImagePreview")}
                title={lang("closeImagePreview")}
              >×</button>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    )}
    {/* Customer Info Modal */}
    <Transition show={isCustomerModalOpen} as={Fragment}>
      <Dialog
        onClose={() => setIsCustomerModalOpen(false)}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30 z-0" />
        </Transition.Child>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
          leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
        >
          <Dialog.Panel className="relative z-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-xs w-full p-4">
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label={lang("closeModal")}
              title={lang("closeModal")}
            >
              ×
            </button>
            <Dialog.Title className="font-semibold text-lg md:text-2xl text-gray-800 dark:text-gray-100 mb-4">
  {lang("customerDetails")}
</Dialog.Title>
            <div className="flex flex-col items-center space-y-2">
              <img
                src={defaultAvatar}
                alt="Customer Avatar"
                className="w-20 h-20 rounded-full object-cover ring-2 ring-blue-300 dark:ring-blue-500"
              />
              <div className="text-center">
                <div className="font-semibold text-lg md:text-2xl text-gray-800 dark:text-gray-100">
                  {customers.find(c => c.number === selectedNumber)?.contact_name || selectedNumber}
                </div>
                <div className="text-xs md:text-sm text-gray-400 dark:text-gray-400">
                  {selectedNumber}
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
    </>
  );
}