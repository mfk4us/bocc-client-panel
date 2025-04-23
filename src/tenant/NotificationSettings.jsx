import React, { useEffect, useState } from "react";
import { supabase } from "../components/supabaseClient"; // ✅

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    ai_suggestions: true,
    low_balance_alert: true,
    email_notifications: true,
  });

  const [loading, setLoading] = useState(false);
  const workflowName = localStorage.getItem("workflow");

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("tenant_settings")
        .select("ai_suggestions, low_balance_alert, email_notifications")
        .eq("workflow_name", workflowName)
        .single();

      if (data) {
        setSettings({
          ai_suggestions: data.ai_suggestions,
          low_balance_alert: data.low_balance_alert,
          email_notifications: data.email_notifications,
        });
      }
    };

    fetchSettings();
  }, [workflowName]);

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("tenant_settings")
      .upsert({ workflow_name: workflowName, ...settings });

    if (!error) alert("Settings updated!");
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">🔔 Notification Settings</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="font-medium text-gray-800 dark:text-gray-100">AI Suggested Replies</label>
          <input
            type="checkbox"
            checked={settings.ai_suggestions}
            onChange={() => handleToggle("ai_suggestions")}
            className="w-5 h-5"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="font-medium text-gray-800 dark:text-gray-100">Low Balance Alert</label>
          <input
            type="checkbox"
            checked={settings.low_balance_alert}
            onChange={() => handleToggle("low_balance_alert")}
            className="w-5 h-5"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="font-medium text-gray-800 dark:text-gray-100">Email Notifications</label>
          <input
            type="checkbox"
            checked={settings.email_notifications}
            onChange={() => handleToggle("email_notifications")}
            className="w-5 h-5"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-400"
      >
        {loading ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}