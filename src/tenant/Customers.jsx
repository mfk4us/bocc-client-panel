import React from "react";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { supabase } from "../components/supabaseClient";

import defaultAvatar from "../assets/default-avatar.png";
import { useNavigate } from "react-router-dom";

import { lang } from "../lang";

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


export default function Customers({ language }) {
  // Mobile detection state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  // Small screen detection state (<= 767px)
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 767);
  useEffect(() => {
    const onResize = () => setIsSmallScreen(window.innerWidth <= 767);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  // Portrait detection state
  const [isPortrait, setIsPortrait] = useState(window.innerHeight >= window.innerWidth);
  useEffect(() => {
    const handleOrientation = () => setIsPortrait(window.innerHeight >= window.innerWidth);
    window.addEventListener("resize", handleOrientation);
    return () => window.removeEventListener("resize", handleOrientation);
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
  const workflowName = localStorage.getItem("workflow");

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [showSortMenu, setShowSortMenu] = useState(false);

  // ref to detect outside clicks for sort menu
  const sortContainerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("*");

      const { data: notesData, error: notesError } = await supabase
        .from("customer_notes")
        .select("*")
        .eq("workflow_name", workflowName);

      if (!customersError) setCustomers(customersData || []);
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

    fetchData();
  }, [workflowName]);

  // close sort menu when clicking outside
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

  const filteredCustomers = useMemo(() => {
    return customers.filter(cust => {
      const noteEntry = notesMap[cust.phone] || {};
      // build searchable strings
      const haystackGlobal = [
        cust.name,
        cust.phone,
        noteEntry.tags,
        noteEntry.notes
      ].join(" | ").toLowerCase();
      if (!haystackGlobal.includes(globalFilter.toLowerCase())) return false;
      // per-column filtering
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


  // Sorting logic
  const sortedCustomers = useMemo(() => {
    if (!sortConfig.key) return filteredCustomers;
    const sorted = [...filteredCustomers].sort((a, b) => {
      let aVal = a[sortConfig.key] || "";
      let bVal = b[sortConfig.key] || "";
      // if comparing notesMap fields:
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

  // paginate sorted results
  const pageCount = Math.ceil(sortedCustomers.length / pageSize);
  const paginatedCustomers = sortedCustomers.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const handleSave = async () => {
    if (editingNoteId) {
      const { error } = await supabase
        .from("customer_notes")
        .update({ notes, tags })
        .eq("id", editingNoteId);

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

  return (
    <div className="flex flex-col h-full p-2" dir={localStorage.getItem("lang") === "ar" ? "rtl" : "ltr"}>
      <div className="mb-4 flex flex-wrap items-center gap-2 w-full">
        {isSmallScreen && (
          <button
            onClick={() => navigate("/tenant/dashboard")}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded focus:outline-none"
            aria-label={lang("backToDashboard", language)}
          >
            ←
          </button>
        )}
        <h2
          className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex-shrink-0 mr-auto"
          style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          📁 {lang("customerNotesTags", language)}
        </h2>
        <div className="flex items-center flex-1 min-w-[120px] max-w-xs">
          <input
            type="text"
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder={lang("searchCustomers", language)}
            className="flex-1 pl-3 pr-2 py-1 border rounded shadow-sm focus:outline-none focus:ring text-xs sm:text-sm"
          />
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="ml-2 p-2 bg-white dark:bg-gray-800 rounded focus:outline-none"
            aria-label={lang("sortOptions", language)}
          >
            <ArrowsUpDownIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          {showSortMenu && (
            <div className="absolute mt-2 right-0 bg-white dark:bg-gray-900 border rounded shadow p-2 z-50 w-40">
              {['name', 'phone', 'tags', 'notes', 'first_seen', 'last_seen'].map(key => (
                <button
                  key={key}
                  onClick={() => {
                    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
                    setSortConfig({ key, direction });
                    setShowSortMenu(false);
                  }}
                  className="flex items-center justify-between w-full px-2 py-1 text-xs text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <span>
                    {lang(key + "Header", language)}
                  </span>
                  {sortConfig.key === key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
      {/* Table for desktop, cards for mobile */}
      {!isMobile && (
        <table className="w-full table-auto bg-white dark:bg-gray-900 rounded shadow-sm">
          <thead className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white">
            <tr>
              <th className="text-center p-2 sm:p-3 text-sm sm:text-base">#</th>
              <th className="text-center p-2 sm:p-3 text-sm sm:text-base">{lang("avatarHeader", language)}</th>
              <th className="text-center p-2 sm:p-3 text-sm sm:text-base">
                <button onClick={() => {
                  const key = "name";
                  let direction = "asc";
                  if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
                  setSortConfig({ key, direction });
                }} className="flex items-center space-x-1">
                  <span>{lang("nameHeader", language)}</span>
                  {sortConfig.key === "name" && (
                    <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                  )}
                </button>
              </th>
              <th className="text-center p-2 sm:p-3 text-sm sm:text-base">
                <button onClick={() => {
                  const key = "phone";
                  let direction = "asc";
                  if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
                  setSortConfig({ key, direction });
                }} className="flex items-center space-x-1">
                  <span>{lang("phoneHeader", language)}</span>
                  {sortConfig.key === "phone" && (
                    <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                  )}
                </button>
              </th>
              <th className="text-center p-2 sm:p-3 text-sm sm:text-base">
                <button onClick={() => {
                  const key = "tags";
                  let direction = "asc";
                  if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
                  setSortConfig({ key, direction });
                }} className="flex items-center space-x-1">
                  <span>{lang("tagsHeader", language)}</span>
                  {sortConfig.key === "tags" && (
                    <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                  )}
                </button>
              </th>
              <th className="text-center p-2 sm:p-3 text-sm sm:text-base">
                <button onClick={() => {
                  const key = "notes";
                  let direction = "asc";
                  if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
                  setSortConfig({ key, direction });
                }} className="flex items-center space-x-1">
                  <span>{lang("notesHeader", language)}</span>
                  {sortConfig.key === "notes" && (
                    <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                  )}
                </button>
              </th>
              <th className="text-center p-2 sm:p-3 text-sm sm:text-base">
                <button onClick={() => {
                  const key = "first_seen";
                  let direction = "asc";
                  if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
                  setSortConfig({ key, direction });
                }} className="flex items-center space-x-1">
                  <span>{lang("customerAgeHeader", language)}</span>
                  {sortConfig.key === "first_seen" && (
                    <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                  )}
                </button>
              </th>
              <th className="text-center p-2 sm:p-3 text-sm sm:text-base">
                <button onClick={() => {
                  const key = "last_seen";
                  let direction = "asc";
                  if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
                  setSortConfig({ key, direction });
                }} className="flex items-center space-x-1">
                  <span>{lang("daysSinceContactHeader", language)}</span>
                  {sortConfig.key === "last_seen" && (
                    <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                  )}
                </button>
              </th>
              <th className="text-center p-3">{lang("actionsHeader", language)}</th>
            </tr>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th></th>
              <th></th>
              {["name","phone","tags","notes","first_seen","last_seen"].map(col => (
                <th key={col} className="p-1 sm:p-2 text-xs sm:text-sm text-center">
                  <input
                    type="text"
                    value={columnFilters[col]}
                    onChange={e => setColumnFilters(prev => ({...prev, [col]: e.target.value}))}
                    placeholder={lang(col + "Filter", language) || `${lang("filter", language)} ${lang(col + "Header", language)}`}
                    className="w-full p-1 border rounded text-sm bg-white dark:bg-gray-800"
                  />
                </th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.map((cust, index) => {
              const noteEntry = notesMap[cust.phone] || {};
              return (
                <tr key={cust.id} className="border-t hover:bg-gray-100 dark:hover:bg-gray-800">
                  <td className="p-3 text-center font-medium text-gray-900 dark:text-white">{pageIndex * pageSize + index + 1}</td>
                  <td className="p-3 text-center">
                    <img src={defaultAvatar} alt={lang("avatarAlt", language)} className="w-8 h-8 rounded-full" />
                  </td>
                  <td className="p-3 text-left font-medium text-gray-900 dark:text-white">{cust.name}</td>
                  <td className="p-3 text-center text-gray-900 dark:text-white">{cust.phone}</td>
                  <td className="p-3 text-left text-sm text-gray-300">{noteEntry.tags}</td>
                  <td className="p-3 text-left text-sm text-gray-300">{noteEntry.notes}</td>
                  <td className="p-3 text-center text-gray-900 dark:text-white">
                    {cust.first_seen ? formatDuration(cust.first_seen, language) : ""}
                  </td>
                  <td className="p-3 text-center text-gray-900 dark:text-white">
                    {cust.last_seen ? formatRelative(cust.last_seen, language) : ""}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => {
                        setEditingCustomer(cust.phone);
                        setEditingNoteId(noteEntry.id || null);
                        setNotes(noteEntry.notes || "");
                        setTags(noteEntry.tags || "");
                      }}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {lang("edit", language)}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {isMobile && (
        <div className="space-y-2">
          {paginatedCustomers.map((cust, idx) => {
            const noteEntry = notesMap[cust.phone] || {};
            return (
              <div key={cust.id} className="relative bg-white dark:bg-gray-900 p-1 rounded-md shadow-sm">
                <button
                  onClick={() => {
                    setEditingCustomer(cust.phone);
                    setEditingNoteId(noteEntry.id || null);
                    setNotes(noteEntry.notes || "");
                    setTags(noteEntry.tags || "");
                  }}
                  className="absolute top-2 right-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none text-xs"
                  aria-label={lang("edit", language)}
                >
                  ✏️
                </button>
                <div className="flex items-center space-x-2 mb-1">
                  <img src={defaultAvatar} alt={lang("avatarAlt", language)} className="w-10 h-10 rounded-full" />
                  <div className="flex items-center space-x-1">
                    {cust.name ? (
                      <>
                        <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                          {cust.name}
                        </span>
                        <span className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
                          {cust.phone}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
                        {cust.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="space-y-1">
                    <div className="text-[10px] sm:text-xs truncate"><span className="font-medium">{lang("tagsLabel", language)}:</span> {noteEntry.tags || lang("dash", language)}</div>
                    <div className="text-[10px] sm:text-xs truncate"><span className="font-medium">{lang("notesLabel", language)}:</span> {noteEntry.notes || lang("dash", language)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs"><span className="font-medium">{lang("firstSeenLabel", language)}:</span> {cust.first_seen ? formatDuration(cust.first_seen, language) : lang("dash", language)}</div>
                    <div className="text-xs"><span className="font-medium">{lang("lastSeenLabel", language)}:</span> {cust.last_seen ? formatRelative(cust.last_seen, language) : lang("dash", language)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      <div
        className={`sticky bottom-0 w-full bg-white dark:bg-gray-800 p-2 ${
          isMobile && isPortrait
            ? "flex flex-col items-center space-y-2 text-xs"
            : isMobile && !isPortrait
              ? "flex justify-between items-center text-[10px]"
              : "flex justify-between items-center text-xs sm:text-sm"
        }`}
      >
        <div className="text-center text-gray-700 dark:text-gray-300">
          {lang("showingCustomers",
            language,
            (pageIndex * pageSize) + 1,
            Math.min((pageIndex + 1) * pageSize, sortedCustomers.length),
            sortedCustomers.length
          )}
        </div>
        {isMobile && isPortrait ? (
          <div className="flex items-center space-x-2">
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPageIndex(0); }}
              className="p-1 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs"
            >
              {[10,20,50,100].map(size => (
                <option key={size} value={size}>{lang("perPage", language, size)}</option>
              ))}
            </select>
            <button
              onClick={() => setPageIndex(old => Math.max(old - 1, 0))}
              disabled={pageIndex === 0}
              className="px-2 py-1 border rounded text-xs"
            >
              {lang("prev", language)}
            </button>
            <span className="text-xs">{pageIndex + 1} / {pageCount || 1}</span>
            <button
              onClick={() => setPageIndex(old => Math.min(old + 1, pageCount - 1))}
              disabled={pageIndex >= pageCount - 1}
              className="px-2 py-1 border rounded text-xs"
            >
              {lang("next", language)}
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPageIndex(0); }}
              className="p-1 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
            >
              {[10,20,50,100].map(size => (
                <option key={size} value={size}>{lang("perPage", language, size)}</option>
              ))}
            </select>
            <button
              onClick={() => setPageIndex(old => Math.max(old - 1, 0))}
              disabled={pageIndex === 0}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              {lang("prev", language)}
            </button>
            <span>{pageIndex + 1} / {pageCount || 1}</span>
            <button
              onClick={() => setPageIndex(old => Math.min(old + 1, pageCount - 1))}
              disabled={pageIndex >= pageCount - 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              {lang("next", language)}
            </button>
          </div>
        )}
      </div>



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
                }}
                className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded text-gray-900 dark:text-gray-100"
              >
                {lang("cancel", language)}
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {lang("save", language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}