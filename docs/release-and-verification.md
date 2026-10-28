# Release, verification, and publication checklist

This repository is technically ready only when every local and CI gate below passes. The product goal is complete only after the external npm, n8n, template-library, and MeetStream documentation steps are also complete.

## Template end-to-end follow-up — 28 October 2026 (latest)

Gmail's blocked continuation is closed: owner consent succeeded, the real-callback/local-model recap was sent and Gmail read-back confirmed it, without repeating the CRM write. A fresh meeting delivered seven real live turns through HTTPS, n8n and local Qwen3. Found and fixed short-turn/context and group-attribution weaknesses in the live output pipeline; the final attribution guard was checked against all seven captured turns on replay. Longer AI output and provider transcription still require review; local tests do not certify the shipped OpenAI provider.

The failure-alert self-email passed with a clearly simulated event. The sales template passed real transcript fetch → local model → HubSpot write/read-back and recoverable QA cleanup. Review found an invented decision-maker role; the final formatter now requires grounded named role evidence, preserves explicit first-person declarations through verified speaker attribution, and leaves unsupported roles unknown. Both new QA CRM records were recoverably archived. See [testing evidence](testing.md) for distinctions between actual callbacks, simulated initial events and replay checks.

Calendar was explicitly excluded after consent attempts stalled; its saved connection still needs reconnection before a fresh trigger pass can be claimed. Optional ClickUp/Notion/Sheets destination writes remain credential-blocked; S3 was also excluded. The QA bot, meeting, safety timer, receiver, tunnel, gateway and model server were cleaned up; no workspace endpoint was added. Company deployment, public-source/npm provenance, original-provider testing and template-library publication remain separate steps.

Final build, lint, **39 automated tests**, package inspection and **155 synthetic checks inside local n8n** passed. Production-only audit reports zero; the dependency advisories below remain. Focused review covered both changed workflow JSON files, their template README, `scripts/prepare-cloud-qa.mjs`, `test/template-runtime.test.mjs`, `docs/local-ai-testing.md`, `docs/testing.md` and this checklist, including all changed code and context. Inputs added to validation are transcript/model strings and source references; output remains plain text until the existing escaped HubSpot destination. Injection/XSS regressions pass, and there is no evaluation of transcript/model instructions. No authentication grants, authorization/IDOR boundary, database access, CSRF/session mechanism, cryptography, production shared state, or API business operation changed in the public package. No new public listener, retry loop or unbounded cache was added. The remaining model-semantic limits and upstream dependency DoS findings are not certified away; quote matching and pronoun/negation checks are conservative heuristics. Private QA identities, payloads and credentials stay outside the distributed source. Third-party internals and the company's future deployment were not exhaustively audited.

## Dependency follow-up — 28 October 2026

The official CLI is now exactly pinned to 0.54.3, preserving patched Handlebars 4.7.10. Fixed an incompatible transitive `ignore` peer resolution with a development-only v7 dependency; ESLint retains compatible v5 copies. CI and release validation now check `npm ls --all` in addition to the existing audit gates. No node, credential or public template behavior changed.

The full audit still reports **30 affected development packages (0 critical, 24 high, 5 moderate, 1 low)**; the same-day pre-change baseline also reported 30. Production-only audit reports zero. This is a tested tooling refresh and dependency-tree fix, **not resolution of all remaining advisories**. See the [dependency follow-up](dependency-advisories.md) for each of the seven vulnerable upstream libraries, patched versions and compatibility blockers. No forced downgrade, verification exception or dependency override was used.

A clean install, complete dependency-tree validation, lint, build, all 37 automated tests (including 139 synthetic template checks), ten local-template generation, package inspection and a fresh normal packed-install n8n smoke test passed. All 11 node execution tests also passed against the older host workflow library 2.41.2. Lint retains two existing warnings; live provider/OAuth/storage gaps below are unchanged.

## Signed callback and packed-install recheck — 27 October 2026

