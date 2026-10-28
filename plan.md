# MeetStream for Make.com — delivery plan

**Status:** Planned; start after the MeetStream n8n node ships

**Target due date:** October 20, 2026, 11:34 AM (confirm timezone)

**Label:** Connectors & SDKs
**Owner(s):** TBD

## Goal

Build and publish a MeetStream app for Make.com that covers the practical API surface of the n8n integration: create and inspect bots, retrieve transcripts and recordings, and receive meeting lifecycle events. Make the app understandable to non-developers and ship at least three useful scenario templates.

## Definition of done

- [ ] The app is implemented as a Make Custom App using the supported SDK/editor and has a stable, documented connection for a MeetStream API key.
- [ ] Core actions and event triggers pass automated checks and end-to-end tests against MeetStream’s API, including credential errors, missing resources, throttling, retries, and duplicate events.
- [ ] Make’s required universal module is included and tested; inputs, outputs, dates, limits, and pagination follow Make’s review requirements where applicable.
- [ ] The app is submitted through Make’s app review process and receives approval; its public listing URL is recorded here.
- [ ] At least three scenario templates are approved/published in the public template gallery and their URLs are recorded here. If Make’s app program does not permit public templates for this app type, obtain written confirmation of the supported route and publish shareable blueprints instead; do not count those as gallery templates.
- [ ] MeetStream-side documentation explains installation, API-key setup, every module, event behavior, template use, known limitations, and troubleshooting.
- [ ] All public copy and template screenshots contain no credentials or customer data.

## Sequencing and decision gates

### Gate 0 — n8n ships first

Do not begin Make implementation until the n8n package has passed verification and its core naming, authentication, tested API mappings, and user-facing copy are stable. Reuse those decisions and test fixtures rather than maintaining two divergent integrations.

Before starting, capture the n8n package version/release and link its docs and test fixtures here: **TBD**.

### Gate 1 — confirm Make publication route and templates

Make distinguishes app-review/public Custom Apps from its Community Apps program. The Community Apps documentation currently says community apps cannot publish templates to the public template gallery. Confirm the intended app type and template eligibility with Make before implementation. If public gallery templates are not eligible, ask Make for the supported alternative and get approval to adjust the done condition before proceeding.

### Zapier decision

**Recommendation:** keep Zapier out of this Make delivery. Revisit Zapier as a separate follow-on after Make is listed, reusing the stable API contract, copy, and test cases. The requester/product owner should confirm whether to open a separate Zapier task: **TBD**.

## Proposed app surface

Use the n8n node and its verified behavior as the API reference, but design Make modules in Make’s native terms and avoid exposing low-level fields unless they are genuinely useful.

### Connection

- MeetStream API key entered once in a clearly named Make connection.
- Send it using the API’s required `Authorization: Token …` scheme to the documented MeetStream API base URL.
- Never place secrets in module inputs, scenario blueprints, logs, or template examples.
- Verify the API-key setup instructions and error copy with a new Make user who has not configured the connection before.

### Actions

1. **Create a bot** — accept the meeting URL and supported bot options; return the bot identifier and API response fields needed by later modules. Use an idempotency/deduplication key when supported so retries do not create duplicate meeting bots.
2. **Get a bot / bot status** — return current bot details and status by bot ID. Confirm the exact MeetStream endpoint and status vocabulary against current API documentation before locking the module schema.
3. **Get transcript** — retrieve the completed transcript by bot/meeting identifier, with a clear distinction between transcript text and transcript segments/metadata.
4. **Get summary** — retrieve the post-meeting summary when available; explain the not-ready-yet case.
5. **Get recording / media** — retrieve recording metadata and a fresh media URL. Where the URL is short-lived, download or forward it immediately in the scenario; do not present it as durable storage.
6. **Leave meeting** — expose only if the API supports it for the relevant bot state; document that it affects an in-progress bot.
7. **Universal API call** — provide the universal module required by Make review, with safe defaults, documented authentication, and a clear warning that users are responsible for the method/path/body they supply. Restrict calls to the MeetStream API host.

### Triggers

- **Watch meeting events (instant webhook)** — receive supported lifecycle events such as bot joined, meeting ended, transcript ready, and recording ready. Confirm the exact event names and registration/signature flow with MeetStream’s current webhook documentation.
- If a reliable webhook event is unavailable, provide a **Watch bot status (polling)** trigger only if the API offers a supported list/status endpoint with a cursor or timestamp strategy. Avoid polling every bot individually without a bounded, documented cost and rate-limit strategy.
- For every trigger, define event deduplication, webhook verification, replay behavior, and what happens when the downstream scenario is temporarily unavailable. If Make cannot validate the signed payload directly, establish a supported verification approach before claiming the trigger is secure.

## Three launch scenario templates

Keep these as the minimum launch set; each must import cleanly, explain required connections, use safe sample values, and include a test path that does not accidentally join a real meeting.

1. **Google Calendar event → MeetStream bot joins**

   Watch new/updated calendar events, filter for a supported meeting URL and a chosen lead time, then create one bot per event using a stable event-based deduplication key. Include timezone, cancelled-event, missing-link, and duplicate-update handling.
