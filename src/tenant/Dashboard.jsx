import React, { useEffect, useState } from "react";
import { supabase } from "../components/supabaseClient";
import { lang } from "../lang";

export default function Dashboard({ language }) {
  const [stats, setStats] = useState({ totalMessages: 0, sentToday: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const workflow = localStorage.getItem("workflow");

      if (!workflow) return;

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("workflow_name", workflow);

      if (!error && data) {
        const today = new Date().toISOString().split("T")[0];
        const sentToday = data.filter((msg) =>
          msg.timestamp?.startsWith(today)
        ).length;

        setStats({
          totalMessages: data.length,
          sentToday,
        });
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-4">
      <h1
        className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white truncate flex items-center gap-2 mb-4"
        style={{ minWidth: 0 }}
      >
        <span role="img" aria-label="Dashboard" className="w-8 h-8">📊</span>
        {lang("dashboard", language)}
      </h1>
      <div className="bg-white dark:bg-gray-800 shadow rounded p-4">
        <p className="text-gray-800 dark:text-gray-100 font-medium">
          📦 {lang("totalMessages", language)}: {stats?.totalMessages || 0}
        </p>
        <p className="text-gray-800 dark:text-gray-100 font-medium">
          📩 {lang("sentToday", language)}: {stats?.sentToday || 0}
        </p>
      </div>
    </div>
  );
}