import React, { useState, useEffect, useRef } from "react";
import { ArrowsUpDownIcon, MicrophoneIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useNavigate } from 'react-router-dom';
import { Menu, Transition, Dialog } from '@headlessui/react';
import { Fragment } from 'react';
import { FiFileText, FiFile, FiFilePlus } from 'react-icons/fi';
import { supabase } from "../components/supabaseClient";
import defaultAvatar from "../assets/default-avatar.png";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Messages() {
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

  // mobile view state: "list" shows chat list, "chat" shows conversation on phones
  const [mobileView, setMobileView] = useState("list");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const navigate = useNavigate();
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
    setChatHistory(prev => [
      ...prev,
      { ...newMsg, id: data?.[0]?.id || Math.random().toString(36).substr(2, 9) }
    ]);
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

  // subscribe to new messages in real-time (Supabase v2)
  useEffect(() => {
    if (!workflow || !selectedNumber) return;
    const channel = supabase
      .channel(`messages_${workflow}_${selectedNumber}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `workflow_name=eq.${workflow},number=eq.${selectedNumber}`,
        },
        (payload) => {
          setChatHistory((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workflow, selectedNumber]);

  // Refetch chat history when window/tab regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (!workflow || !selectedNumber) return;
      supabase
        .from("messages")
        .select("*")
        .eq("workflow_name", workflow)
        .eq("number", selectedNumber)
        .order("timestamp", { ascending: true })
        .then(({ data }) => {
          if (data) setChatHistory(data);
        })
        .catch((err) => console.error("Refetch on focus error:", err));
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [workflow, selectedNumber]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!workflow || !selectedNumber) return;
    const intervalId = setInterval(() => {
      supabase
        .from("messages")
        .select("*")
        .eq("workflow_name", workflow)
        .eq("number", selectedNumber)
        .order("timestamp", { ascending: true })
        .then(({ data }) => {
          if (data) setChatHistory(data);
        })
        .catch((err) => console.error("Polling error:", err));
    }, 5000);
    return () => clearInterval(intervalId);
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

  return (
    <>
    <div className="flex w-full h-full overflow-hidden m-0 p-0 pb-12 sm:pb-0">
      {/* chat list pane */}
      {(!isMobile || mobileView === "list") && (
        <div
          ref={leftPaneRef}
          className="absolute inset-0 z-20 bg-gray-50 dark:bg-gray-800 overflow-y-auto overflow-x-hidden p-1 box-border sm:relative sm:inset-auto sm:z-auto sm:block sm:w-80"
        >
          <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 pt-2 pb-1 px-1 shadow-sm">
            <div className="flex items-start space-x-2 px-2 mb-1">
              {/* Back button moved here */}
              {isMobile && (
                <button
                  onClick={() => navigate('/tenant/dashboard')}
                  className="sm:hidden p-2 focus:outline-none"
                  aria-label="Back"
                >
                  ←
                </button>
              )}
              <div className="flex-1">
                <span className="block text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">Recent Chats</span>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">Showing only messages from the last 24 hours</p>
              </div>
            </div>
            <div ref={leftSortRef} className="flex items-center space-x-2 px-2 relative">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search number or preview…"
                  value={leftSearchTerm}
                  onChange={e => setLeftSearchTerm(e.target.value)}
                  className="w-full pr-8 p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm"
                />
                {leftSearchTerm && (
                  <button
                    onClick={() => setLeftSearchTerm("")}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-red-600 font-bold"
                    aria-label="Clear search"
                    type="button"
                  >×</button>
                )}
              </div>
              <button
                onClick={() => setLeftShowSortMenu(!leftShowSortMenu)}
                className="p-2 bg-white dark:bg-gray-700 rounded focus:outline-none"
                aria-label="Sort chats"
              >
                <ArrowsUpDownIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              {leftShowSortMenu && (
                <div className="absolute mt-10 right-2 bg-white dark:bg-gray-900 border rounded shadow p-2 z-40 w-40">
                  {['contact_name','preview','timestamp'].map(key => (
                    <button
                      key={key}
                      onClick={() => {
                        const newDirection = leftSortConfig.key === key && leftSortConfig.direction === 'asc' ? 'desc' : 'asc';
                        setLeftSortConfig({ key, direction: newDirection });
                        setLeftShowSortMenu(false);
                      }}
                      className="flex justify-between w-full px-2 py-1 text-xs text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    >
                      <span>{key === 'contact_name' ? 'Name' : key === 'preview' ? 'Preview' : 'Time'}</span>
                      {leftSortConfig.key === key && (
                        <span className="ml-1">{leftSortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {filteredCustomers.map((c) => (
            <div
              key={c.number}
              onClick={() => { setSelectedNumber(c.number); if (isMobile) setMobileView("chat"); }}
              className={`${c.number === selectedNumber
                ? 'bg-white dark:bg-gray-600 shadow-md border border-transparent'
                : 'bg-white dark:bg-gray-700 shadow-inner border border-transparent'
              } flex justify-between items-center p-3 m-2 rounded-xl cursor-pointer transition duration-150 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-200`}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {/* avatar */}
                <img
                  src={defaultAvatar}
                  alt="avatar"
                  className="w-10 h-10 rounded-full flex-shrink-0 object-cover ring-2 ring-blue-300 dark:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate text-gray-900 dark:text-gray-100">{c.contact_name || c.number}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{c.preview}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          {filteredCustomers.length === 0 && (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
              <svg className="w-12 h-12 mb-2 text-gray-300 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 2h20v18H6l-4 4V2z" />
              </svg>
              <span className="text-lg">No messages found</span>
            </div>
          )}
        </div>
      )}

      {/* chat conversation pane */}
      {(!isMobile || mobileView === "chat") && (
        <div
          ref={rightPaneRef}
          onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={e => {
            setTouchEndX(e.changedTouches[0].clientX);
            if (e.changedTouches[0].clientX - touchStartX > 100) {
              setMobileView("list");
            }
          }}
          className="absolute inset-0 z-10 bg-white dark:bg-gray-800 flex flex-col h-full overflow-hidden p-0 box-border sm:relative sm:inset-auto sm:z-auto sm:flex-1"
        >
        {selectedNumber ? (
          <div className="flex flex-col flex-1 h-full min-h-0">
            <div className="flex-shrink-0 flex items-center justify-between mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-md shadow-sm relative">
              <div className="flex items-center space-x-2 min-w-0">
                {isMobile && (
                  <button
                    onClick={() => setMobileView("list")}
                    className="sm:hidden p-2 focus:outline-none text-lg"
                    aria-label="Back to chats"
                  >
                    ←
                  </button>
                )}
                <button onClick={() => setIsCustomerModalOpen(true)} className="focus:outline-none flex-shrink-0">
                  <img
                    src={defaultAvatar}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-300 dark:ring-blue-500"
                  />
                </button>
                <h2 className="flex-1 text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {customers.find(c => c.number === selectedNumber)?.contact_name || selectedNumber}
                </h2>
              </div>
              <div className="flex-none flex items-center space-x-2">
                {/* Search toggle / input (sort removed) */}
                {!searchOpen ? (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xl"
                    aria-label="Search chat"
                  >
                    🔍
                  </button>
                ) : (
                  <div ref={sortContainerRef} className="relative flex items-center space-x-1 transition-all duration-200">
                    <input
                      type="text"
                      placeholder="Search..."
                      autoFocus
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="flex-1 pr-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring text-xs sm:text-sm"
                    />
                    <button
                      onClick={() => { setSearchTerm(''); setSearchOpen(false); }}
                      className="p-1 text-red-600 font-bold text-lg focus:outline-none"
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                    <button
                      onClick={() => setShowSortMenu(!showSortMenu)}
                      className="p-2 bg-white dark:bg-gray-700 rounded focus:outline-none ml-1"
                      aria-label="Sort messages"
                      type="button"
                    >
                      <ArrowsUpDownIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    {showSortMenu && (
                      <div className="absolute mt-10 right-0 bg-white dark:bg-gray-900 border rounded shadow p-2 z-40 w-40">
                        {['timestamp','type','content'].map(key => (
                          <button
                            key={key}
                            onClick={() => {
                              const newDirection = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
                              setSortConfig({ key, direction: newDirection });
                              setShowSortMenu(false);
                            }}
                            className="flex justify-between w-full px-2 py-1 text-xs text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                          >
                            <span>
                              {key === 'timestamp' ? 'Time' : key === 'type' ? 'Sender' : 'Content'}
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
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xl"
                    aria-label="Filter by date"
                  >
                    📅
                  </button>
                ) : (
                  <div className="w-56 relative transition-all duration-200">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="w-full pr-8 p-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      onClick={() => {
                        setSelectedDate("");
                        setDateOpen(false);
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 font-bold text-2xl leading-none focus:outline-none"
                      aria-label="Clear date filter"
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                )}

                <Menu as="div" className="relative inline-block text-left ml-2">
                  <Menu.Button className="inline-flex justify-center items-center p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <FiFileText className="h-5 w-5" />
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
                    <Menu.Items className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg focus:outline-none z-10">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={exportCSVfile}
                            className={`${active ? 'bg-gray-100 dark:bg-gray-600' : ''} group flex items-center px-4 py-2 text-sm w-full`}
                          >
                            <FiFile className="mr-2 h-5 w-5" /> CSV
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={exportCSV}
                            className={`${active ? 'bg-gray-100 dark:bg-gray-600' : ''} group flex items-center px-4 py-2 text-sm w-full`}
                          >
                            <FiFilePlus className="mr-2 h-5 w-5" /> Excel
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={exportPDF}
                            className={`${active ? 'bg-gray-100 dark:bg-gray-600' : ''} group flex items-center px-4 py-2 text-sm w-full`}
                          >
                            <FiFileText className="mr-2 h-5 w-5" /> PDF
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
              className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-1 relative min-h-0"
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
                .map((m) => {
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
                      className={`flex mb-2 ${isCustomer ? "justify-start" : "justify-end"}`}
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
                                📄 Open PDF
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
                  title="Scroll to latest message"
                  aria-label="Scroll to bottom"
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
                  <img src={pendingMediaPreview} alt="preview" className="max-h-32 rounded" />
                ) : false ? (
                  <audio controls src={pendingMediaPreview} className="max-w-xs" />
                ) : pendingMedia.type === "application/pdf" ? (
                  <span className="text-sm sm:text-base text-gray-700">PDF ready to send: {pendingMedia.name}</span>
                ) : (
                  <span className="text-sm sm:text-base text-gray-700">File ready: {pendingMedia.name}</span>
                )}
                <button
                  onClick={() => { setPendingMedia(null); setPendingMediaPreview(null); }}
                  className="ml-2 text-red-500 hover:text-red-700 font-bold"
                  aria-label="Remove file"
                  title="Remove file"
                >×</button>
              </div>
            )}
            <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center space-x-3">
              <>
                {!isRecording ? (
                  <>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendMessage()}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none"
                    />
                    <button
                      onClick={() => startRecording()}
                      aria-label="Start recording"
                      className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full shadow hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none"
                    >
                      <MicrophoneIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
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
                      className="p-2 rounded hover:bg-gray-200"
                      aria-label="Attach file"
                    >📎</button>
                    <button
                      onClick={sendMessage}
                      disabled={isSending || !newMessage.trim()}
                      aria-label="Send message"
                      className={`p-3 rounded-full shadow ${
                        isSending ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                      } text-white focus:outline-none`}
                    >
                      <PaperAirplaneIcon className="w-5 h-5" style={{ transform: "rotate(360deg)" }} />
                    </button>
                  </>
                ) : (
                  <>
                    {/* Waveform animation placeholder */}
                    <div className="flex-1 h-10 bg-blue-200 rounded-full animate-pulse" />
                    {/* Send button now stops recording */}
                    <button
                      onClick={stopRecording}
                      aria-label="Stop recording and send"
                      className="p-3 bg-red-500 rounded-full shadow hover:bg-red-600 focus:outline-none text-white"
                    >
                      <PaperAirplaneIcon className="w-5 h-5" style={{ transform: "rotate(360deg)" }} />
                    </button>
                  </>
                )}
              </>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            Select a customer to view conversation
          </div>
        )}
      </div>
      )}
    </div>
    {/* mobile bottom nav */}
    {isMobile && (
      <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-800 border-t flex">
        <button
          onClick={() => navigate('/tenant/dashboard')}
          className="flex-1 py-2 text-center"
          aria-label="Home"
        >
          🏠
        </button>
        <button
          onClick={() => setMobileView("list")}
          className={`flex-1 py-2 text-center ${mobileView === "list" ? "bg-gray-100 dark:bg-gray-700" : ""}`}
          aria-label="Chats"
        >
          💬
        </button>
        <button
          onClick={() => setMobileView("chat")}
          disabled={!selectedNumber}
          className={`flex-1 py-2 text-center ${mobileView === "chat" ? "bg-gray-100 dark:bg-gray-700" : ""} ${!selectedNumber ? "opacity-50" : ""}`}
          aria-label="Conversation"
        >
          📨
        </button>
      </div>
    )}
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
                aria-label="Close image preview"
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
              aria-label="Close modal"
            >
              ×
            </button>
            <Dialog.Title className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Customer Details
            </Dialog.Title>
            <div className="flex flex-col items-center space-y-2">
              <img
                src={defaultAvatar}
                alt="Customer Avatar"
                className="w-20 h-20 rounded-full object-cover ring-2 ring-blue-300 dark:ring-blue-500"
              />
              <div className="text-center">
                <div className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
                  {customers.find(c => c.number === selectedNumber)?.contact_name || selectedNumber}
                </div>
                <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
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