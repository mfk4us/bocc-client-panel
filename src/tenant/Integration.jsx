import React, { useEffect, useState } from "react";
import { supabase } from "../components/supabaseClient";
import INTEGRATION_PROVIDERS from "../data/integrationProviders";

export default function Integration({ workflowName }) {
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
    setForm({
      id: integration.id,
      integration_type: integration.integration_type,
      label: integration.label || "",
      config: JSON.stringify(integration.config, null, 2),
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.integration_type) {
      setError("Integration type is required.");
      return;
    }

    let configObj;
    if (form.integration_type === "custom") {
      if (!form.config) {
        setError("Config is required.");
        return;
      }
      try {
        configObj = JSON.parse(form.config);
      } catch {
        setError("Config must be valid JSON.");
        return;
      }
    } else {
      try {
        configObj = form.config ? JSON.parse(form.config) : {};
      } catch {
        setError("Config must be valid JSON.");
        return;
      }
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
      setSuccess(error ? "" : "Integration updated!");
    } else {
      const { error } = await supabase.from("integrations").insert([payload]);
      errorObj = error;
      setSuccess(error ? "" : "Integration added!");
    }
    if (errorObj) setError(errorObj.message);
    else handleCancel();
    fetchIntegrations();
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this integration?")) return;
    await supabase.from("integrations").delete().eq("id", id);
    fetchIntegrations();
  }

  const selectedProvider = INTEGRATION_PROVIDERS.find(p => p.integration_type === form.integration_type);

  let configObjForForm = {};
  try {
    configObjForForm = form.config ? JSON.parse(form.config) : {};
  } catch {
    configObjForForm = {};
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Integrations</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded p-4 shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
          <select
            name="integration_type"
            value={form.integration_type}
            onChange={handleChange}
            className="border p-2 rounded flex items-center"
            required
          >
            <option value="">Select Integration Type</option>
            {INTEGRATION_PROVIDERS.map((provider) => (
              <option key={provider.integration_type} value={provider.integration_type}>
                {provider.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="label"
            placeholder="Label (optional)"
            value={form.label}
            onChange={handleChange}
            className="border p-2 rounded"
            autoComplete="off"
          />
          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="mr-2"
            />
            Active
          </label>
        </div>
        {selectedProvider && selectedProvider.integration_type !== "custom" && (
          <div className="mb-2 space-y-2">
            {selectedProvider.config_fields.map((field) => (
              <div key={field.name}>
                <label className="block font-semibold mb-1" htmlFor={field.name}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  id={field.name}
                  name={field.name}
                  value={configObjForForm[field.name] || ""}
                  onChange={handleConfigFieldChange}
                  className="border p-2 rounded w-full"
                  required
                  autoComplete={field.type === "password" ? "new-password" : "off"}
                />
              </div>
            ))}
            {selectedProvider.doc_url && (
              <div className="text-xs text-blue-600 underline mt-1">
                <a href={selectedProvider.doc_url} target="_blank" rel="noopener noreferrer">
                  Documentation
                </a>
              </div>
            )}
          </div>
        )}
        {selectedProvider && selectedProvider.integration_type === "custom" && (
          <div className="mb-2">
            <textarea
              name="config"
              placeholder='Config (JSON, e.g. {"api_key":"sk-...",...})'
              value={form.config}
              onChange={handleChange}
              className="border p-2 rounded w-full font-mono"
              rows={5}
              required
            />
          </div>
        )}
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}
        <div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
          >
            {editing ? "Update" : "Add Integration"}
          </button>
          {editing && (
            <button
              type="button"
              className="bg-gray-300 px-4 py-2 rounded"
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h3 className="text-xl font-semibold mb-2">Your Integrations</h3>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full text-left border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Type</th>
              <th className="p-2">Label</th>
              <th className="p-2">Active</th>
              <th className="p-2">Config</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {integrations.map((intg) => {
              const provider = INTEGRATION_PROVIDERS.find(p => p.integration_type === intg.integration_type);
              return (
                <tr key={intg.id} className="border-t">
                  <td className="p-2 flex items-center space-x-2">
                    {provider && provider.icon_url && (
                      <img src={provider.icon_url} alt={provider.label} className="w-5 h-5" />
                    )}
                    <span>{provider ? provider.label : intg.integration_type}</span>
                  </td>
                  <td className="p-2">{intg.label}</td>
                  <td className="p-2">{intg.is_active ? "Yes" : "No"}</td>
                  <td className="p-2">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(intg.config, null, 2)}
                    </pre>
                  </td>
                  <td className="p-2 space-x-2">
                    <button
                      className="bg-yellow-400 text-white px-2 py-1 rounded"
                      onClick={() => handleEdit(intg)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-600 text-white px-2 py-1 rounded"
                      onClick={() => handleDelete(intg.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {integrations.length === 0 && (
              <tr>
                <td colSpan={5} className="text-gray-400 text-center p-4">
                  No integrations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}