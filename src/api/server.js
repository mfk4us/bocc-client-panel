import dotenv from 'dotenv';
dotenv.config();

console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'YES' : 'NO');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'YES' : 'NO');

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN;
const WABA_ID = process.env.WA_WABA_ID;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("PHONE_NUMBER_ID:", PHONE_NUMBER_ID);
console.log("ACCESS_TOKEN:", ACCESS_TOKEN ? "Exists" : "Missing");
console.log("WABA_ID:", WABA_ID);

const app = express();

const allowedOrigins = ['http://localhost:5173', 'https://yourproductiondomain.com'];
app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());

// GET /facebook-templates: Fetch WhatsApp templates from Facebook Graph API using integration config from Supabase
app.get('/facebook-templates', async (req, res) => {
  const { workflow_name } = req.query;
  if (!workflow_name) {
    return res.status(400).json({ error: 'Missing workflow_name in query' });
  }

  console.log('Requested workflow_name:', workflow_name);

  try {
    const { data: integration, error } = await supabase
      .from('integrations')
      .select('config, workflow_name')
      .eq('workflow_name', workflow_name)
      .eq('integration_type', 'whatsapp')
      .eq('is_active', true)
      .maybeSingle();

    console.log('Fetched integration config for:', integration?.workflow_name);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch integration config' });
    }
    if (!integration || !integration.config) {
      console.error('No integration config found');
      return res.status(404).json({ error: 'Integration config not found' });
    }

    // Defensive: Parse config if it’s a string
    let config = integration.config;
    if (typeof config === 'string') {
      try {
        config = JSON.parse(config);
      } catch (e) {
        console.error('Failed to parse config JSON:', e, config);
        return res.status(500).json({ error: 'Invalid config format' });
      }
    }
    const { wa_access_token, wa_waba_id } = config;
    console.log('Using wa_access_token:', wa_access_token ? 'Exists' : 'Missing');
    console.log('Using wa_waba_id:', wa_waba_id);
    if (!wa_access_token || !wa_waba_id) {
      console.error('wa_access_token or wa_waba_id missing in integration config', config);
      return res.status(400).json({ error: 'wa_access_token or wa_waba_id missing in integration config' });
    }

    const fbUrl = `https://graph.facebook.com/v16.0/${wa_waba_id}/message_templates?access_token=${encodeURIComponent(wa_access_token)}`;
    const fbResponse = await axios.get(fbUrl, { timeout: 10000 });

    res.json(fbResponse.data);
  } catch (err) {
    console.error('Error in /facebook-templates:', err?.response?.data || err.message || err);
    if (err?.response?.data) {
      res.status(502).json({ error: 'Failed to fetch templates from Facebook', details: err.response.data });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// GET /templates: Fetch templates from Supabase templates table
app.get('/templates', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('name, language, components')
      .limit(50);
    if (error) throw error;
    res.json({ templates: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`📡 Templates API listening on http://localhost:${PORT}`);
});