// Utility: Get KSA time (+03:00) in ISO string format
function getKsaIsoString() {
  // Get KSA time (+03:00) in correct format
  const now = new Date();
  const iso = now.toLocaleString("sv-SE", { timeZone: "Asia/Riyadh" });
  const ms = now.getMilliseconds().toString().padStart(3, "0");
  return iso.replace(" ", "T") + "." + ms + "+03:00";
}
// Emits window "unreadCount" event with number of unread chats after every fetch or change. Listen in sidebar/navbar for notification badges.
import React, { useState, useEffect, useRef } from "react";

function PremiumVoiceNotePlayer({ src, waveformColor = "#868CFF", width = 190, height = 32 }) {
  const audioRef = useRef();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  function handlePlayPause() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }

  function handleTimeUpdate() {
    if (!audioRef.current) return;
    let d = audioRef.current.duration;
    let c = audioRef.current.currentTime;
    if (!isFinite(d) || isNaN(d)) d = 0;
    if (!isFinite(c) || isNaN(c)) c = 0;
    setCurrent(c);
    setDuration(d);
    setProgress(d ? c / d : 0);
  }
  function handleLoaded() {
    let d = audioRef.current?.duration;
    if (!isFinite(d) || isNaN(d)) d = 0;
    setDuration(d);
  }
  function handleEnded() {
    setPlaying(false);
    setProgress(1);
    setCurrent(duration);
  }
  function handleSeek(e) {
    if (!audioRef.current) return;
    const rect = e.target.getBoundingClientRect();
    const pct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    if (isFinite(audioRef.current.duration) && !isNaN(audioRef.current.duration)) {
      audioRef.current.currentTime = pct * audioRef.current.duration;
    }
  }

  // Fallback display
  const showDuration = isFinite(duration) && !isNaN(duration) && duration > 0;
  const showCurrent = isFinite(current) && !isNaN(current) && current > 0;

  return (
    <div className="flex items-center gap-2 select-none">
      <button
        onClick={handlePlayPause}
        className="text-[#868CFF] hover:text-[#6BC2A1] font-bold"
        aria-label={playing ? "Pause voice note" : "Play voice note"}
        type="button"
        style={{ outline: "none" }}
      >
        <span className="material-icons text-[28px]">
          {playing ? "pause" : "play_arrow"}
        </span>
      </button>
      {/* Waveform + progress overlay + seek */}
      <div
        className="relative flex items-center group cursor-pointer"
        style={{ width, height }}
        onClick={handleSeek}
      >
        {/* Waveform */}
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {Array.from({ length: 16 }).map((_, i) => {
            const x = i * (width / 16);
            const barW = width / 16 - 2;
            let animHeight = 16 + 3 * Math.abs(Math.sin(i + (playing ? Date.now() / 400 : 0)));
            let h = playing ? animHeight : 16;
            let y = (height - h) / 2;
            // Progress fill color if bar is left of progress
            const barProgress = (i + 1) / 16;
            const fill = progress >= barProgress ? "#6BC2A1" : waveformColor;
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={barW}
                rx={2}
                height={h}
                fill={fill}
                opacity={0.8}
                style={{
                  transition: "all .2s",
                  animation: playing
                    ? `waveform-bar 1.2s ease-in-out ${(i * 0.08)}s infinite`
                    : "none"
                }}
              />
            );
          })}
        </svg>
        {/* Progress marker (small line) */}
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: `${progress * 100}%`,
            width: 4,
            background: "linear-gradient(180deg, #6BC2A1, #868CFF)",
            borderRadius: 2,
            opacity: 0.95,
            height: height - 4,
            marginTop: 2,
            boxShadow: "0 0 6px #868CFF80",
            transition: "left 0.1s"
          }}
        />
      </div>
      {/* Duration */}
      <span className="text-xs text-[#868CFF] min-w-[46px] text-right" style={{fontVariantNumeric: "tabular-nums"}}>
        {formatTime(showCurrent ? current : 0)} / {formatTime(showDuration ? duration : 0)}
      </span>
      {/* The audio element */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoaded}
        onTimeUpdate={handleTimeUpdate}
        style={{ display: "none" }}
      />
      {/* Keyframes for bar animation */}
      <style>
        {`
        @keyframes waveform-bar {
          0% { height: 30%; y: 60%; opacity: .4; }
          20% { height: 100%; y: 0%; opacity: 1; }
          50% { height: 50%; y: 25%; opacity: .8; }
          100% { height: 30%; y: 60%; opacity: .4; }
        }
        `}
      </style>
    </div>
  );
}