2. **Meeting completed → transcript into CRM**

   Receive the transcript-ready/lifecycle event, retrieve the final transcript, then create or update a CRM record using a stable meeting or contact key. Include “not ready yet” handling and prevent duplicate writes. Use a CRM supported by Make and MeetStream customers; HubSpot is the initial candidate, subject to product confirmation.
3. **Recording ready → customer storage**

   Receive the recording-ready event, retrieve a fresh recording URL, and immediately transfer the media to the customer’s own storage (initial candidate: Google Drive or S3, based on customer demand). Explain file-size, URL-expiry, and storage permission requirements.

Optional follow-up templates after the minimum set: lifecycle event → email recap; completed transcript → LLM summary and email; bot failure → email notification. Keep Slack out of the default set unless customer research shows it is preferred over email.

## Work plan and checkpoints

| Phase | Work | Exit criteria |
|---|---|---|
| 0. Ready to start | Confirm n8n verification/listing is complete; freeze reused API names/copy; confirm Make app type, template eligibility, owners, due-date timezone, and Zapier decision. | Written decisions recorded; no unresolved publication-path blocker. |
| 1. API and UX mapping | Compare the current n8n implementation with current MeetStream API docs; map each Make module, required/optional fields, output bundles, errors, webhook events, and rate limits. | Reviewed module contract and a module-to-endpoint test matrix. |
| 2. App foundation | Create the Make app in the official SDK/editor; configure immutable app ID, label, categories, connection, universal module, and developer/support metadata. | App imports in Make development environment; connection test succeeds and invalid keys fail clearly. |
| 3. Core modules | Implement bot creation/inspection, transcript, summary, recording/media, and supported webhook/polling triggers. Add bounded retries and pagination/limits only where supported. | Every module has success, validation, auth, not-found, not-ready, rate-limit, and server-error coverage. |
| 4. Scenario templates | Build the three launch scenarios; use test calendars/meetings and non-production destinations; document setup and cleanup. | Each scenario imports, has a clear setup guide, and passes a recorded end-to-end test. |
| 5. Pre-review hardening | Test fresh install and upgrade, empty/large transcript, missing meeting URL, delayed events, duplicate/replayed events, expired recording URL, 401/403/404/409/429/5xx, network timeout, and retry behavior. Inspect logs and blueprints for secrets. | No known blocker; test evidence and review checklist complete. |
| 6. Submit and publish | Remove test-only modules/connections, confirm visibility and final copy, attach API documentation and scenario links, submit for Make review, respond to feedback, then publish eligible templates. | Approved public app listing and at least three public template URLs (or an explicitly approved alternative). |
| 7. Maintain | Add Make listing/template links to MeetStream docs; monitor review notes, API changes, and customer reports; assign a response owner. | Support owner and maintenance process documented. |

## Quality and review checklist

- [ ] Check the current MeetStream API docs for exact paths, required fields, supported event names, signature validation, status transitions, media URL lifetime, and rate limits; do not copy assumptions from old templates.
- [ ] Keep endpoint host fixed to MeetStream; reject arbitrary hosts in the universal module.
- [ ] Validate required fields before making a request and provide actionable, non-secret error messages.
- [ ] Handle 429 using `Retry-After` when present; use bounded backoff for transient errors and do not retry permanent validation/authentication failures.
- [ ] Ensure webhook registration is idempotent and deletion/cleanup works; verify signatures before trusting event payloads.
- [ ] Make polling bounded and cursor-based if the API supports it; do not repeatedly retrieve full transcripts to detect changes.
- [ ] Test date/time conversion, daylight-saving boundaries, empty values, Unicode, large payloads, duplicate deliveries, and out-of-order lifecycle events.
- [ ] Confirm Make’s current review requirements for universal module, input/output interfaces, date formats, pagination/limits, test scenarios, categories, developer info, support channel, and API-doc links.
- [ ] Verify app and template copy says what each scenario does, what credentials are needed, and whether a real meeting or paid service may be affected.
- [ ] Record app version, review submission date, reviewer feedback, listing URL, and template URLs below.

## Owners and tracking

- Product/API owner: **TBD**
- Make app implementation owner: **TBD**
- QA/release owner: **TBD**
- Make review-response owner: **TBD**
- Zapier follow-up decision owner: **TBD**
- Review submission date / reference: **TBD**
- Public app listing URL: **TBD**
- Public scenario template URLs: **TBD**

## Official references

- [Make Custom Apps documentation](https://developers.make.com/custom-apps-documentation)
- [App review prerequisites](https://developers.make.com/custom-apps-documentation/app-review/prerequisites)
- [Request an app review](https://developers.make.com/custom-apps-documentation/app-review/request-app-review)
- [App review overview](https://developers.make.com/custom-apps-documentation/app-review/overview)
- [Create an app in the Make Apps SDK](https://developers.make.com/custom-apps-documentation/get-started/make-apps-editor/apps-sdk/creating-an-app-in-vs-code)
- [Make scenario templates: create and manage](https://help.make.com/create-and-manage-scenario-templates)
- [Make Community Apps: how the program works](https://developers.make.com/custom-apps-documentation/community-apps/how-does-it-work)
