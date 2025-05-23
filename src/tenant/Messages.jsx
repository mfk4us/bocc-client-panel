import React, { useState, useEffect, useRef } from "react";
import { Menu, Transition, Dialog } from '@headlessui/react';
import { Fragment } from 'react';
import { FiFileText, FiFile, FiFilePlus } from 'react-icons/fi';
import { supabase } from "../components/supabaseClient";
import defaultAvatar from "../assets/default-avatar.png";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Messages() {
  useEffect(() => {
    // disable page scroll when Messages tab is active
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      // restore default scrolling when leaving
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);
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

  // fetch list of unique customer numbers
  useEffect(() => {
    if (!workflow) return;
    supabase
      .from("messages")
      .select("number, content, contact_name, timestamp")
      .eq("workflow_name", workflow)
      .order("timestamp", { ascending: false })
      .then(({ data }) => {
        // group by number, pick latest content & contact_name
        const map = {};
        data.forEach((m) => {
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

  // apply left-pane search filter
  const filteredCustomers = customers.filter(c => {
    const term = leftSearchTerm.toLowerCase();
    return c.number.toLowerCase().includes(term)
      || (c.contact_name || "").toLowerCase().includes(term)
      || (c.preview || "").toLowerCase().includes(term);
  });

  return (
    <>
    <div className="flex h-screen overflow-hidden gap-1 p-1">
      {/* left pane */}
      <div
        ref={leftPaneRef}
        className="w-80 bg-gray-50 dark:bg-gray-800 shadow-inner overflow-y-auto overflow-x-hidden px-1 py-1 box-border"
      >
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search number or preview…"
            value={leftSearchTerm}
            onChange={e => setLeftSearchTerm(e.target.value)}
            className="w-full pr-8 p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-400"
          />
          {leftSearchTerm && (
            <button
              onClick={() => setLeftSearchTerm("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 font-bold"
              aria-label="Clear search"
              type="button"
            >×</button>
          )}
        </div>
        {filteredCustomers.map((c) => (
          <div
            key={c.number}
            onClick={() => setSelectedNumber(c.number)}
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

      {/* right pane */}
      <div
        ref={rightPaneRef}
        className="flex-1 flex flex-col p-1 bg-white dark:bg-gray-800 shadow-inner rounded-lg"
      >
        {selectedNumber ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-md shadow-sm relative">
            <div className="flex items-center space-x-3">
                <button onClick={() => setIsCustomerModalOpen(true)} className="focus:outline-none">
                  <img src={defaultAvatar} alt="avatar" className="w-8 h-8 rounded-full mr-3 object-cover ring-2 ring-blue-300 dark:ring-blue-500"/>
                </button>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Chat with {customers.find(c => c.number === selectedNumber)?.contact_name || selectedNumber}
                </h2>
              </div>
              <div className="flex-none flex items-center space-x-2">
                {/* Search toggle / input */}
                {!searchOpen ? (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xl"
                    aria-label="Search chat"
                  >
                    🔍
                  </button>
                ) : (
                  <div className="w-56 relative transition-all duration-200">
                    <input
                      type="text"
                      placeholder="Search..."
                      autoFocus
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pr-8 p-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSearchOpen(false);
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 font-bold text-2xl leading-none focus:outline-none"
                      aria-label="Clear search"
                      type="button"
                    >
                      ×
                    </button>
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
                  <Menu.Button className="inline-flex justify-center items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    Export
                    <FiFileText className="ml-2 h-4 w-4" />
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
            <div className="flex-1 overflow-y-auto space-y-3 px-2 py-1">
              {chatHistory
                .filter(m => {
                  const matchesText = m.content.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesDate = !selectedDate || m.timestamp.slice(0,10) === selectedDate;
                  return matchesText && matchesDate;
                })
                .map((m) => (
                  <div key={m.id} className={`flex mb-2 ${m.type === "bot" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] px-3 py-1 shadow break-words whitespace-normal ${
                        m.type === "bot"
                          ? "bg-[#d9fdd2] text-gray-900 rounded-tr-lg rounded-br-lg rounded-bl-lg"
                          : "bg-white text-gray-900 dark:text-gray-100 rounded-tl-lg rounded-tr-lg rounded-br-lg"
                      }`}
                    >
                      <p className="text-sm">{m.content}</p>
                      <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5 text-right">
                        {new Date(m.timestamp).toLocaleString([], {
                          hour: "2-digit", minute: "2-digit", month: "short", day: "numeric"
                        })}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            Select a customer to view conversation
          </div>
        )}
      </div>
    </div>
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
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Customer Details
            </Dialog.Title>
            <div className="flex flex-col items-center space-y-2">
              <img
                src={defaultAvatar}
                alt="Customer Avatar"
                className="w-20 h-20 rounded-full object-cover ring-2 ring-blue-300 dark:ring-blue-500"
              />
              <div className="text-center">
                <div className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {customers.find(c => c.number === selectedNumber)?.contact_name || selectedNumber}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
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