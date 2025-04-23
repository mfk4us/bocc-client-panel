import React from "react";
import { format } from "date-fns";

export default function MessageBubble({ msg }) {
  const isCustomer = msg.sender === "customer";

  return (
    <div
      className={`max-w-xs md:max-w-md lg:max-w-lg break-words p-3 rounded-lg shadow-sm text-sm ${
        isCustomer
          ? "bg-gray-100 dark:bg-gray-800 text-left text-gray-800 dark:text-gray-100"
          : "bg-green-100 dark:bg-green-800 text-right ml-auto text-gray-800 dark:text-gray-100"
      }`}
    >
      <div>{msg.text}</div>
      {msg.timestamp && (
        <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">
          {format(new Date(msg.timestamp), "PPpp")}
        </div>
      )}
    </div>
  );
}