- A fresh normal community-package install recognized the published node type from the packed release candidate. The disposable n8n instance and directory were removed. Published npm installation/provenance still needs checking after the company's release.
- Real signed workspace callbacks passed raw-body HMAC and timestamp checks. An actual successful-transcription event fetched the newly spoken transcript and completed a HubSpot meeting write/read-back with the expected contact association. The earlier simulated-trigger gap for this route is now closed in the QA deployment.
- Real streaming delivery reached n8n. After correcting local-model completion errors with structured JSON, all six captured turns passed replay processing. The fresh retest received no speech before its safety timeout; a fresh continuous streaming-to-model pass remains open. An isolated-date paraphrase also showed that successful execution does not certify local-model semantic quality.
- A complete local recap was generated and validated, but Gmail delivery remains blocked on Google OAuth reconnection. Only the failed email step was retried; the successful CRM write was not repeated. No email was sent during this recheck. OpenAI and S3 were not tested, as agreed.
- Three bots were verified `Done`; the new QA HubSpot meeting was recoverably archived, preserving the existing contact/older notes. Both receivers were unpublished, and temporary public/model services and the local signing-secret file were cleaned up. The temporary workspace endpoint was deleted after explicit approval; the original endpoint was verified to remain intact. See [testing evidence](testing.md) for the exact limits.
- Build and all 37 automated tests passed. No community-node implementation or published AI provider was changed; the local-model adapters remain ignored, private QA copies. No public-release action was taken.
- The October 27 full dependency audit reports **0 critical, 25 high, 4 moderate** affected packages in the development tree, while the production-only audit reports zero. The advisory data has changed since October 23 without a dependency edit. Lint passed with the same two existing warnings. The critical gate remains passing; do not interpret that as a clean full development audit or force npm's proposed breaking toolchain downgrades.

## Live destination and callback recheck — 23 October 2026

- HubSpot Service Key authentication and a disposable-contact read passed. The transcript-to-CRM template fetched the real integration-test transcript, wrote a meeting engagement, and verified the contact association and persisted description/internal notes by reading it back. The CRM timeline showed the result. The initial transcript-ready event was a simulated replay, not newly delivered by MeetStream.
- Fixed both HubSpot templates to HTML-escape transcript/model text and convert newlines to explicit rich-text breaks. Before the fix, HubSpot collapsed speaker turns in the displayed meeting. Added a regression covering both destination fields, mixed newline styles, markup, ampersands, existing entities, empty text, and Unicode. Clarified selecting Service Key authentication when using a saved service-key credential; OAuth2 remains supported.
- The sales template's formatter and real HubSpot write/read-back also passed with a clearly labelled simulated Responses API result. This is destination-contract evidence only: no OpenAI generation and no follow-up email were performed in that test.
- Actual MeetStream lifecycle callbacks reached a temporary HTTPS webhook-only gateway and n8n, including `bot.done`; a credentialed read confirmed final bot status `Done`. Public malformed/oversized/method/path/session checks and an invalid-session rate burst passed. The tunnel/gateway were stopped and the receiver unpublished. No editor or credential endpoint was exposed. These are disposable QA ingress results, not certification of a company's future deployment.
- Workspace HMAC authentication was tested with synthetic signed requests only. Real signed workspace delivery and actual streaming-transcript delivery remain unverified. Per-bot callbacks are unsigned. AWS/S3 upload is blocked by unavailable AWS access; the saved OpenAI key remains quota-blocked and must not be recorded as a generation pass.
- Build and **37 automated tests** passed; ten local templates regenerated. The current full audit reports **0 critical, 5 high, 10 moderate** affected packages; production-only audit reports zero. Counts can change with upstream advisory data without a lockfile change. No forced downgrade or dependency override was applied.

Focused review read `templates/02-transcript-to-crm.json`, `templates/08-sales-follow-up-to-hubspot.json`, `templates/README.md`, `test/hubspot-formatting.test.mjs`, `quickstart.md`, `docs/testing.md`, and this checklist in full. Changed production inputs are transcript/model strings rendered into existing credentialed HubSpot calls. Injection/XSS checks confirm text is escaped before rich-text rendering, not evaluated as instructions. No database queries, auth grants, session handling, CSRF mechanism, cryptography, shared-state races, or public listener were added to the shipped code. Existing authentication/authorization remains the provider credential's responsibility. Disclosure checks keep local test references and payloads out of the public files. Existing input bounds remain; this patch adds no retry loop or unbounded state. Destination replay/idempotency and production ingress authentication/DoS controls remain deployment checks, not guarantees of this change. Third-party implementation internals were not exhaustively audited.

