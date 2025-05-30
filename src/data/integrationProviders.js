

const INTEGRATION_PROVIDERS = [
  {
    integration_type: "whatsapp",
    label: "WhatsApp Cloud API",
    icon_url: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
    config_fields: [
      { name: "wa_phone_number_id", label: "Phone Number ID", type: "text" },
      { name: "wa_waba_id", label: "WABA ID", type: "text" },
      { name: "wa_access_token", label: "Access Token", type: "password" }
    ],
    doc_url: "https://developers.facebook.com/docs/whatsapp/cloud-api"
  },
  {
    integration_type: "openai",
    label: "OpenAI GPT",
    icon_url: "https://cdn.openai.com/favicon.ico",
    config_fields: [
      { name: "api_key", label: "API Key", type: "password" },
      { name: "org_id", label: "Organization ID", type: "text" }
    ],
    doc_url: "https://platform.openai.com/docs/api-reference"
  },
  {
    integration_type: "smtp",
    label: "SMTP Email",
    icon_url: "",
    config_fields: [
      { name: "smtp_host", label: "SMTP Host", type: "text" },
      { name: "smtp_port", label: "SMTP Port", type: "number" },
      { name: "username", label: "Username", type: "text" },
      { name: "password", label: "Password", type: "password" }
    ],
    doc_url: "https://mailtrap.io/blog/smtp-connection/"
  },
  {
    integration_type: "custom",
    label: "Custom/Other",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  // Additional integration providers
  {
    integration_type: "slack",
    label: "Slack API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "microsoft-teams",
    label: "Microsoft Teams API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "google-sheets",
    label: "Google Sheets API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "salesforce",
    label: "Salesforce API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "hubspot",
    label: "HubSpot API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "zendesk",
    label: "Zendesk API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "twilio",
    label: "Twilio API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "facebook-messenger",
    label: "Facebook Messenger API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "instagram-graph",
    label: "Instagram Graph API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "google-calendar",
    label: "Google Calendar API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "shopify",
    label: "Shopify API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "mailchimp",
    label: "Mailchimp API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "freshdesk",
    label: "Freshdesk API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "jira",
    label: "Jira API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "trello",
    label: "Trello API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  // Expanded integration providers
  {
    integration_type: "airtable-api",
    label: "Airtable API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "asana-api",
    label: "Asana API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "aws-s3-api",
    label: "AWS S3 API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "bitbucket-api",
    label: "Bitbucket API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "box-api",
    label: "Box API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "confluence-api",
    label: "Confluence API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "discord-api",
    label: "Discord API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "dropbox-api",
    label: "Dropbox API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "github-api",
    label: "GitHub API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "gitlab-api",
    label: "GitLab API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "google-ads-api",
    label: "Google Ads API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "google-analytics-api",
    label: "Google Analytics API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "google-drive-api",
    label: "Google Drive API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "google-maps-api",
    label: "Google Maps API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "google-tasks-api",
    label: "Google Tasks API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "intercom-api",
    label: "Intercom API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "monday-com-api",
    label: "Monday.com API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "notion-api",
    label: "Notion API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "okta-api",
    label: "Okta API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "outlook-api",
    label: "Outlook API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "pipedrive-api",
    label: "Pipedrive API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "quickbooks-api",
    label: "QuickBooks API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "sendgrid-api",
    label: "SendGrid API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "servicenow-api",
    label: "ServiceNow API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "smartsheet-api",
    label: "Smartsheet API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "snowflake-api",
    label: "Snowflake API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "splunk-api",
    label: "Splunk API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "square-api",
    label: "Square API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "stripe-api",
    label: "Stripe API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "todoist-api",
    label: "Todoist API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "typeform-api",
    label: "Typeform API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "webflow-api",
    label: "Webflow API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "weebly-api",
    label: "Weebly API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "wix-api",
    label: "Wix API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "wordpress-api",
    label: "WordPress API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "xero-api",
    label: "Xero API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "zapier-api",
    label: "Zapier API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  },
  {
    integration_type: "zoho-crm-api",
    label: "Zoho CRM API",
    icon_url: "",
    config_fields: [],
    doc_url: ""
  }
];

export default INTEGRATION_PROVIDERS;