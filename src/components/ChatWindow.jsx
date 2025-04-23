import React from "react";
import { format } from "date-fns";

export default function ChatWindow({ customerNumber, messages }) {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-100 dark:bg-gray-900 p-4 shadow rounded mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          💬 Chat with: <span className="text-green-700 dark:text-green-400">{customerNumber}</span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 bg-gray-50 dark:bg-gray-800 rounded border dark:border-gray-700">
        {messages?.length > 0 ? (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "customer" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[75%] p-3 rounded-lg shadow text-sm ${
                  msg.sender === "customer"
                    ? "bg-white border text-gray-800 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    : "bg-green-50 text-green-900 dark:bg-green-900 dark:text-green-100"
                }`}
              >
                <div>{msg.text}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  {format(new Date(msg.timestamp), "PPpp")}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-400 dark:text-gray-500 py-8">No messages yet</div>
        )}
      </div>
    </div>
  );
}