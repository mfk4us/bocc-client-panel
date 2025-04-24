import React, { useEffect, useState } from "react";
import { useMemo } from "react";
import { supabase } from "../components/supabaseClient";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Menu, Transition } from "@headlessui/react";
import { Combobox } from "@headlessui/react";

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-3 py-2 border">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </td>
      ))}
    </tr>
  );
}

export default function ManageTenants() {
  const [tenants, setTenants] = useState([]);
  const [filteredTenants, setFilteredTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [editTenant, setEditTenant] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  // Show/hide search input state
  const [showSearchInput, setShowSearchInput] = useState(false);
  // Inline edit state
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineEditData, setInlineEditData] = useState({});
  // Row-level saving state
  const [savingRowId, setSavingRowId] = useState(null);
  // Column filters state
  const [columnFilters, setColumnFilters] = useState({
    email: "",
    role: "",
    workflow_name: "",
    phone_number: "",
    business_name: "",
    customer_name: "",
    status: "", // now a string for text input
  });
  // Debounce effect for search input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(handler);
  }, [query]);

  const handleSearchChange = (e) => {
    setQuery(e.target.value);
  };

  // Compute unique workflow options for Combobox filter
  const workflowOptions = useMemo(
    () =>
      Array.from(
        new Set(
          tenants
            .map((t) => t.workflow_name)
            .filter((w) => w && w.length > 0)
        )
      ),
    [tenants]
  );

  // Bulk select helpers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTenants.length) setSelectedIds([]);
    else setSelectedIds(filteredTenants.map(t => t.id));
  };
  const toggleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Fetch tenants (same logic as before)
  const fetchTenants = async () => {
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        console.error("Error fetching current user:", userError?.message || "No user found.");
        return;
      }
      const currentUser = userData.user;
      setCurrentUser(currentUser);
      // Fetch full profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();
      if (profileError) {
        console.error("Error fetching user profile:", profileError.message);
        return;
      }
      const userRole = profileData?.role?.toLowerCase() || "tenant";
      localStorage.setItem("role", profileData?.role || "tenant");
      let tenantList = [];
      if (userRole === "admin") {
        const { data, error } = await supabase
          .from("profiles")
          .select("*");
        if (error) {
          console.error("Error fetching all profiles for admin:", error.message);
          return;
        }
        tenantList = data;
      } else {
        tenantList = [profileData];
      }
      setTenants(tenantList);
      setFilteredTenants(tenantList);
      // setLoading(false); // moved to finally
    } catch (err) {
      console.error("Unexpected error fetching tenants:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const q = debouncedQuery.trim().toLowerCase();
    // Combined global search + column filters
    const data = tenants.filter(t => {
      // Global search: match any column except status
      const matchesQuery =
        !q ||
        (t.email && t.email.toLowerCase().includes(q)) ||
        (t.role && t.role.toLowerCase().includes(q)) ||
        (t.workflow_name && t.workflow_name.toLowerCase().includes(q)) ||
        (t.phone_number && t.phone_number.toLowerCase().includes(q)) ||
        (t.business_name && t.business_name.toLowerCase().includes(q)) ||
        (t.customer_name && t.customer_name.toLowerCase().includes(q));
      const matchesEmail =
        !columnFilters.email ||
        t.email.toLowerCase().includes(columnFilters.email.toLowerCase());
      const matchesRole =
        !columnFilters.role ||
        t.role.toLowerCase().includes(columnFilters.role.toLowerCase());
      const matchesWorkflow =
        !columnFilters.workflow_name ||
        t.workflow_name?.toLowerCase().includes(columnFilters.workflow_name.toLowerCase());
      const matchesPhone =
        !columnFilters.phone_number ||
        t.phone_number?.toLowerCase().includes(columnFilters.phone_number.toLowerCase());
      const matchesBusiness =
        !columnFilters.business_name ||
        t.business_name?.toLowerCase().includes(columnFilters.business_name.toLowerCase());
      const matchesCustomer =
        !columnFilters.customer_name ||
        t.customer_name?.toLowerCase().includes(columnFilters.customer_name.toLowerCase());
      const matchesStatus =
        !columnFilters.status ||
        t.status.toLowerCase().includes(columnFilters.status.toLowerCase());
      return (
        matchesQuery &&
        matchesEmail &&
        matchesRole &&
        matchesWorkflow &&
        matchesPhone &&
        matchesBusiness &&
        matchesCustomer &&
        matchesStatus
      );
    });
    setFilteredTenants(data);
  }, [debouncedQuery, tenants, columnFilters]);

  const openEditModal = (tenant) => {
    setEditTenant(tenant);
    setShowModal(true);
  };

  // Bulk action handlers
  const handleBulkActivate = async () => {
    if (selectedIds.length === 0) return;
    const { error } = await supabase
      .from("profiles")
      .update({ status: "active" })
      .in("id", selectedIds);
    if (error) {
      toast.error("Failed to activate tenants.");
    } else {
      toast.success("Selected tenants activated.");
      setSelectedIds([]);
      fetchTenants();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} tenants? This cannot be undone.`)) return;
    const { error } = await supabase
      .from("profiles")
      .delete()
      .in("id", selectedIds);
    if (error) {
      toast.error("Failed to delete tenants.");
    } else {
      toast.success("Selected tenants deleted.");
      setSelectedIds([]);
      fetchTenants();
    }
  };

  const handleExportCSV = () => {
    const rows = filteredTenants.filter(t => selectedIds.includes(t.id));
    if (rows.length === 0) return;
    const header = ["Email","Role","Workflow","Phone","Business","Customer","Status"];
    const csv = [
      header.join(","),
      ...rows.map(r =>
        [
          r.email,
          r.role,
          r.workflow_name,
          r.phone_number,
          r.business_name,
          r.customer_name,
          r.status,
        ].map(field => `"${(field||"").replace(/"/g,'""')}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tenants_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export selected rows to Excel
  const handleExportXLSX = () => {
    const rows = filteredTenants.filter(t => selectedIds.includes(t.id));
    if (rows.length === 0) return;
    const header = ["Email","Role","Workflow","Phone","Business","Customer","Status"];
    const data = rows.map(r => [
      r.email, r.role, r.workflow_name, r.phone_number,
      r.business_name, r.customer_name, r.status
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tenants");
    XLSX.writeFile(wb, "tenants_export.xlsx");
  };

  // Export selected rows to PDF
  const handleExportPDF = () => {
    const rows = filteredTenants.filter(t => selectedIds.includes(t.id));
    if (rows.length === 0) return;
    const header = ["Email","Role","Workflow","Phone","Business","Customer","Status"];
    const body = rows.map(r => [
      r.email, r.role, r.workflow_name, r.phone_number,
      r.business_name, r.customer_name, r.status
    ]);
    const doc = new jsPDF();
    doc.autoTable({ head: [header], body });
    doc.save("tenants_export.pdf");
  };

  // Compute pagedTenants for pagination
  const pagedTenants = filteredTenants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // When filters/search change, reset to first page
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, columnFilters]);

  return (
    <>
      <ToastContainer position="top-right" />
      <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
        <header className="relative flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              🔧 Manage Tenants
            </h1>
            <button
              onClick={() => { setLoading(true); fetchTenants(); }}
              disabled={loading}
              title="Refresh Data"
              className={`relative inline-flex items-center justify-center w-10 h-10 ml-4 
    bg-gradient-to-br from-indigo-500 to-purple-600 
    rounded-full shadow-xl hover:shadow-2xl transition-transform transform 
    ${loading ? 'opacity-50 cursor-wait' : 'hover:-translate-y-0.5'}
    focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-purple-700`}
            >
              <svg
                className={`w-6 h-6 text-white ${loading ? 'animate-spin' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                <circle cx="12" cy="12" r="6" />
              </svg>
            </button>
            <button
              onClick={() => {
                setEditTenant({
                  id: null,
                  email: "",
                  role: "tenant",
                  workflow_name: "",
                  phone_number: "",
                  business_name: "",
                  customer_name: "",
                  status: "active",
                });
                setShowModal(true);
              }}
              className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              ➕ Add Tenant
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowSearchInput(prev => !prev)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                aria-label="Toggle search"
                title="Search"
              >
                🔍
              </button>
              {showSearchInput && (
                <input
                  type="text"
                  placeholder="Search…"
                  className="absolute top-1/2 right-0 transform -translate-y-1/2 w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-lg"
                  value={query}
                  onChange={handleSearchChange}
                  aria-label="Search tenants"
                />
              )}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto relative">
          {/* Table mode for sm+ screens */}
          <div className="hidden sm:block">
            {selectedIds.length > 0 && (
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800 border-b border-gray-200 dark:border-gray-700">
                <span className="text-indigo-700 dark:text-indigo-300 font-medium">
                  {selectedIds.length} selected
                </span>
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
                    Export
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-black/10 dark:ring-white/10">
                    {[
                      ["Export CSV", handleExportCSV],
                      ["Export XLSX", handleExportXLSX],
                      ["Export PDF", handleExportPDF],
                    ].map(([label, handler]) => (
                      <Menu.Item key={label}>
                        {({ active }) => (
                          <button
                            onClick={handler}
                            className={`flex items-center w-full px-4 py-2 text-sm font-medium ${
                              active ? "bg-gray-100 dark:bg-gray-700" : ""
                            } text-gray-700 dark:text-gray-200`}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
                            {label}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </Menu>
              </div>
            )}
            {loading ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <th key={i} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredTenants.length && filteredTenants.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
                    {["Customer","Email","Role","Workflow","Phone","Business","Status","Actions"].map(col => (
                      <th key={col} className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                        {col}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-white dark:bg-gray-900">
                    <th className="px-4 py-1 text-center"></th>
                    <th className="px-4 py-1 text-center"></th>
                    {/* Customer filter */}
                    <th className="px-4 py-1 text-center">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Filter Customer"
                          value={columnFilters.customer_name}
                          onChange={e =>
                            setColumnFilters({ ...columnFilters, customer_name: e.target.value })
                          }
                          className="w-full pr-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                        {columnFilters.customer_name && (
                          <button
                            type="button"
                            onClick={() =>
                              setColumnFilters({ ...columnFilters, customer_name: "" })
                            }
                            className="absolute inset-y-0 right-2 flex items-center justify-center text-red-500 hover:text-red-700 text-base"
                            tabIndex={-1}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </th>
                    {/* Email filter */}
                    <th className="px-4 py-1 text-center">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Filter Email"
                          value={columnFilters.email}
                          onChange={e =>
                            setColumnFilters({ ...columnFilters, email: e.target.value })
                          }
                          className="w-full pr-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                        {columnFilters.email && (
                          <button
                            type="button"
                            onClick={() =>
                              setColumnFilters({ ...columnFilters, email: "" })
                            }
                            className="absolute inset-y-0 right-2 flex items-center justify-center text-red-500 hover:text-red-700 text-base"
                            tabIndex={-1}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </th>
                    {/* Role filter */}
                    <th className="px-4 py-1 text-center">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Filter Role"
                          value={columnFilters.role}
                          onChange={e =>
                            setColumnFilters({ ...columnFilters, role: e.target.value })
                          }
                          className="w-full pr-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                        {columnFilters.role && (
                          <button
                            type="button"
                            onClick={() =>
                              setColumnFilters({ ...columnFilters, role: "" })
                            }
                            className="absolute inset-y-0 right-2 flex items-center justify-center text-red-500 hover:text-red-700 text-base"
                            tabIndex={-1}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </th>
                    {/* Workflow filter */}
                    <th className="px-4 py-1 text-center">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Filter Workflow"
                          value={columnFilters.workflow_name}
                          onChange={e =>
                            setColumnFilters({ ...columnFilters, workflow_name: e.target.value })
                          }
                          className="w-full pr-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                        {columnFilters.workflow_name && (
                          <button
                            type="button"
                            onClick={() =>
                              setColumnFilters({ ...columnFilters, workflow_name: "" })
                            }
                            className="absolute inset-y-0 right-2 flex items-center justify-center text-red-500 hover:text-red-700 text-base"
                            tabIndex={-1}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </th>
                    {/* Phone filter */}
                    <th className="px-4 py-1 text-center">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Filter Phone"
                          value={columnFilters.phone_number}
                          onChange={e =>
                            setColumnFilters({ ...columnFilters, phone_number: e.target.value })
                          }
                          className="w-full pr-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                        {columnFilters.phone_number && (
                          <button
                            type="button"
                            onClick={() =>
                              setColumnFilters({ ...columnFilters, phone_number: "" })
                            }
                            className="absolute inset-y-0 right-2 flex items-center justify-center text-red-500 hover:text-red-700 text-base"
                            tabIndex={-1}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </th>
                    {/* Business filter */}
                    <th className="px-4 py-1 text-center">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Filter Business"
                          value={columnFilters.business_name}
                          onChange={e =>
                            setColumnFilters({ ...columnFilters, business_name: e.target.value })
                          }
                          className="w-full pr-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                        {columnFilters.business_name && (
                          <button
                            type="button"
                            onClick={() =>
                              setColumnFilters({ ...columnFilters, business_name: "" })
                            }
                            className="absolute inset-y-0 right-2 flex items-center justify-center text-red-500 hover:text-red-700 text-base"
                            tabIndex={-1}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </th>
                    {/* Status filter */}
                    <th className="px-4 py-1 text-center">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Filter Status"
                          value={columnFilters.status}
                          onChange={e =>
                            setColumnFilters({ ...columnFilters, status: e.target.value })
                          }
                          className="w-full pr-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                        {columnFilters.status && (
                          <button
                            type="button"
                            onClick={() =>
                              setColumnFilters({ ...columnFilters, status: "" })
                            }
                            className="absolute inset-y-0 right-2 flex items-center justify-center text-red-500 hover:text-red-700 text-base"
                            tabIndex={-1}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-1 text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-gray-600 dark:text-gray-400">
                        <div className="text-6xl mb-4">🗃️</div>
                        No tenants match your filters.
                      </td>
                    </tr>
                  ) : (
                    pagedTenants.map((t, idx) => (
                      <tr
                        key={t.id}
                        className="hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        onDoubleClick={() => {
                          setInlineEditId(t.id);
                          setInlineEditData({ ...t });
                        }}
                      >
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(t.id)}
                            onChange={() => toggleSelectOne(t.id)}
                          />
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-200">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          {inlineEditId === t.id ? (
                            <input
                              type="text"
                              value={inlineEditData.customer_name || ""}
                              onChange={e =>
                                setInlineEditData({ ...inlineEditData, customer_name: e.target.value })
                              }
                              className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
                            />
                          ) : (
                            t.customer_name
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {inlineEditId === t.id ? (
                            <input
                              type="text"
                              value={inlineEditData.email || ""}
                              onChange={e =>
                                setInlineEditData({ ...inlineEditData, email: e.target.value })
                              }
                              className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
                            />
                          ) : (
                            t.email
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {inlineEditId === t.id ? (
                            <input
                              type="text"
                              value={inlineEditData.role || ""}
                              onChange={e =>
                                setInlineEditData({ ...inlineEditData, role: e.target.value })
                              }
                              className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
                            />
                          ) : (
                            t.role
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {inlineEditId === t.id ? (
                            <input
                              type="text"
                              value={inlineEditData.workflow_name || ""}
                              onChange={e =>
                                setInlineEditData({ ...inlineEditData, workflow_name: e.target.value })
                              }
                              className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
                            />
                          ) : (
                            t.workflow_name
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {inlineEditId === t.id ? (
                            <input
                              type="text"
                              value={inlineEditData.phone_number || ""}
                              onChange={e =>
                                setInlineEditData({ ...inlineEditData, phone_number: e.target.value })
                              }
                              className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
                            />
                          ) : (
                            t.phone_number
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {inlineEditId === t.id ? (
                            <input
                              type="text"
                              value={inlineEditData.business_name || ""}
                              onChange={e =>
                                setInlineEditData({ ...inlineEditData, business_name: e.target.value })
                              }
                              className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
                            />
                          ) : (
                            t.business_name
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {inlineEditId === t.id ? (
                            <select
                              value={inlineEditData.status || "inactive"}
                              onChange={e =>
                                setInlineEditData({ ...inlineEditData, status: e.target.value })
                              }
                              className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          ) : (
                            <span className={`inline-block min-w-[4rem] px-3 py-1 text-sm rounded-full ${
                              t.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {t.status || 'inactive'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {savingRowId === t.id ? (
                            <span className="inline-flex items-center text-sm text-gray-500">
                              <svg className="w-4 h-4 mr-1 animate-spin" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                              </svg>
                              Saving...
                            </span>
                          ) : inlineEditId === t.id ? (
                            <>
                              <button
                                onClick={async () => {
                                  const tenantToUpdate = inlineEditData;
                                  setSavingRowId(tenantToUpdate.id);
                                  // update existing
                                  const { error } = await supabase
                                    .from("profiles")
                                    .update({
                                      role: tenantToUpdate.role,
                                      workflow_name: tenantToUpdate.workflow_name,
                                      phone_number: tenantToUpdate.phone_number,
                                      business_name: tenantToUpdate.business_name,
                                      customer_name: tenantToUpdate.customer_name,
                                      status: tenantToUpdate.status,
                                    })
                                    .eq("id", tenantToUpdate.id)
                                    .select();
                                  if (!error) {
                                    setShowModal(false);
                                    setInlineEditId(null);
                                    fetchTenants();
                                    toast.success("Changes saved.");
                                  } else {
                                    toast.error("Failed to save changes.");
                                    console.error("Update failed:", error);
                                  }
                                  setSavingRowId(null);
                                }}
                                className="text-green-600 hover:text-green-800 mr-2"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setInlineEditId(null)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button onClick={() => {
                              setInlineEditId(t.id);
                              setInlineEditData({ ...t });
                            }} className="text-indigo-600 hover:text-indigo-800">
                              ✏️
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
          {/* Card mode for mobile screens */}
          <div className="block sm:hidden p-4 space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse h-24 bg-gray-100 dark:bg-gray-800 rounded-md"></div>
              ))
            ) : filteredTenants.length === 0 ? (
              <div className="text-center text-gray-600 dark:text-gray-400">
                <div className="text-4xl mb-2">🗃️</div>
                No tenants match your filters.
              </div>
            ) : (
              pagedTenants.map(t => (
                <div key={t.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">{t.email}</span>
                    <span className={`px-2 py-0.5 rounded-full text-sm ${t.status==="active"?"bg-green-100 text-green-800":"bg-red-100 text-red-800"}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <div><strong>Role:</strong> {t.role}</div>
                    {t.workflow_name && <div><strong>Workflow:</strong> {t.workflow_name}</div>}
                    {t.phone_number && <div><strong>Phone:</strong> {t.phone_number}</div>}
                    {t.business_name && <div><strong>Business:</strong> {t.business_name}</div>}
                    {t.customer_name && <div><strong>Customer:</strong> {t.customer_name}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Sticky pagination footer */}
        <footer className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
          {/* Left: total count */}
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Showing {filteredTenants.length} tenants
          </span>
          {/* Middle: prev / page / next */}
          <div className="flex-1 flex justify-center items-center space-x-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(p-1,1))}
              disabled={currentPage === 1}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ◀️
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage(p => p+1)}
              disabled={filteredTenants.length <= currentPage * itemsPerPage}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ▶️
            </button>
          </div>
          {/* Right: rows-per-page selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Rows per page:</label>
            <select
              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
              value={itemsPerPage}
              onChange={e => setItemsPerPage(+e.target.value)}
            >
              {[10,20,50,100,500,1000].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </footer>
      </div>
      {showModal && editTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full space-y-4">
            <h3 className="text-lg font-semibold mb-2">
              {editTenant?.id ? "Edit Tenant" : "Add New Tenant"}
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <input
                className="p-2 border border-gray-300 rounded bg-white dark:bg-gray-700"
                value={editTenant.email || ""}
                onChange={(e) => setEditTenant({ ...editTenant, email: e.target.value })}
                placeholder="Email"
              />
              <select
                className="p-2 border border-gray-300 rounded bg-white dark:bg-gray-700"
                value={editTenant.role}
                onChange={(e) => setEditTenant({ ...editTenant, role: e.target.value })}
              >
                <option value="tenant">Tenant</option>
                <option value="admin">Admin</option>
              </select>
              <input
                className="p-2 border border-gray-300 rounded bg-white dark:bg-gray-700"
                value={editTenant.workflow_name || ""}
                onChange={(e) => setEditTenant({ ...editTenant, workflow_name: e.target.value })}
                placeholder="Workflow"
              />
              <input
                className="p-2 border border-gray-300 rounded bg-white dark:bg-gray-700"
                value={editTenant.phone_number || ""}
                onChange={(e) => setEditTenant({ ...editTenant, phone_number: e.target.value })}
                placeholder="Phone"
              />
              <input
                className="p-2 border border-gray-300 rounded bg-white dark:bg-gray-700"
                value={editTenant.business_name || ""}
                onChange={(e) => setEditTenant({ ...editTenant, business_name: e.target.value })}
                placeholder="Business Name"
              />
              <input
                className="p-2 border border-gray-300 rounded bg-white dark:bg-gray-700"
                value={editTenant.customer_name || ""}
                onChange={(e) => setEditTenant({ ...editTenant, customer_name: e.target.value })}
                placeholder="Customer Name"
              />
              <select
                className="p-2 border border-gray-300 rounded bg-white dark:bg-gray-700"
                value={editTenant.status || "inactive"}
                onChange={(e) => setEditTenant({ ...editTenant, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={async () => {
                  const tenantToUpdate = editTenant;
                  setSavingRowId(tenantToUpdate.id);
                  if (!tenantToUpdate.id) {
                    // Ensure workflow_name is present and not empty after trimming
                    const workflowName = tenantToUpdate.workflow_name?.trim() || "";
                    if (!workflowName) {
                      toast.error("Workflow name is required.");
                      setSavingRowId(null);
                      return;
                    }
                    // Only include required fields, do NOT include id
                    const newTenant = {
                      email: tenantToUpdate.email?.trim() || `user_${Date.now()}@example.com`,
                      role: tenantToUpdate.role || "tenant",
                      workflow_name: workflowName,
                      phone_number: tenantToUpdate.phone_number || "",
                      business_name: tenantToUpdate.business_name || "",
                      customer_name: tenantToUpdate.customer_name || "",
                      status: tenantToUpdate.status || "active",
                    };
                    const { data, error } = await supabase
                      .from("profiles")
                      .insert([newTenant]);
                    if (!error) {
                      setShowModal(false);
                      setInlineEditId(null);
                      fetchTenants();
                      toast.success("Tenant added.");
                    } else {
                      toast.error("Failed to add tenant.");
                      console.error("Insert failed:", error);
                    }
                    setSavingRowId(null);
                  } else {
                    const { error } = await supabase
                      .from("profiles")
                      .update({
                        role: tenantToUpdate.role,
                        workflow_name: tenantToUpdate.workflow_name,
                        phone_number: tenantToUpdate.phone_number,
                        business_name: tenantToUpdate.business_name,
                        customer_name: tenantToUpdate.customer_name,
                        status: tenantToUpdate.status,
                      })
                      .eq("id", tenantToUpdate.id)
                      .select();
                    if (!error) {
                      setShowModal(false);
                      setInlineEditId(null);
                      fetchTenants();
                      toast.success("Changes saved.");
                    } else {
                      toast.error("Failed to save changes.");
                      console.error("Update failed:", error);
                    }
                    setSavingRowId(null);
                  }
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full space-y-4">
            <h3 className="text-lg font-semibold">Confirm Delete</h3>
            <p>Are you sure you want to delete <strong>{confirmDelete.email}</strong>?</p>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                onClick={async () => {
                  const { error } = await supabase
                    .from("profiles")
                    .delete()
                    .eq("id", confirmDelete.id);
                  if (!error) {
                    setConfirmDelete(null);
                    setShowModal(false);
                    const updatedList = tenants.filter((t) => t.id !== confirmDelete.id);
                    setTenants(updatedList);
                    setFilteredTenants(updatedList);
                  } else {
                    console.error("Delete failed:", error.message);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
