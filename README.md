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
- **Bot → Get Summary**: retrieve the AI meeting summary.
- **Bot → Leave Meeting**: make the bot leave while retaining data.
- **Transcript → Get Transcript**: retrieve a formatted transcript by `transcript_id`, or select **Raw Response** for the provider payload.

For post-call providers, first use **Get Transcriptions**, then map its `transcript_id` into **Get Transcript**. Transcript arrays are returned in the node's `data` property so each input item remains one n8n item. Depending on the provider, segments contain either `speaker`/`transcript` or `participant.name`/`words[].text`; the templates handle both. Bots configured with MeetStream's `meeting_captions` provider deliberately return no `transcript_id`; use the caption artifact exposed by **Get Bot** instead. Similarly, **Get Summary** returns a 404 until MeetStream has generated a summary for that bot.

Lifecycle callbacks and live transcripts are different MeetStream channels: **Lifecycle Callback URL** receives status/post-call events, while **Live Transcript Webhook URL** receives streaming transcript chunks. Live providers do not emit the normal post-call transcript events. Requests are restricted to `https://api.meetstream.ai`, use a 60-second timeout, and rely on n8n's retry-on-fail controls for rate-limit backoff. The node never logs API keys.

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

## Release and n8n verification

The package has no runtime dependencies. Releases must use GitHub Actions with npm provenance; no public npm release has been confirmed yet. Before the first release:

1. Promote the reviewed source to the chosen public release repository and align package metadata. Configure npm trusted publishing for that repository and `publish.yml`, allowing direct `npm publish` (or have an npm maintainer add a narrowly scoped `NPM_TOKEN` to GitHub Actions secrets for initial publication).
2. With maintainer approval, run `npm run release` from a clean `main` branch whose upstream is the public release repository. It creates the version commit and matching tag, then pushes both. Do not run it from private staging; the publish workflow rejects private or mismatched source repositories.
3. Confirm the GitHub Action published the package with provenance.
4. Run `npx @n8n/scan-community-package n8n-nodes-meetstream` after publication.
5. Submit the public npm package through the n8n Creator Portal for verification.

Development currently lives in the private staging repository `Arjun220905/n8n-nodes-meetstream`. The intended public release repository is `meetstream-ai/n8n-plugin`, which is also the current `package.json` repository URL. Move the finalized source there and configure its npm trusted publisher before releasing, or update both the package metadata and publisher to a different public release repository. A staging push alone does not complete publication or verification.

See [docs/release-and-verification.md](docs/release-and-verification.md) for the exact release gate, evidence to keep, template-publication steps, and ownership handoff.

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
