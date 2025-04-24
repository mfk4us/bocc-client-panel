import React, { useEffect, useState } from "react";
import { supabase } from "../components/supabaseClient";

export default function ManagePages() {
  const [pages, setPages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editRow, setEditRow] = useState(null);

  useEffect(() => {
    supabase
      .from("tenant_pages")
      .select("*")
      .then(({ data }) => setPages(data || []));
  }, []);

  const pageKeys = [
    "dashboard",
    "messages",
    "customers",
    "profile",
    "bookings",
    "topup",
    "analytics",
    "notifications",
    "team",
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🔧 Manage Tenant Page Access</h2>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search workflows..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded w-64"
        />
      </div>

      <div className="overflow-auto">
        <table className="w-full table-auto border">
          <thead>
            <tr>
              <th className="p-2 border">Tenant</th>
              {pageKeys.map(key => (
                <th key={key} className="p-2 border capitalize">{key}</th>
              ))}
              <th className="p-2 border">Edit Access</th>
            </tr>
          </thead>
          <tbody>
            {pages
              .filter(p => p.workflow_name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-2 border font-medium">{p.workflow_name}</td>
                  {pageKeys.map(key => (
                    <td key={key} className="p-2 border text-center">
                      {p[key] ? "Yes" : "No"}
                    </td>
                  ))}
                  <td className="p-2 border text-center">
                    <button
                      onClick={() => setEditRow(p)}
                      className="text-blue-600 hover:underline"
                    >
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {editRow && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded p-6 w-[500px]">
              <h3 className="text-xl font-semibold mb-4">Edit Access for <span className="text-blue-600">{editRow.workflow_name}</span></h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {pageKeys.map((key) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editRow[key]}
                      onChange={() =>
                        setEditRow((prev) => ({ ...prev, [key]: !prev[key] }))
                      }
                      className="h-5 w-5"
                    />
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditRow(null)}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const update = Object.fromEntries(
                      pageKeys.map(k => [k, editRow[k]])
                    );
                    await supabase
                      .from("tenant_pages")
                      .update(update)
                      .eq("id", editRow.id);
                    setPages(pages.map(p => p.id === editRow.id ? { ...p, ...update } : p));
                    setEditRow(null);
                  }}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}