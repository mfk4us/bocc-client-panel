import React, { useEffect, useState } from "react";
// Simple ToggleSwitch component
function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? "bg-blue-600" : "bg-gray-300"
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      style={{ minWidth: 44 }}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}
// Helper: Format config keys to be human-friendly (e.g., "accessToken" -> "Access Token")
function formatConfigKey(key) {
  if (!key) return "";
  // Insert space before capital letters, capitalize first letter
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_\-]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// Helper: Mask sensitive values (tokens, secrets, keys)
function maskIfSensitive(key, value) {
  const SENSITIVE = ["token", "secret", "key", "credential", "password"];
  if (typeof value !== "string") value = String(value);
  if (SENSITIVE.some((s) => key.toLowerCase().includes(s))) {
    if (value.length <= 8) return "••••••";
    return value.slice(0, 2) + "••••••" + value.slice(-2);
  }
  return value;
}
import { supabase } from "../components/supabaseClient";
import INTEGRATION_PROVIDERS from "../data/integrationProviders";
import { lang } from "../lang";
import FacebookConnectButton from "../api/FacebookConnectButton";
import { GoogleConnectButton } from "../api/AuthProviders";
import { TrashIcon, PencilSquareIcon, CalendarIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function Integration({ language }) {
  const workflowName = localStorage.getItem("workflow_name") || "";
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    id: null,
    integration_type: "",
    label: "",
    config: "",
    is_active: true,
  });
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingActiveId, setUpdatingActiveId] = useState(null);
  // Track expanded integration card
  const [expandedId, setExpandedId] = useState(null);

  // Track which integration's raw config is visible (unblurred)
  const [showRawConfigId, setShowRawConfigId] = useState(null);

  // Handler to toggle show/hide raw config for an integration
  function handleToggleShowRaw(id) {
    setShowRawConfigId(prev => (prev === id ? null : id));
  }

  // Handler for toggling which card is expanded
  function handleToggleExpand(id) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  // Handler for toggling is_active in table
  async function handleToggleActive(id, newValue) {
    setUpdatingActiveId(id);
    try {
      const { error } = await supabase
        .from("integrations")
        .update({ is_active: newValue })
        .eq("id", id);
      if (error) {
        setError(error.message || lang("integrationSaveError", language));
      } else {
        // Optionally: setSuccess(lang("integrationUpdated", language));
        setError("");
      }
      await fetchIntegrations();
    } finally {
      setUpdatingActiveId(null);
    }
  }

  // On mount, fetch integrations
  useEffect(() => {
    fetchIntegrations();
    // eslint-disable-next-line
  }, []);

  async function fetchIntegrations() {
    setLoading(true);
    setError("");
    let query = supabase
      .from("integrations")
      .select("*")
      .eq("workflow_name", workflowName)
      .order("created_at", { ascending: false });
    const { data, error } = await query;
    if (error) setError(error.message);
    setIntegrations(data || []);
    setLoading(false);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (name === "integration_type") {
      setForm(f => ({
        ...f,
        integration_type: value,
        config: "", // reset config when integration_type changes
      }));
    } else {
      setForm(f => ({
        ...f,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  }

  function handleConfigFieldChange(e) {
    const { name, value } = e.target;
    let configObj = {};
    try {
      configObj = form.config ? JSON.parse(form.config) : {};
    } catch {
      configObj = {};
    }
    configObj[name] = value;
    setForm((f) => ({
      ...f,
      config: JSON.stringify(configObj, null, 2),
    }));
  }

  function handleEdit(integration) {
    let configValue = "";
    if (integration.integration_type === "custom") {
      configValue = JSON.stringify(integration.config, null, 2);
    } else {
      // For standard integrations, store config as stringified JSON for the form but in the config textarea it is string
      configValue = JSON.stringify(integration.config || {}, null, 2);
    }
    setForm({
      id: integration.id,
      integration_type: integration.integration_type,
      label: integration.label || "",
      config: configValue,
      is_active: integration.is_active,
    });
    setEditing(true);
    setError("");
    setSuccess("");
  }

  function handleCancel() {
    setForm({
      id: null,
      integration_type: "",
      label: "",
      config: "",
      is_active: true,
    });
    setEditing(false);
    setError("");
    setSuccess("");
  }

  const selectedProvider = INTEGRATION_PROVIDERS.find(p => p.integration_type === form.integration_type);

  let configObjForForm = {};
  try {
    configObjForForm = form.config ? JSON.parse(form.config) : {};
  } catch {
    configObjForForm = {};
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Check if workflowName exists
    if (!workflowName) {
      // Provide clear error message using lang("workflowNameMissing", language) or fallback
      setError(
        (typeof lang === "function" && lang("workflowNameMissing", language)) ||
          "Workflow name is missing. Please provide a workflow name."
      );
      return;
    }

    if (!form.integration_type) {
      setError(lang("integrationTypeRequired", language));
      return;
    }

    let configObj = {};
    // For custom, parse JSON from textarea
    if (form.integration_type === "custom") {
      if (!form.config) {
        setError(lang("configRequired", language));
        return;
      }
      try {
        configObj = JSON.parse(form.config);
      } catch {
        setError(lang("configMustBeValidJSON", language));
        return;
      }
    } else if (selectedProvider && selectedProvider.config_fields.length) {
      // For standard, collect fields
      for (let field of selectedProvider.config_fields) {
        if (!configObjForForm[field.name]) {
          setError(lang("configFieldRequired", language) + ": " + field.label);
          return;
        }
        configObj[field.name] = configObjForForm[field.name];
      }
    } else {
      setError(lang("integrationConfigMissing", language));
      return;
    }

    const payload = {
      workflow_name: workflowName,
      integration_type: form.integration_type,
      label: form.label,
      config: configObj,
      is_active: form.is_active,
    };

    let errorObj = null;
    if (editing && form.id) {
      const { error } = await supabase
        .from("integrations")
        .update(payload)
        .eq("id", form.id);
      errorObj = error;
      setSuccess(error ? "" : lang("integrationUpdated", language));
    } else {
      const { error } = await supabase.from("integrations").insert([payload]);
      errorObj = error;
      setSuccess(error ? "" : lang("integrationAdded", language));
    }
    if (errorObj) {
      setError(errorObj.message || lang("integrationSaveError", language));
      return;
    }
    handleCancel();
    fetchIntegrations();
  }

  async function handleDelete(id) {
    if (!window.confirm(lang("confirmDeleteIntegration", language))) return;
    await supabase.from("integrations").delete().eq("id", id);
    fetchIntegrations();
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h2 className="text-3xl font-extrabold text-gray-900">{lang("integrations", language)}</h2>
        {!editing && (
          <button
            className="bg-blue-600 hover:bg-blue-700 transition text-white px-6 py-3 rounded-md font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setEditing(true)}
            type="button"
          >
            + {lang("addIntegration", language)}
          </button>
        )}
      </div>
      {/* Modal/Form for add/edit */}
      {editing && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-blue-100">
          <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 items-end">
          <div className="flex flex-col">
            <label htmlFor="integration_type" className="mb-2 font-semibold text-gray-700">{lang("selectIntegrationType", language)}</label>
            <select
              id="integration_type"
              name="integration_type"
              value={form.integration_type}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{lang("selectIntegrationType", language)}</option>
              {INTEGRATION_PROVIDERS.map((provider) => (
                <option key={provider.integration_type} value={provider.integration_type}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="label" className="mb-2 font-semibold text-gray-700">{lang("labelOptional", language)}</label>
            <input
              type="text"
              id="label"
              name="label"
              placeholder={lang("labelOptional", language)}
              value={form.label}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="font-semibold text-gray-700">{lang("active", language)}</label>
          </div>
        </div>
        {/* OAuth Connect Buttons for Google/Facebook providers */}
        {selectedProvider &&
          selectedProvider.integration_type &&
          /google/i.test(selectedProvider.integration_type) && (
            <div className="mb-6">
              <GoogleConnectButton
                onSuccess={credentialResponse => {
                  // Save credential/token in config
                  setForm(f => ({
                    ...f,
                    config: JSON.stringify(
                      credentialResponse.credential
                        ? { credential: credentialResponse.credential }
                        : credentialResponse.token
                        ? { token: credentialResponse.token }
                        : credentialResponse,
                      null,
                      2
                    ),
                  }));
                }}
                onError={error => {
                  setError("Google authentication failed.");
                }}
              />
            </div>
          )}
        {selectedProvider &&
          selectedProvider.integration_type &&
          /facebook/i.test(selectedProvider.integration_type) && (
            <div className="mb-6">
              <FacebookConnectButton
                onToken={token => {
                  setForm(f => ({
                    ...f,
                    config: JSON.stringify({ accessToken: token }, null, 2),
                  }));
                }}
              />
            </div>
          )}
        {/* Show config fields for all other providers */}
        {selectedProvider &&
          selectedProvider.integration_type !== "custom" &&
          !/google/i.test(selectedProvider.integration_type) &&
          !/facebook/i.test(selectedProvider.integration_type) && (
            <div className="mb-6 space-y-4">
              {selectedProvider.config_fields.map((field) => (
                <div key={field.name} className="flex flex-col">
                  <label className="font-semibold mb-1 text-gray-700" htmlFor={field.name}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    id={field.name}
                    name={field.name}
                    value={configObjForForm[field.name] || ""}
                    onChange={handleConfigFieldChange}
                    className="border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    autoComplete={field.type === "password" ? "new-password" : "off"}
                  />
                </div>
              ))}
              {selectedProvider.doc_url && (
                <div className="text-xs text-blue-600 underline mt-1">
                  <a href={selectedProvider.doc_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-800 transition">
                    {lang("documentation", language)}
                  </a>
                </div>
              )}
            </div>
          )}
        {selectedProvider && selectedProvider.integration_type === "custom" && (
          <div className="mb-6">
            <label htmlFor="config" className="block mb-2 font-semibold text-gray-700">{lang("configTextareaPlaceholder", language)}</label>
            <textarea
              id="config"
              name="config"
              placeholder={lang("configTextareaPlaceholder", language)}
              value={form.config}
              onChange={handleChange}
              className="border border-gray-300 rounded-md w-full font-mono p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
              required
            />
          </div>
        )}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-400 text-red-700 font-semibold shadow-sm" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-md bg-green-50 border border-green-400 text-green-700 font-semibold shadow-sm" role="alert">
            {success}
          </div>
        )}
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 transition text-white px-6 py-3 rounded-md font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {form.id ? lang("update", language) : lang("addIntegration", language)}
              </button>
              <button
                type="button"
                className="bg-gray-200 hover:bg-gray-300 transition text-gray-800 px-6 py-3 rounded-md font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                onClick={handleCancel}
              >
                {lang("cancel", language)}
              </button>
            </div>
          </form>
        </div>
      )}

      <h3 className="text-2xl font-semibold mb-4 text-gray-900">{lang("yourIntegrations", language)}</h3>
      {loading ? (
        <div className="text-gray-600">{lang("loading", language)}</div>
      ) : (
        <div>
          {integrations.length === 0 ? (
            <div className="text-gray-400 text-center p-8 font-semibold">
              {lang("noIntegrationsFound", language)}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {integrations.map((intg) => {
                const provider = INTEGRATION_PROVIDERS.find(p => p.integration_type === intg.integration_type);
                // Determine "account/email/name" from label or config
                let accountInfo = "";
                if (intg.label) {
                  accountInfo = intg.label;
                } else if (intg.config && typeof intg.config === "object") {
                  // Try to pick a field that looks like an email, name, or account
                  const config = intg.config;
                  accountInfo =
                    config.email ||
                    config.account ||
                    config.name ||
                    config.user ||
                    config.username ||
                    "";
                }
                // Dates
                const createdAt = intg.created_at ? new Date(intg.created_at) : null;
                const updatedAt = intg.updated_at ? new Date(intg.updated_at) : null;
                // Date formatting helpers
                const pad = n => n.toString().padStart(2, '0');
                const formatDate = d => d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : '';
                const isExpanded = expandedId === intg.id;
                return (
                  <div
                    key={intg.id}
                    className="bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all p-0 relative"
                  >
                    {/* Main Card Row, now entire row is clickable for expand/collapse */}
                    <div
                      className={`
                        flex flex-col md:flex-row
                        items-start md:items-center
                        gap-4 md:gap-6
                        p-5 md:p-8
                        group
                        cursor-pointer
                      `}
                      onClick={() => handleToggleExpand(intg.id)}
                      tabIndex={0}
                      role="button"
                      aria-expanded={isExpanded}
                    >
                      {/* Provider Icon */}
                      <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                        {provider && provider.icon_url && (
                          <img
                            src={provider.icon_url}
                            alt={provider.label}
                            className="w-10 h-10 md:w-12 md:h-12 object-contain"
                            title={provider.label}
                          />
                        )}
                      </div>
                      {/* Provider Name and Account (left side) */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex flex-row flex-wrap items-center gap-3 md:gap-4">
                          <div className="text-lg md:text-xl font-bold text-gray-900">
                            {provider
                              ? provider.label
                              : formatConfigKey(intg.integration_type)}
                          </div>
                          {accountInfo && (
                            <div className="text-gray-500 text-sm truncate max-w-xs">
                              {accountInfo}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Dates (center right) */}
                      <div className="flex flex-row items-center gap-4 min-w-fit">
                        {createdAt && (
                          <div className="flex items-center text-xs text-gray-400" title={createdAt.toLocaleString()}>
                            <CalendarIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                            <span>{formatDate(createdAt)}</span>
                          </div>
                        )}
                        {updatedAt && (
                          <div className="flex items-center text-xs text-gray-400" title={updatedAt.toLocaleString()}>
                            <PencilSquareIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                            <span>{formatDate(updatedAt)}</span>
                          </div>
                        )}
                      </div>
                      {/* Toggle Switch (right side) */}
                      <div
                        className="flex flex-col items-center md:items-start md:justify-center gap-2 md:gap-4 integration-toggle"
                        onClick={e => e.stopPropagation()}
                      >
                        <ToggleSwitch
                          checked={!!intg.is_active}
                          onChange={val => handleToggleActive(intg.id, val)}
                          disabled={updatingActiveId === intg.id}
                        />
                        <span className="text-xs text-gray-400 md:hidden">{lang("active", language)}</span>
                      </div>
                    </div>
                    {/* Animated Expandable Section */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded ? "max-h-[600px] opacity-100 py-4 px-6 border-t border-gray-100 bg-gray-50" : "max-h-0 opacity-0 py-0 px-6"
                      }`}
                      style={{
                        transitionProperty: "max-height, opacity, padding",
                      }}
                    >
                      {isExpanded && (
                        <div>
                          <div className="mb-2 text-sm text-gray-600 font-semibold">{formatConfigKey(lang("integrationConfig", language))}</div>
                          {/* Show all config keys */}
                          {intg.config && typeof intg.config === "object" && Object.keys(intg.config).length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-4 text-xs text-gray-700">
                              {Object.entries(intg.config).map(([k, v]) => (
                                <div key={k} className="bg-white border border-gray-200 rounded px-2 py-1">
                                  <span className="font-semibold">{formatConfigKey(k)}:</span>{" "}
                                  <span className="font-mono">{maskIfSensitive(k, v)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Full config JSON with blur and eye icon */}
                          <div className="relative">
                            <pre
                              className={`text-xs bg-white rounded-lg border border-gray-200 p-4 font-mono overflow-x-auto whitespace-pre-wrap ${
                                showRawConfigId === intg.id
                                  ? ""
                                  : "filter blur-sm pointer-events-none select-none"
                              }`}
                            >
                              {JSON.stringify(
                                intg.config && typeof intg.config === "object"
                                  ? Object.fromEntries(
                                      Object.entries(intg.config).map(([k, v]) => [
                                        formatConfigKey(k),
                                        v,
                                      ])
                                    )
                                  : intg.config,
                                null,
                                2
                              )}
                            </pre>
                            <button
                              type="button"
                              className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow hover:bg-gray-100 transition"
                              onClick={e => {
                                e.stopPropagation();
                                handleToggleShowRaw(intg.id);
                              }}
                              aria-label={
                                showRawConfigId === intg.id
                                  ? lang("hideRawConfig", language) || "Hide raw config"
                                  : lang("showRawConfig", language) || "Show raw config"
                              }
                              tabIndex={0}
                            >
                              {showRawConfigId === intg.id ? (
                                <EyeSlashIcon className="h-5 w-5 text-gray-700" aria-hidden="true" />
                              ) : (
                                <EyeIcon className="h-5 w-5 text-gray-700" aria-hidden="true" />
                              )}
                            </button>
                          </div>
                          {/* Metadata */}
                          <div className="mt-2 text-xs text-gray-500">
                            <span className="font-semibold">{formatConfigKey(lang("integrationId", language) || "ID")}:</span> {intg.id}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            <span className="font-semibold">{formatConfigKey(lang("createdAt", language))}:</span> {createdAt ? formatDate(createdAt) : ""}
                            {" | "}
                            <span className="font-semibold">{formatConfigKey(lang("updatedAt", language))}:</span> {updatedAt ? formatDate(updatedAt) : ""}
                          </div>
                          {provider && provider.doc_url && (
                            <div className="mt-2">
                              <a
                                href={provider.doc_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline hover:text-blue-800 transition text-xs"
                              >
                                {lang("documentation", language)}
                              </a>
                            </div>
                          )}
                          {/* Action Buttons in expanded section, bottom right */}
                          <div className="flex justify-end gap-2 mt-6">
                            <button
                              className="p-2 rounded-md hover:bg-gray-100 border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                              onClick={e => {
                                e.stopPropagation();
                                handleEdit(intg);
                              }}
                              title={lang("edit", language)}
                              type="button"
                              aria-label={lang("edit", language)}
                            >
                              <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                            <button
                              className="p-2 rounded-md bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
                              onClick={e => {
                                e.stopPropagation();
                                if (window.confirm(lang("confirmDeleteIntegration", language))) {
                                  handleDelete(intg.id);
                                }
                              }}
                              title={lang("delete", language)}
                              type="button"
                              aria-label={lang("delete", language)}
                            >
                              <TrashIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}