import React, { useEffect, useState } from "react";
import { supabase } from "../components/supabaseClient";
import { lang, language } from "../lang";

export default function Dashboard() {
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
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        {lang("dashboard")}
      </h2>
      <div className="bg-white dark:bg-gray-800 shadow rounded p-4">
        <p className="text-gray-800 dark:text-gray-100 font-medium">
          📦 {lang("totalMessages")}: {stats?.totalMessages || 0}
        </p>
        <p className="text-gray-800 dark:text-gray-100 font-medium">
          📩 {lang("sentToday")}: {stats?.sentToday || 0}
        </p>
      </div>
    </div>
  );
}