## Critical advisory remediation — 23 October 2026

- Resolved both critical affected-package findings by **exactly pinning the official `@n8n/node-cli` to 0.54.2**, which installs Handlebars 4.7.10. This CLI version is currently on npm's **beta** channel, not the stable channel. The published CLI tarball comparison against 0.52.6 showed identical executable/template files; only package dependency metadata and the TypeScript build cache differed. Its transitive SDK/linter dependencies do change, so this is a tested, pinned tooling upgrade, not a claim of zero risk.
- No runtime node, credential implementation, or public workflow JSON changed. No dependency override, vendored patch, audit exclusion, or forced downgrade was used. n8n's verification linter explicitly bans `package.json.overrides`; the patched official CLI keeps that rule enabled.
- Added four security regressions: verify the exact CLI pin and every locked Handlebars copy; reject malformed AST input in both compiler APIs; block constructor lookup through a prototype; and render the official release scaffold without corrupting GitHub expressions. The fixtures do not invoke system commands or execute injected code.
- Full audit now reports **0 critical, 9 high, and 9 moderate** findings (18 affected packages). Production-only audit still reports zero. Remaining upstream root advisories concern braces, basic-ftp, qs, stream-json, and uuid; the CLI remains affected at high severity through these other dependencies.
- CI and the tag-publish validation now **block critical findings across the full dependency tree**, including development tools. The broader high/moderate development report remains visible and non-blocking. Do not remove or lower the critical gate to make a release pass.
- A fresh install, lint, build, **36 automated tests**, **139 synthetic template checks**, generation of all ten local templates, and tarball creation passed. The new linter reports two non-blocking warnings for the existing provider-options/custom-attributes JSON fields; no rules were suppressed and their API flexibility was not removed in a security patch. All 11 execution tests also passed against the older host workflow library.
- Installed the tarball with development/peer dependencies omitted into a disposable n8n 2.41.6 custom-node directory. The server became healthy and exposed the MeetStream action and generated tool alias; custom installation uses the documented `CUSTOM` prefix. All ten local templates imported, and the synthetic fixture workflow executed **139/139 checks inside that n8n runtime**. The CLI development watcher compiled without errors in a separate disposable folder. These checks used no real provider credentials or destination writes, and test processes were stopped afterwards.
- Replace this temporary exact CLI pin with a reviewed stable release containing Handlebars 4.7.10 or newer once available. Re-run the security regressions, full audit, clean build, and isolated runtime checks before changing it. Do not switch blindly to `@latest`: the stable channel still carried the vulnerable compiler during this recheck.

