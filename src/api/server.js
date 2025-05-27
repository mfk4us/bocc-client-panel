import dotenv from 'dotenv';
dotenv.config();
const WABA_ID = process.env.WA_WABA_ID;
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID;
const ACCESS_TOKEN    = process.env.WA_ACCESS_TOKEN;

console.log("PHONE_NUMBER_ID:", PHONE_NUMBER_ID);
console.log("ACCESS_TOKEN:", ACCESS_TOKEN ? "Exists" : "Missing");
console.log("WABA_ID:", WABA_ID);

const app = express();
app.use(cors());
app.use(express.json());

// Expose GET /templates
app.get('/templates', async (req, res) => {
  try {
    const graphUrl = `https://graph.facebook.com/v18.0/${WABA_ID}/message_templates`;
    const { data } = await axios.get(graphUrl, {
      params: {
        access_token: ACCESS_TOKEN,
        fields: 'name,language,components',
        limit: 50,
      },
    });
    const templates = data.data.map(t => ({
      name: t.name,
      language: t.language,
      components: t.components,
    }));
    res.json({ templates });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`📡 Templates API listening on http://localhost:${PORT}`);
});


// Please add the following lines to your `.env` file:
// WA_PHONE_NUMBER_ID=630757550128350
// WA_ACCESS_TOKEN=YOUR_FACEBOOK_CLOUD_API_TOKEN
//
// Replace YOUR_FACEBOOK_CLOUD_API_TOKEN with your actual Facebook Cloud API token.