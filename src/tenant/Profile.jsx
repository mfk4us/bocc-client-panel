import React, { useState, useEffect } from "react";
import { supabase } from "../components/supabaseClient";

export default function Profile() {
  const [form, setForm] = useState({
    business_name: "",
    services: "",
    working_hours: "",
    employees: 1,
    preferences: "",
  });
  const [loading, setLoading] = useState(false);
  const workflowName = localStorage.getItem("workflow");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("workflow_name", workflowName)
        .single();
      if (data) setForm(data);
    };
    fetchProfile();
  }, [workflowName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    await supabase.from("profiles").update(form).eq("workflow_name", workflowName);
    setLoading(false);
    alert("Profile saved!");
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded shadow text-gray-800 dark:text-gray-100">
      <h2 className="text-xl font-bold mb-4">🧾 Tenant Profile</h2>
      {["business_name", "services", "working_hours", "preferences"].map((field) => (
        <input
          key={field}
          name={field}
          value={form[field]}
          onChange={handleChange}
          placeholder={field.replace("_", " ")}
          className="w-full p-2 border rounded mb-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />
      ))}
      <input
        type="number"
        name="employees"
        value={form.employees}
        onChange={handleChange}
        placeholder="Number of employees"
        className="w-full p-2 border rounded mb-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
      />
      <button
        onClick={handleSave}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700"
      >
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}