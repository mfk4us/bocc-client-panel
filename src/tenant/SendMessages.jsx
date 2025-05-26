import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { lang } from "../lang";
import { supabase } from "../components/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function SendMessages({ language }) {
  const [rollingCount, setRollingCount] = useState(0);
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const content = "Hi"; // Add a default content or get from state if needed

  const navigate = useNavigate();

  // Fetch rolling 24h count from your backend or Supabase
  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/messages/count-24h");
        const data = await res.json();
        setRollingCount(data.count);
      } catch (err) {
        console.error(err);
      }
    }
    fetchCount();
  }, []);

  // Send a single invite
  const handleSendSingle = async () => {
    if (!phone) {
      setMessage("Please enter a phone number.");
      return;
    }
    // Prepend country code for full number and check for existing chat in last 24h
    const fullNumber = phone.replace(/^0/, "966");
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing, error: fetchErr } = await supabase
      .from("messages")
      .select("id")
      .eq("number", fullNumber)
      .gt("timestamp", cutoff)
      .limit(1);
    if (fetchErr) {
      console.error(fetchErr);
    }
    if (existing && existing.length > 0) {
      navigate(`/tenant/messages?number=${fullNumber}`);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert([{
          timestamp: new Date().toISOString(),
          type: "Farhan Khan",
          number: fullNumber,
          content: content,
          media_url: null,
          contact_name: "محمد الشجاع",
          workflow_name: "bocctest",
        }]);
      if (error) throw error;
      setMessage("Invite sent!");
      setPhone("");
    } catch (err) {
      console.error(err);
      setMessage("Error sending invite.");
    } finally {
      setLoading(false);
    }
  };

  // Send bulk from CSV
  const handleSendBulk = async () => {
    if (!file) {
      setMessage("Please select a CSV file.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const text = await file.text();
      const parsed = Papa.parse(text, { header: true });
      for (const row of parsed.data) {
        if (row.number) {
          const { error } = await supabase
            .from("messages")
            .insert([{
              timestamp: new Date().toISOString(),
              type: "Farhan Khan",
              number: row.number,
              content: row.content || content,
              media_url: null,
              contact_name: null,
              workflow_name: "bocctest",
            }]);
          if (error) console.error(error);
        }
      }
      setMessage("Bulk messages sent!");
      setFile(null);
    } catch (err) {
      console.error(err);
      setMessage("Error sending bulk messages.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
        {lang("messageCenter")}
      </h1>

      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-gray-800 dark:text-gray-200">
        <strong>{lang("businessInitiatedCount")}</strong> {rollingCount}
      </div>

      {message && (
        <div className="mb-4 text-sm text-blue-600 dark:text-blue-400">
          {message}
        </div>
      )}

      <section className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">{lang("sendSingleInvite")}</h2>
        <div>
          <input
            type="tel"
            placeholder="05XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
          />
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-sm sm:text-base text-white font-medium rounded" onClick={handleSendSingle} disabled={loading}>
            {loading ? lang("sending") : lang("send")}
          </button>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">{lang("bulkUpload")}</h2>
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
          />
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-sm sm:text-base text-white font-medium rounded" onClick={handleSendBulk} disabled={loading}>
            {loading ? lang("sending") : lang("uploadAndSend")}
          </button>
        </div>
      </section>
    </div>
  );
}