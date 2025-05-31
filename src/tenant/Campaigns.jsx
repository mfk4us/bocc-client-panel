import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { lang } from "../lang";
import { supabase } from "../components/supabaseClient";
import { API_BASE_URL, TEMPLATE_WEBHOOK_URL } from "../config";
import { useNavigate } from "react-router-dom";
import {
  MegaphoneIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  DocumentArrowUpIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  InboxStackIcon,
} from "@heroicons/react/24/outline";

export default function Campaigns({ language }) {
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

  // Campaign type state
  const [selectedCampaignType, setSelectedCampaignType] = useState("whatsapp");

  // WhatsApp integrations state
  const [availableIntegrations, setAvailableIntegrations] = useState([]);
  const [selectedIntegrationLabel, setSelectedIntegrationLabel] = useState("");

  const [userName, setUserName] = useState("Unknown User");

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
    async function fetchUser() {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUserName(data.user.user_metadata?.full_name || "Unknown User");

        // Check localStorage for workflow name first
        const storedWorkflow = localStorage.getItem("workflow_name");
        if (storedWorkflow) {
          console.log("✅ Loaded workflow_name from localStorage:", storedWorkflow);
          // Fetch available integrations
          const { data: integrations, error: intError } = await supabase
            .from("integrations")
            .select("label, config")
            .eq("workflow_name", storedWorkflow)
            .eq("integration_type", selectedCampaignType || "whatsapp")
            .eq("is_active", true);
          if (integrations) setAvailableIntegrations(integrations);
          return;
        }

        // Fallback: fetch from Supabase
        const { data: memberData, error: memberError } = await supabase
          .from("team_members")
          .select("workflow_name")
          .eq("email", data.user.email)
          .single();

        if (memberData?.workflow_name) {
          localStorage.setItem("workflow_name", memberData.workflow_name);
          // Fetch available integrations
          const { data: integrations, error: intError } = await supabase
            .from("integrations")
            .select("label, config")
            .eq("workflow_name", memberData.workflow_name)
            .eq("integration_type", selectedCampaignType || "whatsapp")
            .eq("is_active", true);
          if (integrations) setAvailableIntegrations(integrations);
        } else {
          console.warn("⚠️ No workflow_name found, using default.");
        }

        if (memberError) {
          console.error("Error fetching team member workflow:", memberError);
        }
      }
    }
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaignType]);

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

  // Fetch available Facebook WhatsApp templates from backend endpoint
  async function fetchTemplates() {
    setFetchingTemplates(true);
    setFetchTemplatesError(null);
    try {
      // Always read workflow name from localStorage at fetch time
      const storedWorkflow = localStorage.getItem("workflow_name") || "defaultWorkflow";
      const integrationLabel = selectedIntegrationLabel || "";
      console.log(
        "Fetching templates from:",
        `${API_BASE_URL}/facebook-templates?workflow_name=${encodeURIComponent(storedWorkflow)}&label=${encodeURIComponent(integrationLabel)}`
      );
      const res = await fetch(
        `${API_BASE_URL}/facebook-templates?workflow_name=${encodeURIComponent(storedWorkflow)}&label=${encodeURIComponent(integrationLabel)}`
      );
      const text = await res.text();
      console.log("Response status:", res.status, "Response text:", text);

      try {
        const data = JSON.parse(text);
        // Facebook API returns { data: [...] }
        const templatesArray = Array.isArray(data.data) ? data.data : [];
        const normalized = templatesArray.map((t) => ({
          name: t.name,
          language: t.language,
          components: t.components,
        }));
        setTemplates(normalized);
        setMessage("");
      } catch (jsonErr) {
        console.error("Failed to parse JSON:", jsonErr, "Response text:", text);
        setFetchTemplatesError("Failed to load WhatsApp templates. Invalid response from server.");
        setTemplates([]);
      }

      if (res.status === 400 || res.status === 404) {
        // Dynamic error message based on campaign type
        if (selectedCampaignType === "whatsapp") {
          setFetchTemplatesError("Failed to load WhatsApp templates. Check workflow name and WhatsApp integration in Supabase.");
        } else if (["sms", "email", "instagram", "facebook", "telegram", "call", "drip"].includes(selectedCampaignType)) {
          setFetchTemplatesError(`${selectedCampaignType.toUpperCase()} campaigns do not require approved templates.`);
        } else {
          setFetchTemplatesError("No templates required or available for this campaign type.");
        }
        setTemplates([]);
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
    } catch (err) {
      console.error("Error loading templates:", err);
      // Dynamic error message based on campaign type for network/other errors
      if (selectedCampaignType === "whatsapp") {
        setFetchTemplatesError(
          lang("failedToLoadTemplates", language) ||
            "Failed to load WhatsApp templates. Please check your connection or contact support."
        );
      } else if (["sms", "email", "instagram", "facebook", "telegram", "call", "drip"].includes(selectedCampaignType)) {
        setFetchTemplatesError(`${selectedCampaignType.toUpperCase()} campaigns do not require approved templates.`);
      } else {
        setFetchTemplatesError("No templates required or available for this campaign type.");
      }
      setTemplates([]);
    } finally {
      setFetchingTemplates(false);
    }
  }

  // Fetch templates when workflow_name or integration label changes
  useEffect(() => {
    const storedWorkflow = localStorage.getItem("workflow_name");
    if (storedWorkflow && storedWorkflow !== "defaultWorkflow") {
      fetchTemplates();
    }
  }, [selectedIntegrationLabel]);

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
          workflow_name: localStorage.getItem("workflow_name") || "defaultWorkflow",
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

  // Add this function above the return:
  const handleBulkFileChange = async (e) => {
    const file = e.target.files[0];
    setFile(file);
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === "csv") {
      // No extra parsing needed here, handled in handleSendBulk
      return;
    }
    if (ext === "xls" || ext === "xlsx") {
      // Parse Excel file and store CSV-style rows for bulk send
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        // Convert Excel to CSV format string for PapaParse compatibility
        const csv = XLSX.utils.sheet_to_csv(ws);
        // Recreate a File object (simulate a CSV upload)
        const csvFile = new File([csv], file.name.replace(/\.[^/.]+$/, ".csv"), {
          type: "text/csv",
        });
        setFile(csvFile);
      };
      reader.readAsBinaryString(file);
    }
  };

  return (
    <div className="h-screen overflow-y-auto">
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Announcement Banner */}
        <div className="w-full bg-purple-600 text-white py-3 px-4 flex flex-col items-center justify-center shadow-sm mb-4">
          <div className="flex items-center gap-3">
            <MegaphoneIcon className="h-6 w-6 text-white" />
            <span className="font-bold text-lg sm:text-xl tracking-tight">
              Campaign Management Dashboard
            </span>
          </div>
          <div className="text-sm mt-1 opacity-90 font-medium">
            Easily launch, monitor, and manage your messaging campaigns across multiple channels.
          </div>
        </div>

        {/* Main container */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Top Navigation Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <InboxStackIcon className="h-7 w-7 text-indigo-600" />
              <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Campaigns</span>
            </div>
            {/* Search/Filter bar */}
            <div className="flex items-center gap-2">
              <div className="relative w-64 max-w-full">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  disabled
                />
              </div>
              <button
                className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ml-2"
                disabled
              >
                <FunnelIcon className="h-5 w-5 mr-1" />
                Filters
              </button>
            </div>
          </div>

          {/* Segmented Tabs */}
          <div className="flex space-x-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1 w-full max-w-md mx-auto md:mx-0 mb-2">
            <button
              className="flex-1 px-4 py-2 rounded-md font-semibold text-sm transition
                bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
              style={{ boxShadow: "0 1px 2px rgba(60,60,60,0.03)" }}
              disabled
            >
              Active
            </button>
            <button
              className="flex-1 px-4 py-2 rounded-md font-semibold text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              disabled
            >
              Completed
            </button>
            <button
              className="flex-1 px-4 py-2 rounded-md font-semibold text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              disabled
            >
              Drafts
            </button>
          </div>

          {/* Rolling count banner */}
          <div className="bg-purple-50 dark:bg-gray-800 border border-purple-200 dark:border-gray-700 shadow-sm rounded-lg p-4 flex items-center gap-3 mb-2">
            <UserGroupIcon className="h-6 w-6 text-purple-500" />
            <span className="font-semibold text-gray-900 dark:text-gray-100">{lang("businessInitiatedCount", language)}</span>
            <span className="text-purple-700 dark:text-purple-300 font-bold">{rollingCount}</span>
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

          {/* Send Campaign Section */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Send Campaign</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Single Campaign Card */}
              <div className="shadow-sm rounded-lg border dark:bg-gray-800 bg-white p-6 flex flex-col gap-4 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-2">
                  <ChatBubbleLeftRightIcon className="h-7 w-7 text-indigo-500" />
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {lang("sendSingleInvite", language)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recipient Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="05XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-base border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-gray-100"
                  />
                  <button
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition text-base"
                    onClick={handleSendSingle}
                    disabled={loading}
                  >
                    {loading ? lang("sending", language) : lang("send", language)}
                  </button>
                </div>
              </div>
              {/* Bulk Campaign Card */}
              <div className="shadow-sm rounded-lg border dark:bg-gray-800 bg-white p-6 flex flex-col gap-4 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-2">
                  <DocumentArrowUpIcon className="h-7 w-7 text-green-500" />
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {lang("bulkWhatsAppSender", language) || "Bulk WhatsApp Sender"}
                  </span>
                </div>
                {/* Campaign Type Selector */}
                <div>
                  <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">Select Campaign Type</label>
                  <select
                    className="w-full mb-3 border px-4 py-2 rounded-lg text-base bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                    value={selectedCampaignType}
                    onChange={e => {
                      setSelectedCampaignType(e.target.value);
                      setSelectedIntegrationLabel("");
                      setTemplates([]);
                    }}
                  >
                    <option value="">-- Choose Campaign Type --</option>
                    <option value="whatsapp">WhatsApp Campaigns</option>
                    <option value="sms">SMS Campaigns</option>
                    <option value="email">Email Campaigns</option>
                    <option value="instagram">Instagram DM Campaigns</option>
                    <option value="facebook">Facebook Messenger Campaigns</option>
                    <option value="telegram">Telegram Bot Campaigns</option>
                    <option value="call">Automated Call Campaigns</option>
                    <option value="drip">Drip Marketing Campaigns</option>
                  </select>
                </div>
                {/* Integration Selector */}
                <div>
                  <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
                    Select {selectedCampaignType ? selectedCampaignType.charAt(0).toUpperCase() + selectedCampaignType.slice(1) : ""} Account
                  </label>
                  <select
                    className="w-full mb-3 border px-4 py-2 rounded-lg text-base bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                    value={selectedIntegrationLabel}
                    onChange={async (e) => {
                      const value = e.target.value;
                      setSelectedIntegrationLabel(value);
                      await fetchTemplates();
                    }}
                  >
                    <option value="">
                      -- Choose {selectedCampaignType
                        ? selectedCampaignType.charAt(0).toUpperCase() + selectedCampaignType.slice(1)
                        : ""} Account --
                    </option>
                    {availableIntegrations.map((intg, idx) => (
                      <option key={idx} value={intg.label}>
                        {intg.label}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Step 1: Select Template */}
                <div>
                  <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
                    1. {lang("selectTemplate", language)}
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={e => setSelectedTemplate(e.target.value)}
                    className="w-full border px-4 py-2 rounded-lg text-base bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  >
                    <option value="">-- {lang("chooseTemplate", language)} --</option>
                    {templates.map(t => (
                      <option key={t.name} value={t.name}>
                        {t.name} ({t.language?.code || t.language})
                      </option>
                    ))}
                  </select>
                  {selectedTemplateObj && (
                    <div className="my-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-sm border border-gray-200 dark:border-gray-700">
                      <strong className="block mb-1">{lang("templatePreview", language)}</strong>
                      {/* Header preview */}
                      {(() => {
                        const headerComp = selectedTemplateObj.components?.find(c => c.type === "HEADER");
                        const headerType = headerComp?.format || null;
                        const headerExampleUrl = headerComp?.example?.header_handle?.[0] || null;
                        if (headerType === "IMAGE" && headerExampleUrl)
                          return (
                            <div>
                              <b>{lang("headerImage", language)}:</b>
                              <img src={headerExampleUrl} alt="Sample header" width={100} className="my-2 rounded shadow" />
                            </div>
                          );
                        if (headerType === "VIDEO" && headerExampleUrl)
                          return (
                            <div>
                              <b>{lang("headerVideo", language)}:</b>
                              <video src={headerExampleUrl} width={180} controls className="my-2 rounded shadow" />
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
                                  <li key={i}>{btn.type}: {btn.text} {btn.url ? <a href={btn.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{btn.url}</a> : ""}</li>
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
                  <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
                    2. {lang("bulkUpload", language)} ({lang("csvFile", language)})
                  </label>
                  <input
                    type="file"
                    accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleBulkFileChange}
                    className="w-full text-base border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-gray-100"
                  />
                  {/* Header file upload if needed */}
                  {(() => {
                    const headerComp = selectedTemplateObj?.components?.find(c => c.type === "HEADER");
                    const headerType = headerComp?.format || null;
                    if (headerType === "IMAGE" || headerType === "VIDEO") {
                      return (
                        <>
                          <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">{lang("uploadHeaderMedia", language)}</label>
                          <input
                            type="file"
                            onChange={e => setMediaFile(e.target.files[0])}
                            className="w-full text-base"
                          />
                        </>
                      );
                    }
                    return null;
                  })()}
                </div>
                {/* Send button */}
                <button
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition text-base mt-1"
                  onClick={handleSendBulk}
                  disabled={loading}
                >
                  {loading ? lang("sending", language) : lang("uploadAndSend", language)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}