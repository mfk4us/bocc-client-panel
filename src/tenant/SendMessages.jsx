import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { lang } from "../lang";
import { supabase } from "../components/supabaseClient";
import { API_BASE_URL, TEMPLATE_WEBHOOK_URL } from "../config";
import { useNavigate } from "react-router-dom";

export default function SendMessages({ language }) {
  const [rollingCount, setRollingCount] = useState(0);
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [fetchingTemplates, setFetchingTemplates] = useState(false);
  const [fetchTemplatesError, setFetchTemplatesError] = useState(null);

  const [userName, setUserName] = useState("Unknown User");
  const [workflowName, setWorkflowName] = useState("defaultWorkflow");

  // Helpers for preview and header type
  const selectedTemplateObj = templates.find(t => t.name === selectedTemplate);

  let bodyText = "";
  let headerType = null;

  if (selectedTemplateObj) {
    const bodyComp = selectedTemplateObj.components?.find(c => c.type === "BODY");
    bodyText = bodyComp ? bodyComp.text : "";

    const headerComp = selectedTemplateObj.components?.find(c => c.type === "HEADER");
    headerType = headerComp ? headerComp.format : null; // IMAGE, VIDEO, DOCUMENT, TEXT, or null
  }
  const content = "Hi"; // Add a default content or get from state if needed

  const navigate = useNavigate();

  useEffect(() => {
    const user = supabase.auth.user();
    if (user) {
      setUserName(user.user_metadata?.full_name || "Unknown User");
      setWorkflowName(user.app_metadata?.workflow_name || "defaultWorkflow");
    }
  }, []);

  // Fetch rolling 24h count from your backend or Supabase
  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch(`${API_BASE_URL}/messages/count-24h`);
        const data = await res.json();
        setRollingCount(data.count);
      } catch (err) {
        console.error(err);
      }
    }
    fetchCount();
  }, []);

  // Fetch available WhatsApp templates from your backend
  async function fetchTemplates() {
    setFetchingTemplates(true);
    setFetchTemplatesError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/templates`);
      if (!res.ok) throw new Error(`Failed to fetch templates: ${res.statusText}`);
      const json = await res.json();
      setTemplates(json.templates);
      setMessage("");
    } catch (err) {
      console.error("Error loading templates:", err);
      setFetchTemplatesError(lang("failedToLoadTemplates", language) || "Failed to load WhatsApp templates. Please check your connection or contact support.");
      setTemplates([]); // Clear templates so dropdown is empty and error is clear
    } finally {
      setFetchingTemplates(false);
    }
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Send a single invite
  const handleSendSingle = async () => {
    if (!phone) {
      setMessage(lang("pleaseEnterPhone", language) || "Please enter a phone number.");
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
          type: userName,
          number: fullNumber,
          content: content,
          media_url: null,
          contact_name: null,
          workflow_name: workflowName,
        }]);
      if (error) throw error;
      setMessage(lang("inviteSent", language) || "Invite sent!");
      setPhone("");
    } catch (err) {
      console.error(err);
      setMessage(lang("errorSendingInvite", language) || "Error sending invite.");
    } finally {
      setLoading(false);
    }
  };

  // Send bulk from CSV with template and optional media upload
  const handleSendBulk = async () => {
    if (!file) {
      setMessage(lang("pleaseSelectCSV", language) || "Please select a CSV file.");
      return;
    }
    if (!selectedTemplate) {
      setMessage(lang("pleaseSelectTemplate", language) || "Please select a template.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      // Parse CSV
      const text = await file.text();
      const parsed = Papa.parse(text, { header: true });
      const contacts = parsed.data
        .filter(row => row.number)
        .map(row => row.number.replace(/^0/, "966"));

      // If mediaFile provided, upload to Supabase
      let mediaUrl = null;
      if (mediaFile) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(mediaFile.name, mediaFile, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        const { publicURL } = supabase.storage
          .from("attachments")
          .getPublicUrl(uploadData.path);
        mediaUrl = publicURL;
      }

      // Send webhook to n8n
      const res = await fetch(TEMPLATE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateName: selectedTemplate,
          contacts,
          mediaUrl,
        }),
      });
      if (!res.ok) throw new Error(`Webhook failed: ${res.statusText}`);
      setMessage(lang("bulkWebhookSent", language) || "Bulk webhook sent!");
      setFile(null);
      setMediaFile(null);
    } catch (err) {
      console.error(err);
      setMessage(lang("errorSendingBulk", language) || "Error sending bulk messages.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
        {lang("messageCenter", language)}
      </h1>

      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-gray-800 dark:text-gray-200">
        <strong>{lang("businessInitiatedCount", language)}</strong> {rollingCount}
      </div>

      {/* Enhanced error message if templates fail to load */}
      {message && templates.length === 0 ? (
        <div className="mb-4 text-sm text-red-600">
          {message}
        </div>
      ) : message ? (
        <div className="mb-4 text-sm text-blue-600 dark:text-blue-400">
          {message}
        </div>
      ) : null}

      <section className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">{lang("sendSingleInvite", language)}</h2>
        <div>
          <input
            type="tel"
            placeholder="05XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
          />
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-sm sm:text-base text-white font-medium rounded" onClick={handleSendSingle} disabled={loading}>
            {loading ? lang("sending", language) : lang("send", language)}
          </button>
        </div>
      </section>

      {/* BULK SENDER - Unified section */}
      <section className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow flex flex-col gap-6">
        <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
          📤 {lang("bulkWhatsAppSender", language) || "Bulk WhatsApp Sender"}
        </h2>
        {/* Fetch Templates Button */}
        <div className="mb-2">
          <button
            onClick={fetchTemplates}
            disabled={fetchingTemplates}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
          >
            {fetchingTemplates ? lang("fetchingTemplates", language) : lang("fetchWhatsAppTemplates", language)}
          </button>
          {fetchTemplatesError && (
            <div className="mt-1 text-sm text-red-600">{fetchTemplatesError}</div>
          )}
        </div>
        {/* Step 1: Select Template */}
        <div>
          <label className="block font-medium mb-1">
            1. {lang("selectTemplate", language)}
          </label>
          <select
            value={selectedTemplate}
            onChange={e => setSelectedTemplate(e.target.value)}
            className="w-full border px-4 py-2 rounded"
          >
            <option value="">-- {lang("chooseTemplate", language)} --</option>
            {templates.map(t => (
              <option key={t.name} value={t.name}>
                {t.name} ({t.language?.code || t.language})
              </option>
            ))}
          </select>
          {selectedTemplateObj && (
            <div className="my-2 p-2 bg-gray-200 dark:bg-gray-800 rounded text-sm">
              <strong>{lang("templatePreview", language)}</strong>
              {/* Header preview */}
              {(() => {
                const headerComp = selectedTemplateObj.components?.find(c => c.type === "HEADER");
                const headerType = headerComp?.format || null;
                const headerExampleUrl = headerComp?.example?.header_handle?.[0] || null;
                if (headerType === "IMAGE" && headerExampleUrl)
                  return (
                    <div>
                      <b>{lang("headerImage", language)}:</b>
                      <img src={headerExampleUrl} alt="Sample header" width={100} className="my-2" />
                    </div>
                  );
                if (headerType === "VIDEO" && headerExampleUrl)
                  return (
                    <div>
                      <b>{lang("headerVideo", language)}:</b>
                      <video src={headerExampleUrl} width={180} controls className="my-2" />
                    </div>
                  );
                if (headerType === "TEXT" && headerComp.text)
                  return (
                    <div>
                      <b>{lang("headerText", language)}:</b> <span>{headerComp.text}</span>
                    </div>
                  );
                if (headerType)
                  return (
                    <div>
                      <b>{lang("headerType", language)}:</b> {headerType}
                    </div>
                  );
                return null;
              })()}
              {/* Body preview */}
              <div>
                <b>{lang("body", language)}:</b>
                <pre className="whitespace-pre-wrap">
                  {selectedTemplateObj.components?.find(c => c.type === "BODY")?.text || ""}
                </pre>
              </div>
              {/* Footer preview */}
              {selectedTemplateObj.components?.find(c => c.type === "FOOTER")?.text && (
                <div>
                  <b>{lang("footer", language)}:</b> {selectedTemplateObj.components.find(c => c.type === "FOOTER").text}
                </div>
              )}
              {/* Buttons preview */}
              {(() => {
                const btnComp = selectedTemplateObj.components?.find(c => c.type === "BUTTONS");
                if (btnComp && btnComp.buttons && btnComp.buttons.length > 0) {
                  return (
                    <div>
                      <b>{lang("buttons", language)}:</b>
                      <ul>
                        {btnComp.buttons.map((btn, i) => (
                          <li key={i}>{btn.type}: {btn.text} {btn.url ? <a href={btn.url} target="_blank" rel="noopener noreferrer">{btn.url}</a> : ""}</li>
                        ))}
                      </ul>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>
        {/* Step 2: Upload CSV and optional media */}
        <div>
          <label className="block font-medium mb-1">
            2. {lang("bulkUpload", language)} ({lang("csvFile", language)})
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
          />
          {/* Header file upload if needed */}
          {(() => {
            const headerComp = selectedTemplateObj?.components?.find(c => c.type === "HEADER");
            const headerType = headerComp?.format || null;
            if (headerType === "IMAGE" || headerType === "VIDEO") {
              return (
                <>
                  <label className="block mb-1">{lang("uploadHeaderMedia", language)}</label>
                  <input
                    type="file"
                    onChange={e => setMediaFile(e.target.files[0])}
                    className="w-full"
                  />
                </>
              );
            }
            return null;
          })()}
        </div>
        {/* Send button */}
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded w-full mt-2"
          onClick={handleSendBulk}
          disabled={loading}
        >
          {loading ? lang("sending", language) : lang("uploadAndSend", language)}
        </button>
      </section>
    </div>
  );
}