// AuthProviders.jsx
// Components for easy login/signup with Google and API key connection for integrations.

import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

export const GoogleConnectButton = ({ onSuccess, onError }) => (
  <GoogleLogin
    onSuccess={onSuccess}
    onError={onError}
  />
);

export const APIKeyInput = ({ apiKey, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px' }}>
    <label htmlFor="api-key-input" style={{ marginBottom: '8px', fontWeight: 'bold' }}>
      API Key
    </label>
    <input
      id="api-key-input"
      type="text"
      value={apiKey}
      onChange={e => onChange(e.target.value)}
      placeholder="Enter your API key"
      style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
    />
  </div>
);