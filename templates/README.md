# MeetStream workflow templates

The ten JSON files in this directory are **template submission candidates**, not published library listings. Import one with **Workflows → Import from File** after installing the published `n8n-nodes-meetstream` package. Until the npm release exists, use the local-development instructions below. Submission readiness and remaining live tests are tracked in [the release checklist](../docs/release-and-verification.md).

Credentials are deliberately omitted because template files are public. After import, read the large **START HERE** note. When a MeetStream node asks for a credential, select the **MeetStream account** you already saved. Never paste the API key into a Code/Edit Fields node or workflow JSON.

## Which template should I use?

| I want to…                                          | Start with                                   | Other account needed             |
| --------------------------------------------------- | -------------------------------------------- | -------------------------------- |
| Automatically send a bot to calendar meetings       | `01-calendar-auto-join.json`                 | Google Calendar                  |
| Save completed transcripts in a CRM                 | `02-transcript-to-crm.json`                  | HubSpot                          |
| Summarize live speaker turns                        | `03-live-transcript-llm.json`                | OpenAI                           |
| Email a recap after each meeting                    | `04-post-meeting-recap.json`                 | OpenAI and Gmail OAuth2          |
| Copy recordings to my storage                       | `05-recording-to-storage.json`               | Amazon S3                        |
| Alert an owner when a bot cannot join or record     | `06-bot-failure-email-alert.json`            | Gmail OAuth2                     |
| Create ClickUp tasks from agreed action items       | `07-action-items-to-clickup.json`            | OpenAI and ClickUp               |
| Add sales insights and a follow-up draft to HubSpot | `08-sales-follow-up-to-hubspot.json`         | OpenAI and HubSpot               |
| Create searchable meeting notes in Notion           | `09-meeting-knowledge-base-notion.json`      | OpenAI and Notion                |
| Log customer interview insights in a spreadsheet    | `10-customer-insights-to-google-sheets.json` | OpenAI and Google Sheets         |

