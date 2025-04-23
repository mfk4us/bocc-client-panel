import React, { useEffect, useState } from "react";
import { supabase } from "../components/supabaseClient"; // ✅
// import { exportToCSV } from "../utils/export";
import { format } from "date-fns";

export default function Messages() {
  const [chats, setChats] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const workflowName = localStorage.getItem("workflow");

  useEffect(() => {
    const fetchChats = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("workflow_name", workflowName)
        .order("timestamp", { ascending: sortOrder === "asc" });

      if (error) console.error("Error fetching chats:", error);
      else setChats(data);
    };

    fetchChats();

    const subscription = supabase
      .channel("realtime:messages")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "messages",
      }, (payload) => {
        if (payload.new.workflow_name === workflowName) {
          setChats((prev) => [payload.new, ...prev]);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [sortOrder, workflowName]);

  const filteredChats = chats.filter((chat) =>
    chat.number?.includes(searchTerm)
  );

  const paginatedChats = filteredChats.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Search by customer number"
          className="border rounded px-3 py-2 mr-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() =>
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
          }
        >
          Sort: {sortOrder.toUpperCase()}
        </button>
      </div>

      {paginatedChats.map((chat) => (
        <div key={chat.id} className="mb-6 border rounded p-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-green-700">{chat.number}</h3>
            <button
              onClick={() => exportToCSV([chat], `${chat.number}_chat.csv`)}
              className="text-sm text-blue-500 hover:underline"
            >
              Export Chat
            </button>
          </div>
          <div className="space-y-2">
            {Array.isArray(chat.messages) ? (
              chat.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg max-w-lg ${
                    msg.sender === "customer"
                      ? "bg-gray-100 dark:bg-gray-700 text-left text-gray-800 dark:text-gray-100"
                      : "bg-green-100 dark:bg-green-700 text-right text-gray-800 dark:text-gray-100 ml-auto"
                  }`}
                >
                  <div>{msg.text}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {format(new Date(msg.timestamp), "PPpp")}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 dark:text-gray-500 italic">No messages found</p>
            )}
          </div>
        </div>
      ))}

      {/* Pagination Controls */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="px-3 py-1 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
        >
          Previous
        </button>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page * pageSize >= filteredChats.length}
          className="px-3 py-1 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
        >
          Next
        </button>
      </div>
    </div>
  );
}