References: [AST validation advisory and patched version](https://github.com/advisories/GHSA-8r5x-fm3f-whwj), [constructor-lookup advisory and patched version](https://github.com/advisories/GHSA-p8wg-vrv2-v86f). The earlier audit below records why this beta-channel candidate was initially deferred; this follow-up evaluates and pins it specifically to remediate the critical findings.

### Focused change review

Read the complete changes in `package.json`, `package-lock.json` (all changed hunks), `.github/workflows/ci.yml`, `.github/workflows/publish.yml`, `test/dependency-security.test.mjs`, and this document. The non-generated changed files were also read in full. Inputs are local package/template metadata and synthetic test data; external calls added to the workflows are read-only npm audits. No production database, request handler, credential, session, or cryptographic implementation changed.

- **Injection and XSS:** compiler/lookup regressions and ordinary scaffold rendering pass; no runtime output rendering was added.
- **Authentication, authorization/IDOR, CSRF, and session security:** no related production changes; deployment controls are not newly certified by this dependency review.
- **Cryptography and information disclosure:** registry integrity remains lockfile-backed; no custom crypto, secrets, or diagnostic payload logging added. Staged privacy checks are required before pushing.
- **Races and business logic:** no new production shared state or meeting API behavior; existing node/template regressions and the isolated runtime checks pass.
- **DoS:** no new production listener or unbounded retry loop; the remaining high/moderate development findings are acknowledged above, not suppressed.

No additional patch-specific bug was found in this review. Limits: third-party source trees were not exhaustively audited; future beta-channel changes are not covered by the exact tested pin; real destination writes, public webhook defenses, npm provenance, and n8n review remain separate checks.

## Initial bug and dependency recheck — 23 October 2026 (historical)

- Public release is owned by MeetStream. This recheck changes code and development dependencies only; it does not publish to npm, change repository visibility, or submit to n8n.
- Fixed unsupported operation names such as `constructor`, `toString`, and `__proto__` passing endpoint validation through inherited object properties. These now fail before any API request.
- Preserved `NodeApiError` identity, HTTP status (including 429), and failing batch item index rather than converting it to a generic operation error. Regression tests first reproduced both bugs against the old build.
- Updated the stable CLI patch from 0.52.2 to 0.52.6 and the development-only `n8n-workflow` from 2.41.2 to the stable-channel 2.44.2 (not beta-channel 2.45.1). Compatible lockfile refreshes include Axios 1.20.0, follow-redirects 1.16.1, ip-address 10.7.4, and undici 7.30.1. No runtime dependencies or dependency overrides were added.
- A fresh `npm ci`, lint, build, all **32 automated tests**, **139 synthetic template checks**, package dry-run, and production audit passed. All **11 node execution tests** also passed when the rebuilt node used the existing host's older `n8n-workflow` 2.41.2 library. This is an execution-library compatibility check, not a new end-to-end provider test. All ten local-development templates regenerated successfully.
- Full dependency audit improved from **25 affected-package findings (2 critical, 16 high, 7 moderate)** to **19 (2 critical, 8 high, 9 moderate)**. Audit counts include parent packages affected by a vulnerable transitive dependency; they are not counts of distinct exploitable bugs in this node. The production-only audit reports zero findings.
- Remaining root advisories concern Handlebars, braces, basic-ftp, qs, stream-json, and uuid in build/release tooling. Handlebars and its CLI parent account for the two critical findings. The CLI version carrying the Handlebars patch, 0.54.2, was tagged **beta**, while the stable channel still pinned the affected version. Do not silently adopt the beta, override exact upstream pins, or follow npm's proposed breaking downgrade of `release-it` merely to reduce an audit count.
- CI now reports the full development audit as a visible, non-blocking step, alongside the existing blocking production audit. These known development risks still need company/upstream assessment: run the tools only on reviewed source in a restricted development/CI environment, not on untrusted templates or as a public server. A zero production audit does not certify the separate hosting n8n installation.
- The earlier external-destination and public-webhook test gaps below remain unchanged. This recheck does not claim new live provider or firewall coverage.

Advisory references: [follow-redirects patch](https://github.com/advisories/GHSA-q3jh-wrc6-jgq8), [ip-address patch](https://github.com/advisories/GHSA-rxp7-6hxx-x8q5), [Handlebars code injection](https://github.com/advisories/GHSA-8r5x-fm3f-whwj), and [npm audit behavior and breaking-change controls](https://docs.npmjs.com/cli/v11/commands/npm-audit/).

## Release recheck — 20 October 2026

- Build, lint, all **31 automated tests**, and all **139 synthetic template checks** passed. The synthetic checks also passed inside local n8n; the additional release-source regression passed locally during the publication audit.
- All six post-call formatters support both `speaker`/`transcript` and `participant.name`/`words[].text`. Transcript selection compares parsed timestamps across timezone offsets and puts missing/invalid dates behind known dates.
- The live-turn filter accepts nonblank string fallbacks, preserves alternate speaker labels, and rejects malformed text or bot IDs before AI processing. Synthetic local callbacks covered final, interim, and malformed turns.
- AI prompts treat transcript content as untrusted data. Action-item and customer-insight validators require matching quotes; task output clears unsupported owners/dates and deduplicates identical tasks within one response. These checks do not guarantee semantic accuracy or exactly-once delivery.
- Scoped integration checks verified transcript retrieval, recording download and MP4 validation, calendar/Gmail connectivity, and recap/alert email delivery. Synthetic failure callbacks covered successful alert routing, unrelated events, and missing correlation IDs. Local callback tests do not prove public MeetStream webhook delivery.
- Alternative-provider processing tests used a local model and stopped before unconfigured destination writes. Those results do not validate the original OpenAI node or every possible AI output. See [local AI testing](local-ai-testing.md).
- Real CRM, task, Notion, Sheets, and storage writes still require their corresponding credentials and disposable destinations. Public webhook authentication/rate limiting, upstream development-tool advisories, and npm/n8n/template-library/MeetStream documentation publication remain release gates.
- Private credentials, workflow exports, meeting/transcript identifiers, media, signed URLs, raw execution evidence, and machine-specific test helpers are excluded from this repository. Only aggregate results and deliberately synthetic regression fixtures are published.

## Earlier read-only recheck — 19 October 2026 (historical)

- n8n MCP connected successfully to the Cloud workspace. Before testing, it exposed no saved workflows or credentials; MeetStream was absent from its node catalog. Connecting MCP does not install the community node or migrate local credentials into Cloud. Full plugin executions there remain blocked on availability in the verified catalog.
- All **65 built-in node configurations** across the ten updated templates passed the Cloud schema validator. A draft QA workflow executed **102 synthetic checks across all ten templates** successfully inside the real Cloud Code sandbox. These cover template logic with simulated external responses, not external destination writes. See `testing.md` to regenerate and import the fixture workflow.
- Cloud execution exposed a real calendar bug: the sandbox has no global `URL`, so the old check rejected valid meeting links. Replaced it with a strict supported-host HTTPS check and added a regression that runs without Node-only globals. Cancelled and non-meeting events now skip cleanly instead of failing mixed calendar batches.
- Added an actionable recording-availability check before download. Missing, empty, or non-HTTPS video URLs stop with setup/retention guidance rather than an invalid-URL failure downstream.
- Both saved local MeetStream credentials authenticated successfully (HTTP 200). **Get Bot** and **Get Transcriptions** succeeded against a saved bot. **Get Recording** returned a response indicating that mixed video was not requested, so no media download was verified. **Get Summary** returned not found. Five other recent completed bots had no successful post-call transcript ID, so a successful **Get Transcript** content fetch remains unverified.
- The saved local OpenAI key authenticated for model listing, but generation returned HTTP 429 with `insufficient_quota` / `credit_balance_exhausted`. A separate synthetic generation using the Cloud account's available n8n Gateway credits succeeded with the template's OpenAI v2.3 Responses operation and confirmed the actual email-recap expression reads its output correctly. This does not restore credit to the saved key or verify Gmail delivery.
- Gmail and Google Calendar checks returned **needs to be reconnected** because n8n could not refresh their OAuth access. Restoring those connections requires Google sign-in/consent in the instance that will execute the workflows; template changes cannot repair a revoked refresh token.
- Build, n8n lint, **25 automated tests**, package dry-run, and production dependency audit passed under Node 24. Existing development-tool advisories remain tracked in the previous audit below. No real bot was created or removed, and no email, CRM/task record, page, spreadsheet row, or storage object was written during this recheck.
- The current GitHub staging repository is private. Before npm provenance release and n8n verification, place the source in the intended public release repository and align package metadata, trusted publisher, and source commit. Do not treat a private staging push or the synthetic QA workflows as completion of the publication goal.

## Audit evidence — 14 October 2026

- Updated `@n8n/node-cli` to 0.52.2, Prettier to 3.9.10, and `release-it` to 21.1.1. Node 24 is the tested runtime. ESLint 9 and TypeScript 5 remain on the existing compatible toolchain; newer major versions are not automatically safe upgrades. `n8n-workflow` 2.41.2 is pinned for development tests and remains a host-provided peer dependency for consumers.
- Build, community-node lint, and 24 automated tests pass. Tests exercise request construction, input validation, array wrapping, batch item links, HTTP error propagation (including 429), calendar batches/cancellations, webhook filtering, malformed/empty transcripts, Responses API output/refusals, literal Sheets writes, and the release version gate.
- All 10 generated local templates import into a fresh n8n 2.41.6 database. All 64 built-in node references have supported type versions. Importing confirms compatibility of the workflow files, not successful external API calls.
- Fixed five downstream OpenAI consumers to read `output[].content[].text`, based on the installed OpenAI node implementation. Prior tests used the wrong response shape. Fixed the release job's broken shell quoting and calendar processing that previously dropped additional events in a batch.
- `npm pack --dry-run` excludes TypeScript build cache data and contains only package metadata, documentation/license, and built node/credential assets.
- Production-only dependency audit reports zero advisories. The full development dependency audit still reports **23 advisories (2 critical, 15 high, 6 moderate)** through upstream n8n/release tooling, including axios, braces, handlebars, qs, stream-json, undici, and uuid. A compatible tooling refresh and non-forced `npm audit fix` do not resolve these upstream findings; forced remediation proposes incompatible dependency changes. Do not add dependency overrides that conflict with n8n's verifier requirements. A production-only result is not a clean bill of health for the development environment or the hosting n8n instance.
- Live Gmail delivery, CRM writes, task creation, Notion/Sheets writes, storage uploads, and a real meeting-to-webhook run were not executed in this audit. Existing saved credentials alone do not prove that OAuth tokens still work. The last inspected local n8n instance requires its owner login.
- Public webhook authentication, replay protection, and inbound rate limiting still require the deployment configuration described in `webhook-security.md`. Unit tests for HTTP 429 handling do not test a deployed firewall. Destination writes can repeat on manual replay; these templates do not promise exactly-once delivery.

The product is **not yet fully certified as production-ready**. Complete the external integration smoke tests, resolve or explicitly assess upstream advisories, verify deployed webhook controls, and record the npm/n8n/template publication URLs before declaring the project goal complete.

References: [n8n community-node standards and publishing](https://docs.n8n.io/integrations/community-nodes/building-community-nodes.md), [MeetStream transcription response](https://docs.meetstream.ai/api-reference/api-endpoints/transcription/get-bot-transcriptions.md), and [MeetStream idempotency semantics](https://docs.meetstream.ai/guides/features/deduplication-idempotency-keys.md).

## Local release gate

Use Node.js 24 or newer from a clean branch:

```bash
npm ci
npm run lint
npm test
npm audit --audit-level=critical
npm pack --dry-run
npm audit --omit=dev
git diff --check
```

Confirm that the package contains only the built node/credential assets, has no runtime dependencies, contains no secrets or customer data, and that all ten templates import in the current n8n release.

## First npm release

1. Choose the public release repository with MeetStream. Metadata currently names `meetstream-ai/n8n-plugin`; the private personal repository is staging, not a release source. Promote the reviewed source into the chosen public repository and align `package.json` and publisher settings if that choice changes. Confirm homepage, author, license, keywords, and maintainer ownership.
2. Arrange npm publishing access for `n8n-nodes-meetstream`. Configure a trusted publisher for the chosen repository and `publish.yml` where available. If initial publication needs a granular token, an npm maintainer must add it as the GitHub Actions `NPM_TOKEN` secret with the minimum necessary publish/package-creation permissions; never paste it into chat or a source file. Switch to trusted publishing after bootstrap and revoke the temporary token.
3. Protect the public repository's `main` branch. The workflow now rejects a source/metadata mismatch or a private repository, and requests public npm access explicitly. A staging tag will fail safely rather than publish.
4. Only after maintainer approval, run `npm run release` from a clean `main` branch in the chosen release checkout, with its upstream pointing to that public repository. The version commit and tag start the provenance-enabled GitHub Actions publish job. Tags must exactly match the package version (no `v` prefix). Do not tag the private staging checkout.
5. Verify the public npm page, provenance badge/attestation, tarball contents, and installation into a fresh n8n instance.
6. Run `npx @n8n/scan-community-package n8n-nodes-meetstream` against the published package and save the passing output.

The official scanner checks the registry package and its provenance; it cannot certify this unpublished working tree. A successful build or package dry-run is not a substitute for that post-publication check.

References: [n8n verification requirements](https://docs.n8n.io/connect/create-nodes/build-your-node/reference/verification-guidelines.md), [submission and provenance requirements](https://docs.n8n.io/connect/create-nodes/deploy-your-node/submit-community-nodes.md), [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/), and [npm provenance](https://docs.npmjs.com/generating-provenance-statements/).

### Publication audit — 20 October 2026

- The staging push passed GitHub CI. No npm publication was found for `n8n-nodes-meetstream` during this audit.
- The public source named in package metadata existed but contained only a README, not the release code. The current GitHub account had read-only access there. A maintainer must arrange source promotion/access, or explicitly choose another public release repository; do not make staging public implicitly.
- No verified listing, Creator Portal review record, five public template URLs, or MeetStream-owned documentation URL has been supplied as completion evidence. The earlier `#16` reference must be linked to the actual submission or issue before claiming an active verification review.
- The new release safeguards are regression-tested for matching/missing/wrong source and public/private/missing visibility responses. They do not configure npm ownership or grant organization permissions.

## n8n verification

Submit or update `n8n-nodes-meetstream` in the n8n Creator Portal. Keep the submission ID, npm version, source commit, CI URL, scanner output, and reviewer correspondence together. Review feedback should be fixed by the repository maintainer; MeetStream must name that owner before submission so comments do not stall.

The **Publish** button inside the local n8n workflow editor does not publish an npm package or a template. It only activates/publishes that workflow in that n8n instance.

## Five template submissions

For each file in `templates/`:

1. Import it into a clean current n8n instance.
2. Confirm no node is unknown and all expressions resolve with representative fixture data.
3. Connect test credentials and perform an end-to-end run using accounts and meetings you control.
4. Remove execution data, credential references, bot IDs, meeting links, transcripts, and signed media URLs before export.
5. Add a clear title, problem statement, setup steps, required credentials, and a screenshot.
6. Submit it separately through the n8n template creator flow and record the resulting template URL.

The original goal requires at least five public template-library URLs. The repository now contains ten candidates; JSON files in GitHub are preparation, not publication. Publish the original five first if review bandwidth is limited, then submit templates 6–10 as the second batch.

### Remaining checks for the original five

| Candidate | Existing evidence | Before claiming a complete live test |
| --- | --- | --- |
| Calendar auto-join | Earlier real calendar trigger, bot creation, duplicate suppression and leaving exercised; packed candidate recognized in a fresh normal install | Restore the current Calendar OAuth connection for a fresh trigger retest; repeat the install smoke against the registry artifact after publication |
| Transcript to CRM | Actual signed transcription-ready callback fetched the new spoken transcript and completed HubSpot write/read-back with the correct contact | Verify the company's final deployed ingress configuration; the temporary QA gateway is not shipped |
| Live transcript to LLM | Seven fresh provider turns completed HTTPS → n8n → local Qwen; fragment protection exercised live; final group-attribution correction passed seven captured-turn rechecks | Verify the company's final ingress and actual submitted AI provider; keep source text and review semantic accuracy |
| Email recap | Real signed callback generated a complete local recap; restored Gmail sent its isolated continuation and read-back confirmed `SENT`/`INBOX` | Original OpenAI generation remains credit-blocked; test the submitted provider before claiming its complete live pass |
| Recording to storage | Real recording downloaded and MP4 validated | Connect a private S3 test bucket with least-privilege credentials and verify the uploaded object |

For callback-driven candidates, also verify the deployed authentication, replay controls, and inbound rate limiting described in [webhook-security.md](webhook-security.md). Local synthetic callbacks do not demonstrate those controls. These are our integration/production-readiness checks, not claims that every destination provider or ten-template rollout is an n8n verification prerequisite. Avoid blocking the original five on optional Sheets, ClickUp, or Notion tests.

After those checks, capture clean screenshots and submit each scenario through the [n8n template creator flow](https://docs.n8n.io/build/ways-of-building-workflows/use-templates.md). Installing the node in local n8n is separate from making it available in the verified Cloud catalog.

## MeetStream-side documentation

Publish the usage material from `README.md`, `quickstart.md`, `templates/README.md`, and `docs/webhook-security.md` on MeetStream's documentation site. Link back to the verified n8n listing and every published template URL. Repository documentation alone does not prove that the MeetStream-owned docs site was updated.

## Ownership and rollback

- **Review feedback owner:** the maintainer with write access to this repository and npm package.
- **MeetStream API questions:** MeetStream API owner/support.
- **Template content and screenshots:** template submitter/marketing owner.
- **Rollback:** deprecate a bad npm version, publish a corrected patch, and update the Creator Portal submission. Never reuse or move an existing npm version tag.