function formatTime(s) {
  if (!s || isNaN(s) || !isFinite(s)) return "0:00";
  s = Math.floor(s);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

// MessageBubble component for new unread marker logic
function MessageBubble({ message, isMobileUI, isLast }) {
  const isCustomer = message.type === "customer";
  const bubbleClass = message.type === "customer"
    ? "bg-white text-gray-900 dark:text-gray-100 rounded-tl-lg rounded-tr-lg rounded-br-lg"
    : message.type === "bot"
      ? "bg-[#d9fdd2] text-gray-900 rounded-tl-lg rounded-tr-lg rounded-bl-lg"
      : "bg-blue-100 text-gray-900 rounded-tl-lg rounded-tr-lg rounded-bl-lg";
  return (
    <div
      className={`flex mb-2 ${isCustomer ? "justify-start" : "justify-end"} ${isMobileUI && isLast ? 'mb-28' : ''}`}
    >
      <div
        className={`max-w-[90%] px-3 py-1 shadow break-words whitespace-normal ${bubbleClass}`}
      >
        {message.media_url && (
          <>
            {message.media_url.match(/\.(jpeg|jpg|png|gif|bmp|webp)$/i) && (
              <img
                src={message.media_url}
                alt="attachment"
                className={`max-w-xs max-h-48 rounded mb-2 border cursor-pointer transition-transform hover:scale-105 ${isCustomer ? "" : "ml-auto"}`}
                onClick={() => window?.setImagePreviewUrl && window.setImagePreviewUrl(message.media_url)}
              />
            )}
            {message.media_url.match(/\.(mp4|webm|ogg)$/i) && (
              <video
                src={message.media_url}
                controls
                className={`max-w-xs max-h-48 rounded mb-2 border ${isCustomer ? "" : "ml-auto"}`}
              />
            )}
            {message.media_url.match(/\.(ogg|mp3|wav|aac|m4a)$/i) && !message.content && (
              <PremiumVoiceNotePlayer src={message.media_url} />
            )}
            {message.media_url.match(/\.pdf$/i) && (
              <a
                href={message.media_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline mb-2 block"
              >
                📄 Open PDF
              </a>
            )}
          </>
        )}
        {message.content && <p className="text-sm sm:text-base">{message.content}</p>}
        <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5 text-right">
          {new Date(message.timestamp).toLocaleString([], {
            hour: "2-digit", minute: "2-digit", month: "short", day: "numeric"
          })}
        </div>
      </div>
    </div>
  );
}
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
import ReactDOM from "react-dom";
function MarkAllModal({ onConfirm, onCancel }) {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#eef1fa]/70 backdrop-blur-[2.5px]">
      <div className="bg-[#f9fafe] border border-[#e6ecff] rounded-2xl shadow-2xl p-8 w-[95%] max-w-xs text-center animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 mb-2 rounded-full bg-gradient-to-br from-[#6BC2A1] to-[#868CFF] flex items-center justify-center shadow-lg">
            <span className="material-icons text-white text-3xl">mark_email_read</span>
          </div>
          <div className="text-xl font-bold mb-1" style={{ color: '#868CFF', letterSpacing: '0.01em' }}>
            Mark all as read?
          </div>
        </div>
        <p className="text-gray-700 mb-8 text-base">Are you sure you want to mark all unread messages as read?</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="bg-gradient-to-r from-[#6BC2A1] to-[#868CFF] text-white rounded-xl py-3 font-semibold text-base shadow hover:from-[#33B2A1] hover:to-[#6368FF] transition-all border-2 border-transparent hover:border-[#e6ecff]"
            style={{ letterSpacing: '0.01em' }}
          >
            Mark All as Read
          </button>
          <button
            onClick={onCancel}
            className="bg-[#EEF1FA] text-[#868CFF] rounded-xl py-3 font-semibold text-base shadow hover:bg-[#e6ecff] transition-all border border-[#e6ecff]"
            style={{ letterSpacing: '0.01em' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
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

// Animated waveform bars SVG for premium live feel (premium animated version)
function AnimatedWaveform({ barCount = 16, width = 190, height = 32, color = "#868CFF", playing = false }) {
  // Trigger re-render for animation
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const intv = setInterval(() => setTick(t => t + 1), 40); // 25 FPS
    return () => clearInterval(intv);
  }, [playing]);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {Array.from({ length: barCount }).map((_, i) => {
        // Subtle, premium waviness: not too tall
        const phase = Date.now() / 400 + i;
        const baseHeight = height * 0.55;
        const waveHeight = height * 0.17 * Math.abs(Math.sin(phase));
        const barH = baseHeight + (playing ? waveHeight : 0);
        const barY = (height - barH) / 2;
        return (
          <rect
            key={i}
            x={i * (width / barCount)}
            y={barY}
            width={width / barCount - 2}
            rx={2}
            height={barH}
            fill={color}
            opacity={0.8}
            style={{
              transition: "all .18s cubic-bezier(.65,0,.35,1)"
            }}
          />
        );
      })}
    </svg>
  );
}


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
  // Unified modal states for Sort, Filter, Mark All Read
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showMarkAll, setShowMarkAll] = useState(false);
  // Mark all as read function
  const markAllAsRead = async () => {
    if (!workflow) return;
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('workflow_name', workflow)
      .eq('read', false);

    if (error) {
      console.error('Error marking all as read:', error.message);
    } else {
      window.location.reload(); // or trigger state refresh
    }
  };
  // Show/hide "New messages" marker for unread
  const [showNewMessageMarker, setShowNewMessageMarker] = useState(true);
  const [customers, setCustomers] = useState([]);

  const [selectedNumber, setSelectedNumber] = useState(null);
  // Find current customer object for selectedNumber
  const currentCustomer = customers.find(c => c.number === selectedNumber);

  useEffect(() => {
    if (currentCustomer?.last_read_at) {
      const timeout = setTimeout(() => {
        setShowNewMessageMarker(false);
      }, 6000);
      return () => clearTimeout(timeout);
    }
  }, [currentCustomer]);
  // Chat history state must be declared before any useEffect or function that references it.
  const [chatHistory, setChatHistory] = useState([]);
  // Track if breaker has been seen for a chat's latest unread batch (per chat)
  // { [number]: boolean }
  const [breakerSeenForChat, setBreakerSeenForChat] = useState({});
  // Timeout refs for breaker fade/mark read (per chat)
  const breakerTimeoutRef = useRef({});
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
  // Real-time unread chats count for notification badge integration
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!chatHistory || chatHistory.length === 0 || !selectedNumber) return;
    const latestReadAt = chatHistory.reduce(
      (max, m) => m.last_read_at && new Date(m.last_read_at) > new Date(max) ? m.last_read_at : max,
      ""
    );
    const latestReadDate = latestReadAt ? new Date(latestReadAt) : new Date(0);
    const hasUnread = chatHistory.some(m => new Date(m.timestamp) > latestReadDate);
    // Reset breaker when new unread appear
    if (hasUnread && breakerSeenForChat[selectedNumber]) {
      setBreakerSeenForChat(prev => {
        const next = { ...prev };
        delete next[selectedNumber];
        return next;
      });
    }
    // If all messages read, make sure breaker is "seen"
    if (!hasUnread && !breakerSeenForChat[selectedNumber]) {
      setBreakerSeenForChat(prev => ({ ...prev, [selectedNumber]: true }));
    }
  }, [chatHistory, selectedNumber]);
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
  // filter menu ref for outside click
  const leftFilterRef = useRef(null);
  // left pane sort configuration
  const [leftSortConfig, setLeftSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  // sort toggle and configuration for chat history
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const sortContainerRef = useRef(null);

  // Unified outside click handler for all modals (sort/filter)
  useEffect(() => {
    function handleClickOutside(event) {
      // Left sort modal
      if (leftShowSortMenu && leftSortRef.current && !leftSortRef.current.contains(event.target)) {
        setLeftShowSortMenu(false);
      }
      // Left filter modal
      if (showFilter && leftFilterRef.current && !leftFilterRef.current.contains(event.target)) {
        setShowFilter(false);
      }
      // Chat sort modal
      if (showSortMenu && sortContainerRef.current && !sortContainerRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [leftShowSortMenu, showFilter, showSortMenu]);

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

  // Show/hide "New Messages" breaker with fade
  const [showNewMsgBreaker, setShowNewMsgBreaker] = useState(false);

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
    let newMsg;
    if (fileType === "image" || fileType === "audio") {
      newMsg = {
        timestamp: getKsaIsoString(),
        last_read_at: getKsaIsoString(),
        number: selectedNumber,
        content: newMessage.trim() || "", // always string
        type: fileType || portalUserName,
        contact_name: contactName,
        workflow_name: workflow,
        media_url: media_url || null,
      };
    } else {
      newMsg = {
        timestamp: new Date().toISOString(),
        number: selectedNumber,
        content: newMessage.trim() || "",
        type: fileType || portalUserName,
        contact_name: contactName,
        workflow_name: workflow,
        media_url: media_url || null,
      };
    }

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

  // Cancel recording and clean up state
  function cancelRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    }
    setIsRecording(false);
    setRecordingDuration(0);
    if (intervalId) clearInterval(intervalId);
    setIntervalId(null);
    setAudioChunks([]);
    setMediaRecorder(null);
    setRecordingStartTime(null);
  }

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
      let chunks = [];
  
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
  
      recorder.onstop = async () => {
        if (intervalId) clearInterval(intervalId);
        setIntervalId(null);
  
        // Save reference before cleanup!
        const chunksCopy = chunks.slice();
  
        setIsRecording(false);
        setRecordingDuration(0);
        setRecordingStartTime(null);
        setMediaRecorder(null);
  
        if (!chunksCopy.length) {
          setAudioChunks([]);
          return;
        }
        setIsSending(true);
  
        const type = recorder.mimeType;
        let ext = 'mp3';
        const blob = new Blob(chunksCopy, { type });
        if (blob.size < 100) {
          alert("Recording failed or too short.");
          setIsSending(false);
          setAudioChunks([]);
          return;
        }
  
        // Upload audio to Supabase
        const fileName = `attachments/audio_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase
          .storage.from("attachments")
          .upload(fileName, blob);
        if (uploadError) {
          alert("Upload failed: " + uploadError.message);
          setIsSending(false);
          setAudioChunks([]);
          return;
        }
  
        const { data: urlData } = supabase
          .storage.from("attachments")
          .getPublicUrl(fileName);
  
        // Insert message to Supabase
        const customer = customers.find(c => c.number === selectedNumber);
        const contactName = customer?.contact_name || selectedNumber || "Unknown";
        const ksaNow = getKsaIsoString();
        await supabase.from("messages").insert([{
          timestamp: ksaNow,
          last_read_at: ksaNow,
          number: selectedNumber,
          content: "",
          type: "audio",
          contact_name: contactName,
          workflow_name: workflow,
          media_url: urlData.publicUrl,
        }]);
        setIsSending(false);
        setAudioChunks([]);
      };
  
      setMediaRecorder(recorder);
      setAudioChunks([]); // Always clear before start!
      const start = Date.now();
      setRecordingStartTime(start);
      setRecordingDuration(0);
      const intv = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - start) / 1000));
      }, 1000);
      setIntervalId(intv);
  
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone error: " + err.message);
    }
  };

  // Stop recording and cleanup
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    }
    if (intervalId) clearInterval(intervalId);
    setIntervalId(null);
    setRecordingDuration(0);
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
      .select("number, content, contact_name, timestamp, last_read_at")
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
              last_read_at: m.last_read_at || null,
            };
          }
        });
        setCustomers(Object.values(map));
      });
  }, [workflow]);

  // Helper to mark all unread messages in the current chat as read (update last_read_at)
  // Also optimistically update customers state for immediate blue dot removal.
  const markChatAsRead = async (latestTimestamp, numberOverride) => {
    console.log("markChatAsRead called", { latestTimestamp, numberOverride, workflow });
    const number = numberOverride || selectedNumber;
    if (!workflow || !number || !latestTimestamp) return;
    await supabase
      .from("messages")
      .update({ last_read_at: latestTimestamp })
      .eq("workflow_name", workflow)
      .eq("number", number)
      .or('last_read_at.is.null,last_read_at.lt.' + latestTimestamp);
    // Optimistically update customers state for selected chat
    setCustomers((prev) =>
      prev.map((c) =>
        c.number === number
          ? { ...c, last_read_at: latestTimestamp }
          : c
      )
    );
  };

  // fetch messages for selected customer
  useEffect(() => {
    if (!workflow || !selectedNumber) return;
    supabase
      .from("messages")
      .select("*")
      .eq("workflow_name", workflow)
      .eq("number", selectedNumber)
      .order("timestamp", { ascending: true })
      .then(async ({ data }) => {
        setChatHistory(data);
        // (Do not mark as read immediately here; handled in effect below)
      });
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

  // Calculate and emit unread chats count after every customers update
  useEffect(() => {
    // A chat is unread if: no last_read_at or last message timestamp > last_read_at
    const count = customers.filter(
      c => !c.last_read_at || new Date(c.timestamp) > new Date(c.last_read_at)
    ).length;
    setUnreadCount(count);
    // Emit event on window for sidebar/navbar badge integration
    window.dispatchEvent(new CustomEvent('unreadCount', { detail: count }));
  }, [customers]);

  // Filter dropdown state for chat list pane
  const [filterOption, setFilterOption] = useState("All");
  // Unified handlers for opening modals
  const handleOpenSort = (e) => {
    e.stopPropagation();
    setShowSort(true);
    setShowFilter(false);
    setShowMarkAll(false);
  };
  const handleOpenFilter = (e) => {
    e.stopPropagation();
    setShowFilter(true);
    setShowSort(false);
    setShowMarkAll(false);
  };
  const handleOpenMarkAll = (e) => {
    e.stopPropagation();
    setShowMarkAll(true);
    setShowSort(false);
    setShowFilter(false);
  };

  // Effect to close all modals on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setShowFilter(false);
      setShowSort(false);
      setShowMarkAll(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // apply left-pane search filter
  const filteredCustomers = customers
    .filter(c => {
      const term = leftSearchTerm.toLowerCase();
      return c.number.toLowerCase().includes(term)
        || (c.contact_name || "").toLowerCase().includes(term)
        || (c.preview || "").toLowerCase().includes(term);
    });

  // Apply filterOption to filteredCustomers
  const filterChatsByOption = (list) => {
    if (filterOption === "Unread") {
      return list.filter(chat =>
        !chat.last_read_at || new Date(chat.timestamp) > new Date(chat.last_read_at)
      );
    }
    if (filterOption === "Read") {
      return list.filter(chat =>
        !!chat.last_read_at && new Date(chat.timestamp) <= new Date(chat.last_read_at)
      );
    }
    return list;
  };
  const filteredChats = filterChatsByOption(filteredCustomers);

  // New: sort chat items by lastMessageTimestamp descending (using timestamp as lastMessageTimestamp)
  const sortedChats = [...filteredChats].sort((a, b) => {
    if (leftSortConfig.key === 'unread') {
      // Unread first (unread = no last_read_at or last message newer than last_read_at)
      const aUnread = !a.last_read_at || new Date(a.timestamp) > new Date(a.last_read_at);
      const bUnread = !b.last_read_at || new Date(b.timestamp) > new Date(b.last_read_at);
      if (aUnread === bUnread) {
        // Secondary: most recent first
        return new Date(b.timestamp) - new Date(a.timestamp);
      }
      return aUnread ? -1 : 1;
    }
    if (leftSortConfig.key === 'timestamp') {
      return leftSortConfig.direction === 'asc'
        ? new Date(a.timestamp) - new Date(b.timestamp)
        : new Date(b.timestamp) - new Date(a.timestamp);
    }
    if (leftSortConfig.key === 'contact_name') {
      const cmp = (a.contact_name || a.number || '').localeCompare(b.contact_name || b.number || '');
      return leftSortConfig.direction === 'asc' ? cmp : -cmp;
    }
    // Fallback: most recent
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  // Chat list pane JSX (responsive version)
  const chatListPane = (
    <div
      ref={leftPaneRef}
      className={`
        absolute inset-0 z-20 bg-white/70 backdrop-blur-lg overflow-x-hidden p-0 box-border
        ${isMobileUI ? 'w-full max-w-full flex flex-col' : 'relative z-20 w-[390px] flex-shrink-0'}
        rounded-xl shadow-sm flex flex-col flex-grow h-full
      `}
      style={{ height: "100dvh" }}
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
        <div ref={leftSortRef} className="flex items-center gap-x-2 gap-2 px-2 mt-1">
          <div className="flex-1">
            <div className="relative w-full h-10">
              <input
                type="text"
                placeholder="Search"
                value={leftSearchTerm}
                onChange={e => setLeftSearchTerm(e.target.value)}
                className="w-full h-full pl-4 pr-10 bg-[#eaf0f6] rounded-xl text-base text-[#2a3444] outline-none border-none"
                aria-label="Search"
                style={{ fontFamily: "'Inter', 'Roboto', 'Open Sans', sans-serif" }}
              />
              {leftSearchTerm && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 font-bold text-xl focus:outline-none"
                  style={{ lineHeight: 1 }}
                  onClick={() => setLeftSearchTerm("")}
                  aria-label={lang("clearSearch")}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort button */}
            <div className="relative" ref={leftSortRef}>
              <button
                onClick={handleOpenSort}
                className="p-2 bg-white rounded-xl flex items-center justify-center focus:outline-none"
                aria-label="Sort"
                title="Sort chats by status, date, or name"
                type="button"
              >
                <span className="material-icons text-[#7a859e] text-[22px]">sort</span>
              </button>
              {showSort && (
                <div className="absolute right-0 mt-1 z-50 bg-white border rounded shadow text-sm w-44" onClick={e => e.stopPropagation()}>
                  <div className="px-3 py-2 font-semibold text-[#2a3444]">Sort by</div>
                  <div>
                    <div
                      className={`cursor-pointer px-3 py-2 hover:bg-gray-100 ${leftSortConfig.key === 'timestamp' ? 'font-semibold' : ''}`}
                      onClick={() => {
                        setLeftSortConfig((prev) => ({
                          key: 'timestamp',
                          direction: prev.key === 'timestamp' && prev.direction === 'desc' ? 'asc' : 'desc',
                        }));
                        setShowSort(false);
                      }}
                    >
                      {leftSortConfig.key === 'timestamp' ? (leftSortConfig.direction === 'asc' ? 'Oldest First' : 'Newest First') : 'Date'}
                      {leftSortConfig.key === 'timestamp' && (leftSortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                    </div>
                    <div
                      className={`cursor-pointer px-3 py-2 hover:bg-gray-100 ${leftSortConfig.key === 'contact_name' ? 'font-semibold' : ''}`}
                      onClick={() => {
                        setLeftSortConfig((prev) => ({
                          key: 'contact_name',
                          direction: prev.key === 'contact_name' && prev.direction === 'asc' ? 'desc' : 'asc',
                        }));
                        setShowSort(false);
                      }}
                    >
                      Name
                      {leftSortConfig.key === 'contact_name' && (leftSortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                    </div>
                    <div
                      className={`cursor-pointer px-3 py-2 hover:bg-gray-100 ${leftSortConfig.key === 'unread' ? 'font-semibold' : ''}`}
                      onClick={() => {
                        setLeftSortConfig({ key: 'unread', direction: 'desc' });
                        setShowSort(false);
                      }}
                    >
                      Unread First
                      {leftSortConfig.key === 'unread' && ' ✓'}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Filter button */}
            <div className="relative" ref={leftFilterRef}>
              <button
                onClick={handleOpenFilter}
                className="p-2 bg-white rounded-xl flex items-center justify-center focus:outline-none"
                aria-label="Filter"
                title="Filter chats by read/unread status"
                type="button"
              >
                <span className="material-icons">filter_list</span>
              </button>
              {showFilter && (
                <div className="absolute right-0 mt-1 z-50 bg-white border rounded shadow text-sm w-36" onClick={e => e.stopPropagation()}>
                  {["All", "Unread", "Read"].map((option) => (
                    <div
                      key={option}
                      onClick={() => {
                        setFilterOption(option);
                        setShowFilter(false);
                      }}
                      className={`cursor-pointer px-3 py-2 hover:bg-gray-100 ${
                        filterOption === option ? "font-semibold" : ""
                      }`}
                    >
                      {option} {filterOption === option && "✓"}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Mark All Read button */}
            {filterOption === "Unread" && (
              <button
                onClick={handleOpenMarkAll}
                className="p-2 bg-white rounded-xl flex items-center justify-center focus:outline-none text-red-600 animate-pulse hover:text-red-700 transition-all duration-150"
                aria-label="Mark All Read"
                title="Click to mark all unread chats as read"
                type="button"
                style={{ opacity: 0.90 }}
              >
                <span className="material-icons text-[22px]">done_all</span>
              </button>
            )}
            {/* Mark All Read Modal */}
            {showMarkAll && (
              <MarkAllModal
                onConfirm={async () => {
                  const nowIso = new Date().toISOString();
                  const unreadChats = sortedChats.filter(
                    chat =>
                      !chat.last_read_at ||
                      new Date(chat.timestamp) > new Date(chat.last_read_at)
                  );
                  await Promise.all(
                    unreadChats.map(chat =>
                      supabase
                        .from("messages")
                        .update({ last_read_at: nowIso })
                        .eq("number", chat.number)
                        .eq("workflow_name", workflow)
                        .or('last_read_at.is.null,last_read_at.lt.' + chat.timestamp)
                    )
                  );
                  setCustomers(prev =>
                    prev.map(chat =>
                      (!chat.last_read_at || new Date(chat.timestamp) > new Date(chat.last_read_at))
                        ? { ...chat, last_read_at: nowIso }
                        : chat
                    )
                  );
                  setFilterOption("All");
                  setShowMarkAll(false);
                }}
                onCancel={() => setShowMarkAll(false)}
              />
            )}
          </div>
        </div>
      </div>
      <div
        className="flex flex-col flex-grow h-full overflow-y-auto pt-1 pb-2"
      >
      {sortedChats.map((c) => {
        // Show blue dot if unread: if no last_read_at or last message is newer than last_read_at
        // Hide blue dot if chat is currently open and breaker has already faded (breakerSeenForChat true for this chat)
        const isChatOpen = c.number === selectedNumber;
        const isUnread = (!c.last_read_at || new Date(c.timestamp) > new Date(c.last_read_at));
        const showBlueDot =
          isUnread && !(isChatOpen && breakerSeenForChat[c.number]);
        return (
          <div
            key={c.number}
            onClick={() => {
              setSelectedNumber(c.number);
              if (isMobileUI) setMobileView("chat");
              // Do NOT mark as read immediately on click; let breaker logic handle it after fade.
              // Blue dot will disappear after breaker animation and markChatAsRead.
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
                <div className="text-sm text-[#7a859e] truncate">
                  {c.preview
                    ? c.preview
                    : c.media_url
                      ? c.media_url.match(/\.(jpeg|jpg|png|gif|bmp|webp)$/i)
                        ? "📷 Image"
                        : c.media_url.match(/\.(mp4|webm)$/i)
                          ? "📹 Video"
                          : c.media_url.match(/\.(ogg|mp3|wav|aac|m4a)$/i)
                            ? "🎤 Voice Note"
                            : c.media_url.match(/\.pdf$/i)
                              ? "📄 PDF"
                              : "📎 Attachment"
                      : ""}
                </div>
              </div>
            </div>
            <div className="flex items-center ml-2 flex-shrink-0">
              <div className="text-xs text-[#7a859e]">
                {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              {showBlueDot && (
                <span
                  className="ml-2 w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"
                  title={lang("unreadMessages")}
                />
              )}
            </div>
          </div>
        );
      })}
      {filteredChats.length === 0 && (
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
      className="relative bg-white dark:bg-gray-800 flex flex-col h-full overflow-hidden p-0 box-border flex-1 z-10"
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
                      placeholder="Search"
                      autoFocus
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="flex-1 pr-2 py-1 rounded-xl border-none focus:ring-2 focus:ring-primary text-[15px] bg-[#eaf0f6] text-[#2a3444]"
                      aria-label="Search"
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
                      onClick={() => setShowSortMenu((v) => !v)}
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
              {(() => {
                // Filter and sort messages as before
                const filteredMessages = chatHistory
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
                  });
                // Insert "New messages" marker above first unread message, only once
                let hasInsertedNewMessagesLabel = false;
                const lastReadTimestamp = currentCustomer?.last_read_at
                  ? new Date(currentCustomer.last_read_at)
                  : null;
                return filteredMessages.map((message, index) => {
                  let showNewMessagesLabel = false;
                  if (
                    lastReadTimestamp &&
                    !hasInsertedNewMessagesLabel &&
                    new Date(message.timestamp) > lastReadTimestamp
                  ) {
                    hasInsertedNewMessagesLabel = true;
                    showNewMessagesLabel = true;
                  }
                  return (
                    <React.Fragment key={message.id}>
                      {showNewMessagesLabel && (
                        <>
                          <div className="flex justify-center my-2">
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full shadow">
                              New Messages
                            </span>
                          </div>
                        </>
                      )}
                      <MessageBubble message={message} isMobileUI={isMobileUI} isLast={index === filteredMessages.length - 1} />
                    </React.Fragment>
                  );
                });
              })()}
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
              className={`flex-shrink-0 ${isMobileUI ? "fixed bottom-0 left-0 w-full z-40" : "sticky bottom-0 left-0 w-full"}`}
              style={isMobileUI ? { paddingBottom: "env(safe-area-inset-bottom)", maxWidth: "100vw" } : {}}
            >
              {/* Inline recording UX inside the typebar */}
              <div className="bg-white/80 backdrop-blur-lg border-t border-[#eaf0f6] shadow-sm">
                {/* --- BEGIN INLINE TYPEBAR/RECORDING BAR --- */}
                <div className="px-2 py-2">
                  {isRecording ? (
                    <div className="flex items-center justify-between gap-3 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl shadow-inner">
                      <div className="flex items-center gap-2 flex-1">
                        <AnimatedWaveform barCount={16} width={100} height={28} color="#868CFF" playing={true} />
                        <span className="text-[#868CFF] font-bold text-sm min-w-[42px] text-right" style={{letterSpacing:"0.01em"}}>
                          {formatTime(recordingDuration)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={cancelRecording}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-2 py-1 rounded-full text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={stopRecording}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                          aria-label="Stop Recording and Send"
                        >
                          <span className="material-icons text-[18px]">send</span>
                        </button>
                      </div>
                    </div>
                  ) : (
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
                  )}
                </div>
                {/* --- END INLINE TYPEBAR/RECORDING BAR --- */}
              </div>
            </div>
          </div>
        ) : (
          // Desktop layout: sticky footer input, scrollable messages
          <div className="flex flex-1 flex-col min-h-0 h-full overflow-hidden">
            {/* Premium-aligned chat header for desktop */}
            <div className="flex items-center justify-between gap-2 p-2 bg-white/70 backdrop-blur-lg rounded-xl shadow-sm sticky top-0 z-20">
              {/* Left side: Back + Avatar + Name */}
              <div className="flex items-center gap-2 min-w-0">
                {showBackButton && (
                  <button
                    onClick={() => {
                      if (isMobileUI) setMobileView("list");
                      else navigate('/tenant/dashboard');
                    }}
                    className="flex items-center justify-center w-10 h-10 p-0 rounded-xl focus:outline-none"
                    aria-label={lang("back")}
                    title={lang("back")}
                  >
                    <span className="material-icons text-[#7a859e] text-[24px]">arrow_back</span>
                  </button>
                )}
                <button onClick={() => setIsCustomerModalOpen(true)} className="focus:outline-none flex-shrink-0">
                  <img
                    src={defaultAvatar}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-[#eaf0f6]"
                  />
                </button>
                <span className="font-medium text-base md:text-lg text-[#2a3444] truncate">
                  {customers.find(c => c.number === selectedNumber)?.contact_name || selectedNumber}
                </span>
              </div>
              {/* Right side: Actions, always vertically centered */}
              <div className="flex items-center gap-1 flex-nowrap relative">
                {/* SEARCH ICON & INLINE BAR */}
                <div className="flex items-center">
                  {!searchOpen ? (
                    <button
                      onClick={() => { setSearchOpen(true); setDateOpen(false); }}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-[#eaf0f6] focus:outline-none transition"
                      aria-label={lang("searchChat")}
                      title={lang("searchChat")}
                    >
                      <span className="material-icons text-[#7a859e] text-[24px]">search</span>
                    </button>
                  ) : (
                    <div className="relative w-64 h-10">
                      <input
                        type="text"
                        className="w-full h-full pl-4 pr-10 bg-[#eaf0f6] rounded-xl text-base text-[#2a3444] outline-none border-none"
                        placeholder="Search"
                        autoFocus
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ fontFamily: "'Inter', 'Roboto', 'Open Sans', sans-serif" }}
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 font-bold text-xl focus:outline-none"
                          style={{ lineHeight: 1 }}
                          onClick={() => { setSearchTerm(""); setSearchOpen(false); }}
                          aria-label={lang("clearSearch")}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {/* DATE FILTER ICON & INLINE BAR */}
                <div className="flex items-center">
                  {!dateOpen ? (
                    <button
                      onClick={() => { setDateOpen(true); setSearchOpen(false); }}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-[#eaf0f6] focus:outline-none transition`}
                      aria-label={lang("filterByDate")}
                      title={lang("filterByDate")}
                    >
                      <span className="material-icons text-[#7a859e] text-[24px]">event</span>
                    </button>
                  ) : (
                    <div className="flex items-center bg-[#eaf0f6] rounded-xl px-2 w-60 max-w-[200px] h-10">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="flex-1 border-none focus:ring-0 outline-none bg-transparent text-base text-[#2a3444] px-2 h-full"
                        aria-label={lang("chooseDate")}
                      />
                      <button
                        onClick={() => { setSelectedDate(""); setDateOpen(false); }}
                        className="ml-1 text-red-600 font-bold text-lg focus:outline-none"
                        aria-label={lang("clearDateFilter")}
                        title={lang("clearDateFilter")}
                        type="button"
                      >×</button>
                    </div>
                  )}
                </div>
                {/* EXPORT ICON */}
                <Menu as="div" className="relative inline-block text-left">
                  <Menu.Button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm hover:bg-[#eaf0f6] focus:outline-none transition">
                    <span className="material-icons text-[#7a859e] text-[24px]">download</span>
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
                    <Menu.Items className="absolute right-0 mt-2 w-40 bg-white border rounded-xl shadow-lg focus:outline-none z-30">
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
              {(() => {
                const filteredMessages = chatHistory
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
                  });
                let hasInsertedNewMessagesLabel = false;
                const lastReadTimestamp = currentCustomer?.last_read_at
                  ? new Date(currentCustomer.last_read_at)
                  : null;
                return filteredMessages.map((message, index) => {
                  let showNewMessagesLabel = false;
                  if (
                    lastReadTimestamp &&
                    !hasInsertedNewMessagesLabel &&
                    new Date(message.timestamp) > lastReadTimestamp
                  ) {
                    hasInsertedNewMessagesLabel = true;
                    showNewMessagesLabel = true;
                  }
                  return (
                    <React.Fragment key={message.id}>
                      {showNewMessagesLabel && (
                        <>
                          <div className="flex justify-center my-2">
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full shadow">
                              New Messages
                            </span>
                          </div>
                        </>
                      )}
                      <MessageBubble message={message} isMobileUI={isMobileUI} isLast={index === filteredMessages.length - 1} />
                    </React.Fragment>
                  );
                });
              })()}
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
                      <div className="flex items-center gap-3 w-full px-4 py-3 bg-white rounded-[40px] shadow border border-[#d5dae1]">
  <AnimatedWaveform
    barCount={16}
    width={190}
    height={32}
    color="#868CFF"
    playing={true}
  />
  <span className="text-[#868CFF] font-bold ml-4 min-w-[48px] text-lg">
    {formatTime(recordingDuration)}
  </span>
  <button
    onClick={stopRecording}
    aria-label={lang("stopRecordingAndSend")}
    title={lang("stopRecordingAndSend")}
    className="ml-4 p-2 bg-red-500 rounded-full shadow hover:bg-red-600 focus:outline-none text-white"
  >
    {/* Send SVG */}
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="white" viewBox="0 0 24 24">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  </button>
</div>
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

  // Effect to handle "New Messages" breaker logic, animation, and mark as read
  useEffect(() => {
    if (!chatHistory || chatHistory.length === 0 || !selectedNumber) return;

    const latestReadAt = chatHistory.reduce(
      (max, m) => m.last_read_at && new Date(m.last_read_at) > new Date(max) ? m.last_read_at : max,
      ""
    );
    const latestReadDate = latestReadAt ? new Date(latestReadAt) : new Date(0);

    const unreadIdx = chatHistory.findIndex(m => new Date(m.timestamp) > latestReadDate);

    if (unreadIdx !== -1 && !breakerSeenForChat[selectedNumber]) {
      setShowNewMsgBreaker(true);

      if (breakerTimeoutRef.current[selectedNumber]) clearTimeout(breakerTimeoutRef.current[selectedNumber]);

      breakerTimeoutRef.current[selectedNumber] = setTimeout(() => {
        setShowNewMsgBreaker(false);

        if (selectedNumber && !breakerSeenForChat[selectedNumber]) {
          const lastTimestamp = chatHistory[chatHistory.length - 1]?.timestamp;
          if (lastTimestamp) {
            markChatAsRead(lastTimestamp, selectedNumber);
            setBreakerSeenForChat(prev => ({ ...prev, [selectedNumber]: true }));
          }
        }
      }, 7000); // Show breaker for 7 seconds
    }

    if (unreadIdx === -1 && !breakerSeenForChat[selectedNumber]) {
      setShowNewMsgBreaker(false);
      setBreakerSeenForChat(prev => ({ ...prev, [selectedNumber]: true }));
    }

    return () => {
      if (breakerTimeoutRef.current[selectedNumber]) {
        clearTimeout(breakerTimeoutRef.current[selectedNumber]);
        delete breakerTimeoutRef.current[selectedNumber];
      }
    };
  }, [chatHistory, selectedNumber]);

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
            <div className="w-[390px] min-w-[340px] max-w-[420px] h-full flex-shrink-0 bg-white shadow-sm z-10">
  {chatListPane}
</div>
<div className="flex-1 flex flex-col h-full bg-white relative z-0">
  {chatConversationPane}
</div>
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
      </Dialog>
    </Transition>
    </>)}