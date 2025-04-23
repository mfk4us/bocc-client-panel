// src/tenant/Bookings.jsx
import { useEffect, useState } from "react";
import { supabase } from "../components/supabaseClient";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import "react-datepicker/dist/react-datepicker.css";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const workflowName = localStorage.getItem("workflow");

  useEffect(() => {
    const fetchBookings = async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          date,
          customers ( name, number ),
          services ( title ),
          employees ( name )
        `)
        .eq("workflow_name", workflowName);

      if (!error) setBookings(data || []);
    };

    fetchBookings();
  }, [workflowName]);

  const calendarEvents = bookings.map((b) => ({
    title: `${b.customers?.name || "Customer"} - ${b.services?.title || "Service"}`,
    date: b.date,
  }));

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">📅 Bookings</h2>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
          onClick={() => setViewMode(viewMode === "calendar" ? "table" : "calendar")}
        >
          Switch to {viewMode === "calendar" ? "Table" : "Calendar"} View
        </button>
      </div>

      {viewMode === "calendar" ? (
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={calendarEvents}
          height="auto"
        />
      ) : (
        <>
          {bookings.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 mt-4">No bookings found.</p>
          )}
          {bookings.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border border-gray-300 dark:border-gray-600">
                <thead className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                  <tr className="hover:bg-gray-100 dark:hover:bg-gray-700">
                    <th className="p-2 border border-gray-300 dark:border-gray-600">Date</th>
                    <th className="p-2 border border-gray-300 dark:border-gray-600">Customer</th>
                    <th className="p-2 border border-gray-300 dark:border-gray-600">Service</th>
                    <th className="p-2 border border-gray-300 dark:border-gray-600">Staff</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                      <td className="p-2 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100">{b.date?.split("T")[0]}</td>
                      <td className="p-2 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100">{b.customers?.name || "—"}</td>
                      <td className="p-2 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100">{b.services?.title || "—"}</td>
                      <td className="p-2 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100">{b.employees?.name || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}