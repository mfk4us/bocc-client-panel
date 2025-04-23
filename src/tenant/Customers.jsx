import { useEffect, useState } from "react";
import { supabase } from "../components/supabaseClient";


export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const workflowName = localStorage.getItem("workflow");

  useEffect(() => {
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from("customer_notes")
        .select("*")
        .eq("workflow_name", workflowName);

      if (!error) setCustomers(data || []);
    };

    fetchNotes();
  }, [workflowName]);

  const handleSave = async () => {
    const existing = customers.find((c) => c.customer_number === editingCustomer);

    if (existing) {
      const { error } = await supabase
        .from("customer_notes")
        .update({ notes, tags })
        .eq("id", existing.id);

      if (!error) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === existing.id ? { ...c, notes, tags } : c
          )
        );
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
        setCustomers((prev) => [...prev, ...data]);
      }
    }

    setEditingCustomer(null);
    setNotes("");
    setTags("");
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">📁 Customer Notes & Tags</h2>

      <table className="w-full table-auto bg-white dark:bg-gray-900 rounded shadow-sm">
        <thead className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white">
          <tr>
            <th className="text-left p-3">Customer Number</th>
            <th className="text-left p-3">Tags</th>
            <th className="text-left p-3">Notes</th>
            <th className="text-left p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((cust) => (
            <tr key={cust.id} className="border-t hover:bg-gray-100 dark:hover:bg-gray-800">
              <td className="p-3 font-medium text-gray-900 dark:text-white">{cust.customer_number}</td>
              <td className="p-3 text-sm text-gray-300">{cust.tags}</td>
              <td className="p-3 text-sm text-gray-300">{cust.notes}</td>
              <td className="p-3">
                <button
                  onClick={() => {
                    setEditingCustomer(cust.customer_number);
                    setNotes(cust.notes || "");
                    setTags(cust.tags || "");
                  }}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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