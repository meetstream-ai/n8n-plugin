# Testing the MeetStream integration

## Automated local gate

Use Node 24 and run `npm run lint` and `npm test`. The tests build the package, exercise the node's API request and error paths, and check the templates against synthetic data. The calendar regression runs without Node's global `URL`, matching the restriction observed in n8n Cloud's Code sandbox.

## Run template logic inside n8n Cloud

This check needs no credentials and makes no external requests. It tests code copied from all ten templates using synthetic calendar events, lifecycle events, transcripts, and AI responses. It covers batches, cancelled/non-meeting events, unsafe meeting URLs, missing correlation IDs, out-of-order transcription runs, empty/large transcripts, invalid model JSON, and refusals.

1. In the project terminal, run `npm run test:cloud:prepare`.
2. In n8n, create a test workflow and choose **Import from File**.
3. Import `.local/qa/template-checks.json` from the project. `.local` is hidden in Finder; press **Command+Shift+G** in the file picker and paste the full file path if needed.
4. Click **Execute workflow**. The final output should show `passed: true`, `templates: 10`, and a `checks` count matching the generator output (currently 155).

The same command also generates `.local/qa/template-checks.sdk.ts` for an MCP client that supports n8n's Workflow SDK. These files are test fixtures, not library templates. Regenerate them after changing a template. They deliberately simulate external responses: passing them does not prove that API credentials, email delivery, CRM writes, or storage uploads work.

## Live integration gate

Start with **Get Bot** using an existing bot ID, then **Get Transcriptions**. For a successful post-call run, pass its `transcript_id` to **Get Transcript** and check `data`. A captions-only bot cannot exercise this route. Check **Get Recording** and immediately download the returned URL while it is valid.

Use a meeting you own to test **Create Bot**, the lifecycle callbacks, live transcription, and **Leave Meeting**. For destination templates, use your own test contact, task list, page, spreadsheet, private bucket, and email address. Connect each service in the n8n instance running the workflow. A credential in a different local/Cloud instance is not available automatically.

Post-call responses can contain either `{ speaker, transcript }` segments or `{ participant: { name }, words: [{ text }] }` segments. The transcript templates support both, preserve speaker names, ignore malformed/empty words, and reject truly empty speech. Check against real provider output as well as synthetic fixtures.

Post-call selectors compare parsed `created_at` timestamps, including timezone offsets. Successful runs with unknown/invalid dates remain usable but sort behind known dates; when all dates are unknown, the API's order is preserved. Failed runs never displace a successful one.

For live-turn tests, send a final turn, an interim turn, and malformed text. The filter only accepts nonblank strings from `utterance`, `transcript`, or `new_text`, supports `speakerName` or `speaker`, and skips interim/malformed input before the AI node. A callback sent directly to a local test URL verifies routing/processing, not public delivery from a real meeting.

If Google returns **needs to be reconnected**, open the Gmail or Calendar credential and complete Google sign-in again. Code changes cannot restore a revoked refresh token.

If the callback reports **The OAuth callback state is invalid**, close the failed popup and start a fresh **Sign in with Google** attempt from the credential in the same browser. Complete that attempt within five minutes; n8n 2.41.6 expires its OAuth flow state after that interval. Do not reload or reuse an old callback URL, disable OAuth state validation, or reset the database to fix this error.

A spinner or **Account connected** label alone does not prove reconnection. Verify a real read-only API call afterward; for a send test, also read back the resulting message. If a controlled browser popup stays blank or loading, complete a fresh sign-in from a normal browser tab you open yourself, keeping the OAuth client settings unchanged. Handle any Google warning yourself and continue only for an app you trust.

For external Google OAuth apps whose consent-screen publishing status is **Testing**, refresh tokens for Gmail/Calendar/Sheets access expire after seven days. This can require reconnection even when a workflow is unchanged. The app owner should arrange an appropriate production OAuth setup for unattended use; n8n node verification does not change the Google app's status. See [Google's refresh-token expiration guidance](https://developers.google.com/identity/protocols/oauth2#expiration). This policy is a possible cause, not proof of why a particular credential failed.

Schema validation, synthetic execution, and successful read-only API requests are separate evidence from a full meeting-to-destination run. Test deployed webhook authentication and rate limiting in the actual ingress deployment; local HTTP 429 unit tests do not exercise that firewall.

Private credential references, contact/bot IDs, callback capability URLs, execution data, and test artifacts must stay in ignored local files, never in published templates or Git history.

## Testing without OpenAI credit

For the installed Ollama setup and dedicated local test copies, see [Local AI testing](local-ai-testing.md).

The MeetStream node itself does not require OpenAI. Calendar joining, transcript retrieval, recording downloads, failure alerts, and direct transcript email can be tested independently. For AI templates, a local model or available n8n Cloud managed credits can replace the AI step in a **separate test copy**. This tests that provider, not the original OpenAI node. Preserve the downstream text/JSON contract and test real output quality before enabling destination writes.

Action-item and customer-insight validators now require matching transcript quotes. Action items discard task phrases absent from their quote, clear owner/date fields absent from that quote, and deduplicate identical task/owner/date combinations within a response. These checks reduce unsupported writes but cannot prove that a quoted fact is actually a task or customer insight. Review AI output before enabling unattended writes, especially after changing providers.
