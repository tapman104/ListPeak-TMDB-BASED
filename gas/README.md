# Google Apps Script Sync Endpoint

This folder contains a Google Apps Script that acts as your personal ListPeak sync endpoint using Google User Properties.

## Step-by-step deploy guide:

1. Go to [script.google.com](https://script.google.com) → New project
2. Paste the `Code.gs` content into the editor, overwriting the default code.
3. Click **Deploy** → **New deployment** → Choose **Web App**.
4. Set **Execute as:** `Me`, and **Who has access:** `Anyone`.
5. Click Deploy. You will be prompted to Authorize access to your Google account. Complete the authorization.
6. Copy the resulting **Web App URL**.
7. Open ListPeak Settings → Sync Endpoint, and paste that URL into the input field.

> **Note:** Google Apps Script does not support setting custom CORS headers from the server side. While `GET` works fine from a browser extension or modern app context, `POST` directly from a standard web browser may be blocked by CORS unless you use a proxy. 
> 
> **For full browser support without a proxy, the Cloudflare Worker approach is recommended.**
