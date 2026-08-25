# Cloudflare Worker Deployment Guide

This folder contains a Cloudflare Worker that acts as your personal ListPeak sync endpoint using Cloudflare KV.

## Step-by-step deploy guide:

1. Install wrangler: `npm install -g wrangler`
2. Login: `wrangler login`
3. Create KV namespace: `wrangler kv:namespace create STORE`
4. Copy the outputted KV id into `wrangler.toml`, replacing `REPLACE_WITH_YOUR_KV_ID`.
5. Deploy: `wrangler deploy`
6. Copy the deployed URL (e.g. `https://listpeak-sync.username.workers.dev`)
7. Open ListPeak Settings → Sync Endpoint, and paste that URL into the input field.
