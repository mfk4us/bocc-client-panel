import React, { useEffect, useState } from "react";
import { supabase } from "../components/supabaseClient"; // ✅
// import { format } from "date-fns";
import { Transition } from "@headlessui/react";

export default function Analytics() {
  const [messages, setMessages] = useState([]);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [show, setShow] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      const workflow = localStorage.getItem("workflow_name");

      if (!workflow) return;

      let query = supabase.from("messages").select("*").eq("workflow_name", workflow);

      if (dateRange.from && dateRange.to) {
        query = query.gte("timestamp", dateRange.from).lte("timestamp", dateRange.to);
      }

      const { data, error } = await query;
      if (data) setMessages(data);
    };

    fetchMessages();
  }, [dateRange]);

  const groupedByDate = messages.reduce((acc, msg) => {
    const date = msg.timestamp?.split("T")[0];
    if (!acc[date]) acc[date] = 0;
    acc[date]++;
    return acc;
  }, {});

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
        📈 Chat Analytics
      </h2>

      <div className="flex items-center gap-4 mb-6">
        <input
          type="date"
          value={dateRange.from}
          onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
          className="border p-2 rounded shadow-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
        />
        <input
          type="date"
          value={dateRange.to}
          onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
          className="border p-2 rounded shadow-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
        />
        <button
          onClick={() => setShow(!show)}
          className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          {show ? "Hide" : "Show"} Trends
        </button>
      </div>

      <Transition
        show={show}
        enter="transition-opacity duration-500"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="space-y-3">
          {Object.entries(groupedByDate).map(([date, count]) => (
            <div
              key={date}
              className="flex justify-between bg-white dark:bg-gray-800 p-4 rounded shadow-md"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">{new Date(date).toLocaleDateString()}</span>
              <span className="text-blue-700 dark:text-blue-400 font-semibold">{count} messages</span>
            </div>
          ))}
        </div>
      </Transition>
    </div>
  );
}