To check only your saved MeetStream credential, follow the manual **Get Bot** test in [quickstart.md](../quickstart.md#6-run-a-safe-live-test-first). Template 1 also needs Google Calendar OAuth and creates a real meeting bot.

### Local development exception

`npm run dev` loads the node as `CUSTOM.meetStream`, while a published package uses `n8n-nodes-meetstream.meetStream`. Importing these publishable files into the development server therefore shows **Unrecognized node type**. Run `npm run templates:local` (also run automatically before `npm run dev`) and import the matching file from `../.local/templates/` instead. Generated local files are ignored by Git and must not be submitted to the n8n template library.

## 1. Google Calendar auto-join

File: `01-calendar-auto-join.json`

Select your saved MeetStream credential, connect Google Calendar, choose a calendar, and publish the workflow. It accepts Google Meet, Zoom, or Microsoft Teams links and avoids creating duplicate bots when n8n retries. Cancelled events and events without a supported meeting link are skipped, so personal reminders do not fail a batch of real meetings.

The template enables MeetStream post-call transcription. Add a **Lifecycle Callback URL** if this same bot should feed templates 2, 4, or 5, or register those URLs as MeetStream workspace webhooks.

## 2. Transcript to HubSpot

File: `02-transcript-to-crm.json`

Select your saved MeetStream credential and connect HubSpot. Publish the workflow and register its production webhook URL in MeetStream for `transcription.processed`.

For a saved HubSpot Service Key, open the HubSpot node, change **Authentication** from **OAuth2** to **Service Key** (called **App Token** in older n8n versions), and select the saved credential. Use the full secret copied with HubSpot's **Copy** button, not the key name or ID. Wait for **Connection tested successfully**. The local test used `crm.objects.contacts.read` and `crm.objects.contacts.write` in a disposable CRM account. Service-key permissions apply to the account, not just the contact specified by the workflow; use a dedicated test account and revoke temporary keys when finished. Keep OAuth2 selected if using an OAuth2 credential instead.

When creating the bot, include the target contact in its custom attributes:

```json
{
	"hubspot_contact_id": "12345"
}
```

The workflow ignores unrelated/failed events, selects the newest successful transcription run, formats nonempty speaker segments, and creates a HubSpot meeting engagement associated with that contact. HubSpot rich-text fields receive HTML-escaped text with explicit line breaks, so speaker turns remain readable and transcript markup is displayed literally. Transcripts over 60,000 characters are truncated with a notice. It is for post-call providers, not `meeting_captions` or streaming-only providers.

## 3. Live transcript to OpenAI

File: `03-live-transcript-llm.json`

Select your saved MeetStream credential and connect OpenAI. Publish the workflow, copy the live webhook's production URL into **Configure meeting and production webhook**, add a meeting link you own, and run the manual branch once.

The webhook acknowledges immediately. Only finalized `end_of_turn` payloads reach OpenAI, avoiding repeated summaries of interim words. Connect **Validate live summary** to your UI, chat, or datastore. Its output includes `summary`, `source_text`, `speaker`, `bot_id`, and the provider timestamp when available. Turns of six words or fewer stay verbatim; the same fallback applies if a summary drops an original group reference (`we`, `our`, `us`). Empty/refused or oversized summaries stop with an error. Longer summaries still need accuracy review; these checks do not certify every generated claim or repair transcription errors.

## 4. Post-meeting recap by email

File: `04-post-meeting-recap.json`

Select your saved MeetStream credential, connect OpenAI, and select your Gmail OAuth2 credential in **Email meeting recap**. Replace `you@example.com` with the recipient, publish the workflow, and register its production webhook URL in MeetStream for `transcription.processed`. The workflow fetches the completed transcript, asks OpenAI for a structured recap, and sends it from Gmail. It does not require a separate MeetStream summary workflow.

## 5. Recording to Amazon S3

File: `05-recording-to-storage.json`

Select your saved MeetStream credential, connect AWS, replace `replace-with-your-private-bucket`, publish the workflow, and register its production webhook URL in MeetStream for `video.processed`. It downloads each completed recording and uploads it to `meetstream/<bot_id>.mp4` in S3.

Use a private bucket, least-privilege AWS credentials restricted to the target prefix, server-side encryption, retention/lifecycle rules, and access logging.

## 6. Bot failure alerts by email

File: `06-bot-failure-email-alert.json`

Connect MeetStream and select your Gmail OAuth2 credential, replace `you@example.com` with the alert recipient, and register the production webhook for `bot.denied`, `bot.notallowed`, `bot.failed`, and `bot.recording_permission_denied`. The workflow ignores unrelated events, fetches the bot record for context, and sends the failure reason from Gmail. It does not retry the email write, avoiding duplicate alerts during destination outages.

## 7. Action items to ClickUp

File: `07-action-items-to-clickup.json`

Connect MeetStream, OpenAI, and ClickUp; then choose the target ClickUp Team, Space, and List. Register the production webhook for `transcription.processed`. The workflow creates one task only for each explicitly agreed action item and adds the owner, due-date text, evidence, and MeetStream bot ID to the task description. No tasks are created when none are supported by the transcript.

## 8. Sales follow-up assistant for HubSpot

File: `08-sales-follow-up-to-hubspot.json`

Connect MeetStream, OpenAI, and HubSpot, and register the production webhook for `transcription.processed`. Bots must carry `custom_attributes.hubspot_contact_id`. The workflow writes evidence-based needs, objections, timeline, next steps, deal risk, and a follow-up email draft into a HubSpot meeting engagement. The email is deliberately not sent automatically; a person should review it first.

Use the same Service Key/OAuth2 selection steps as template 2. The destination HTML-escapes model output and preserves its line breaks; generated markup is not treated as trusted HTML.

Decision-maker names require a matching verbatim transcript quote with explicit role or final-approval authority. A first-person role statement can use its verified speaker prefix. Unsupported, missing or commonly negated evidence produces **Not stated**. The evidence is included in the CRM note for review. This conservative check does not validate every sales claim; review the analysis and email draft before acting on them.

## 9. Notion meeting knowledge base

File: `09-meeting-knowledge-base-notion.json`

Connect MeetStream, OpenAI, and Notion; share a parent Notion page with the integration and select it in the final node. Register the production webhook for `transcription.processed`. The workflow creates one concise child page per meeting with summary, decisions, action items, open questions, and useful quotes.

## 10. Customer interview insights to Google Sheets

File: `10-customer-insights-to-google-sheets.json`

Create a sheet with the exact headers listed in the workflow's START HERE note, then connect MeetStream, OpenAI, and Google Sheets. Register the production webhook for `transcription.processed`. Each evidence-based request, problem, praise, objection, or question becomes one row. Meetings with no useful insight create no rows.

## Webhook safety

The Webhook nodes return 2xx immediately so MeetStream is not held open while downstream APIs run. Per-bot callback deliveries are not signed. Before production, follow [the webhook security guide](../docs/webhook-security.md), configure n8n execution pruning, and test duplicate and malformed deliveries. The Code nodes discard unrelated events; destination writes still need the provider's normal least-privilege credentials.
