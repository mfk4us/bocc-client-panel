import React from "react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "../components/supabaseClient";

import defaultAvatar from "../assets/default-avatar.png";

// helper to format a timestamp as relative time (days/weeks/years/decades ago)
function formatRelative(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return "Today";
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 52) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
  const diffYears = Math.floor(diffDays / 365);
  if (diffYears < 10) return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
  const diffDecades = Math.floor(diffYears / 10);
  return `${diffDecades} decade${diffDecades > 1 ? "s" : ""} ago`;
}

// helper to format a timestamp as a duration without "ago" suffix
function formatDuration(dateString) {
  const rel = formatRelative(dateString);
  return rel.endsWith(' ago') ? rel.slice(0, -4) : rel;
}


export default function Customers() {
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
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">📁 Customer Notes & Tags</h2>

      <div className="flex items-center justify-between mb-4">
        <div className="relative">
          <input
            type="text"
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Search customers…"
            className="pl-10 pr-3 py-2 border rounded shadow-sm w-64 focus:outline-none focus:ring"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
        </div>
      </div>

      <table className="w-full table-auto bg-white dark:bg-gray-900 rounded shadow-sm">
        <thead className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white">
          <tr>
            <th className="text-center p-3">#</th>
            <th className="text-center p-3">Avatar</th>
            <th className="text-center p-3">
              <button onClick={() => {
                const key = "name";
                let direction = "asc";
                if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
                setSortConfig({ key, direction });
              }} className="flex items-center space-x-1">
                <span>Name</span>
                {sortConfig.key === "name" && (
                  <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                )}
              </button>
            </th>
            <th className="text-center p-3">
              <button onClick={() => {
                const key = "phone";
                let direction = "asc";
                if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
                setSortConfig({ key, direction });
              }} className="flex items-center space-x-1">
                <span>Phone</span>
                {sortConfig.key === "phone" && (
                  <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                )}
              </button>
            </th>
            <th className="text-center p-3">
              <button onClick={() => {
                const key = "tags";
                let direction = "asc";
                if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
                setSortConfig({ key, direction });
              }} className="flex items-center space-x-1">
                <span>Tags</span>
                {sortConfig.key === "tags" && (
                  <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                )}
              </button>
            </th>
            <th className="text-center p-3">
              <button onClick={() => {
                const key = "notes";
                let direction = "asc";
                if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
                setSortConfig({ key, direction });
              }} className="flex items-center space-x-1">
                <span>Notes</span>
                {sortConfig.key === "notes" && (
                  <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                )}
              </button>
            </th>
            <th className="text-center p-3">
              <button onClick={() => {
                const key = "first_seen";
                let direction = "asc";
                if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
                setSortConfig({ key, direction });
              }} className="flex items-center space-x-1">
                <span>Customer Age (days)</span>
                {sortConfig.key === "first_seen" && (
                  <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                )}
              </button>
            </th>
            <th className="text-center p-3">
              <button onClick={() => {
                const key = "last_seen";
                let direction = "asc";
                if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
                setSortConfig({ key, direction });
              }} className="flex items-center space-x-1">
                <span>Days Since Contact</span>
                {sortConfig.key === "last_seen" && (
                  <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                )}
              </button>
            </th>
            <th className="text-center p-3">Actions</th>
          </tr>
          <tr className="bg-gray-100 dark:bg-gray-700">
            <th></th>
            <th></th>
            {["name","phone","tags","notes","first_seen","last_seen"].map(col => (
              <th key={col} className="p-2 text-center">
                <input
                  type="text"
                  value={columnFilters[col]}
                  onChange={e => setColumnFilters(prev => ({...prev, [col]: e.target.value}))}
                  placeholder={`Filter ${col.replace("_"," ")}`}
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
                  <img src={defaultAvatar} alt="avatar" className="w-8 h-8 rounded-full" />
                </td>
                <td className="p-3 text-left font-medium text-gray-900 dark:text-white">{cust.name}</td>
                <td className="p-3 text-center text-gray-900 dark:text-white">{cust.phone}</td>
                <td className="p-3 text-left text-sm text-gray-300">{noteEntry.tags}</td>
                <td className="p-3 text-left text-sm text-gray-300">{noteEntry.notes}</td>
                <td className="p-3 text-center text-gray-900 dark:text-white">
                  {cust.first_seen ? formatDuration(cust.first_seen) : ""}
                </td>
                <td className="p-3 text-center text-gray-900 dark:text-white">
                  {cust.last_seen ? formatRelative(cust.last_seen) : ""}
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
                    Edit
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing {(pageIndex * pageSize) + 1}–{Math.min((pageIndex + 1) * pageSize, sortedCustomers.length)} of {sortedCustomers.length} customers
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPageIndex(0); }}
            className="p-1 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {[10,20,50,100].map(size => (
              <option key={size} value={size}>{size} / page</option>
            ))}
          </select>
          <button
            onClick={() => setPageIndex(old => Math.max(old - 1, 0))}
            disabled={pageIndex === 0}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">{pageIndex + 1} / {pageCount || 1}</span>
          <button
            onClick={() => setPageIndex(old => Math.min(old + 1, pageCount - 1))}
            disabled={pageIndex >= pageCount - 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              ✏️ Edit {editingCustomer}
            </h3>

            <label className="block mb-2 font-medium text-gray-900 dark:text-gray-100">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full p-2 border rounded mb-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              placeholder="e.g. VIP, Walk-in"
            />

            <label className="block mb-2 font-medium text-gray-900 dark:text-gray-100">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border rounded mb-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              placeholder="Write any notes about this customer"
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
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}