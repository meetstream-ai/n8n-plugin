# MeetStream n8n Plugin

n8n community node for the [MeetStream](https://meetstream.ai) meeting-bot API.

## Install after publishing

After `n8n-nodes-meetstream` is public on npm, self-hosted n8n users can open **Settings → Community nodes**, enter the package name, and install it. Verified community nodes can also be installed from the n8n node panel.

**n8n Cloud:** the MeetStream node must be available in the verified community-node catalog before the production templates can run there. Importing JSON or connecting n8n through MCP does not install the node. Until it is listed, test the plugin locally with `npm run dev`. The credential-free Cloud checks described in [docs/testing.md](docs/testing.md) can already test the templates' transformation logic.

Create a MeetStream credential with an API key from [app.meetstream.ai/api-key](https://app.meetstream.ai/api-key). Keep API keys in n8n credentials; do not add them to workflow JSON, source control, or environment files.

## Included operations

- **Bot → Create Bot**: send or schedule a bot, choose video and post-call/live transcription, attach callback URLs and metadata, and prevent duplicates with MeetStream idempotency keys.
- **Bot → Get Bot**: retrieve bot details, including `transcript_id` when available.
- **Bot → Get Transcriptions**: list post-call transcription runs and their `transcript_id` values.
- **Bot → Get Recording**: retrieve processed video.
- **Bot → Leave Meeting**: make the bot leave while retaining data.
- **Transcript → Get Transcript**: retrieve a formatted transcript by `transcript_id`, or select **Raw Response** for the provider payload.

For post-call providers, first use **Get Transcriptions**, then map its `transcript_id` into **Get Transcript**. Transcript arrays are returned in the node's `data` property so each input item remains one n8n item. Depending on the provider, segments contain either `speaker`/`transcript` or `participant.name`/`words[].text`; the templates handle both. For `meeting_captions` bots without a transcript ID, use the caption artifact exposed by **Get Bot**. To generate a summary, feed the transcript to an AI step, as shown in the post-meeting recap template.

Lifecycle callbacks and live transcripts are different MeetStream channels: **Lifecycle Callback URL** receives status/post-call events, while **Live Transcript Webhook URL** receives streaming transcript chunks. Live providers do not emit the normal post-call transcript events. Requests are restricted to `https://api.meetstream.ai`, use a 60-second timeout, and rely on n8n's retry-on-fail controls for rate-limit backoff. The node never logs API keys.

## Recording and Zoom setup

**Record Video** defaults to off, including in the Calendar template. Turn it on when creating a bot that feeds the recording-to-S3 workflow.

Zoom bots need your own Zoom Meeting SDK app configured in MeetStream. Joining meetings outside the app’s Zoom account requires a reviewed app and an OBF or ZAK token. This node and its Calendar template don’t expose token URL fields. Use the Create Bot API directly for those joins. MeetStream refuses the `meeting_captions` provider for Zoom bots joining through your own app. Choose another transcription provider. [Zoom bot setup](https://docs.meetstream.ai/guides/platforms/zoom) · [OBF and ZAK](https://docs.meetstream.ai/guides/app-integrations/zoom-authenticated-bots)

## Development and local runtime test

For a beginner-friendly VS Code walkthrough, see [quickstart.md](quickstart.md).

Use Node.js 24 or newer. The tested n8n 2.41.6 runtime and its native expression sandbox require Node 24+.

```bash
npm ci
npm run lint
npm run build
npm test
npm run dev
```

`npm run dev` starts a local n8n instance with this node loaded and prepares development-compatible workflow files in `.local/templates/`. Open `http://localhost:5678`, create a MeetStream credential, then first run **Bot → Get Bot** against an existing bot ID. Use a meeting you own for any **Create Bot** test and call **Leave Meeting** afterwards.

The development CLI registers the node as `CUSTOM.meetStream`; published packages use `n8n-nodes-meetstream.meetStream`. For local testing, import `.local/templates/*.json`. The ten files in `templates/` retain the published type required by the n8n template library.

## Workflow blueprints

The `templates/` directory contains ten complete, importable workflows:

1. Google Calendar event start → extract the meeting URL → create one deduplicated MeetStream bot.
2. `transcription.processed` webhook → resolve and format the transcript → create a HubSpot meeting engagement.
3. Create a streaming bot and receive finalized live turns → OpenAI summarisation.
4. `transcription.processed` webhook → fetch the transcript → summarize it with OpenAI → send it by email.
5. `video.processed` webhook → fetch a fresh presigned URL → download the file → upload it to Amazon S3.
6. Lifecycle failure webhook → fetch bot context → email the meeting owner.
7. `transcription.processed` webhook → extract agreed action items → create ClickUp tasks.
8. `transcription.processed` webhook → analyze a sales call → save insights and a reviewable email draft in HubSpot.
9. `transcription.processed` webhook → create a structured meeting knowledge page in Notion.
10. `transcription.processed` webhook → extract customer feedback → append evidence-based insights to Google Sheets.

They intentionally contain no credentials or customer data. After import, connect the credentials and destination named in [templates/README.md](templates/README.md). Webhook workflows use n8n's immediate response mode so MeetStream gets a fast 2xx acknowledgement.

## Webhook security and rate limiting

n8n owns the HTTP listener; this package does not open a server or bypass n8n's authentication controls. MeetStream per-bot `callback_url` deliveries are not signed. For production, prefer a signed MeetStream workspace webhook and verify it at an API gateway/reverse proxy before forwarding to n8n. Apply request-size limits and per-IP/per-path rate limits there, keep n8n patched, and never make the n8n editor publicly reachable. See [docs/webhook-security.md](docs/webhook-security.md).

## Support

MeetStream API documentation: [docs.meetstream.ai](https://docs.meetstream.ai)
