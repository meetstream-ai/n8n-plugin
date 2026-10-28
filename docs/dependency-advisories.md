# Dependency advisory follow-up — 28 October 2026

The full development dependency audit is **not clean**. The October 28 recheck reports **30 affected packages: 24 high, 5 moderate, 1 low, 0 critical**. The same-day baseline before changes also reported 30; yesterday's 29 is a historical snapshot. Counts include parent packages affected through their dependencies, not 30 distinct bugs in the MeetStream node. The production-only audit reports zero findings and does not audit the separately installed n8n host.

## Changes retained

- Pin the official `@n8n/node-cli` patch to **0.54.3** and refresh its compatible dependency tree. Published CLI files were compared with 0.54.2: only its `package.json` changed. Its changed transitive dependencies were tested separately as described below. Handlebars remains at patched 4.7.10. This update does **not** resolve the remaining advisory count.
- Add development-only `ignore` **7.0.14** to satisfy the CLI's transitive LangChain optional peer requirement (`^7.0.5`). Previously that consumer resolved ESLint's incompatible 5.3.2 copy and `npm ls --all` failed. ESLint retains its own supported v5 copies. A fresh install now resolves both correctly without an override.
- Validate the complete installed dependency tree in CI and release validation. Keep the existing blocking production/critical audit gates and visible, non-blocking broader development audit. No advisories are ignored or reclassified.

There are no runtime dependencies, dependency overrides, vendored patches, or install hooks added to the node. The node, credentials and ten public workflow files are unchanged.

## Remaining upstream blockers

These seven vulnerable libraries account for the remaining affected packages. Versions and ranges below come from the installed lockfile, the public npm manifests, and the linked advisory reports checked on October 28.

| Library | Installed / patched | Why a compatible refresh does not resolve it |
| --- | --- | --- |
| [zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | 3.25.76 / 4.6.6+ | n8n workflow and SDK packages pin the v3 API. Forcing a v4 major migration would violate those requirements. |
| [qs](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw) | 6.15.2 / 6.17.0 | `@n8n/backend-network` 1.19.3 still pins exactly 6.15.2. Its upstream manifest must change. |
| [stream-json](https://github.com/advisories/GHSA-mjw6-4jj6-33hc) | 1.9.1 / 3.6.0+ | `@n8n/backend-common` uses `^1.9.1`; the available fix requires a major upgrade in that consumer. |
| [uuid](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | 10.0.0 / 11.1.1+ | The CLI's LangChain classic/community packages still require v10. Other workflow consumers already resolve patched v11. |
| [basic-ftp](https://github.com/advisories/GHSA-c475-qrg2-pj4r) | 5.3.1 / 6.2.1+ | `release-it` → proxy tooling → `get-uri` requires the v5 line. A patched major must be adopted upstream. |
| [undici](https://github.com/advisories/GHSA-2m5v-pch6-74hx) | 7.29.1 in `release-it` / 7.30.1+ | `release-it` 21.1.1 pins 7.29.1 exactly. The n8n tooling's separate 7.30.1 copy is already patched. |
| [deepmerge](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) | 4.3.1 / no newer upstream release found | The CLI's Stagehand dependency still uses the affected latest release. This needs an upstream patch or a supported replacement. |

`npm audit fix --dry-run` was evaluated without `--force`; it did not offer a complete compatible remediation. The suggested forced changes include substantial CLI/workflow downgrades and a `release-it` downgrade. They were not applied. Removing release tooling merely to move its vulnerabilities outside the audited tree would leave the documented local release command unsupported.

n8n's community verification linter prohibits `package.json.overrides`. Do not replace exact upstream pins through overrides, hand-edit lockfile versions outside their required ranges, suppress the verification rule, or downgrade to an older CLI carrying the previously fixed critical compiler issue. npm's [audit guidance](https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities/) distinguishes compatible updates from changes requiring manual review.

## Follow-up

The remaining advisories need patched upstream n8n/LangChain/Stagehand/release tooling or an explicitly reviewed toolchain migration. Recheck the actual pinned manifests, not just npm's `latest` tag, before updating. Keep development tools restricted to reviewed local/CI source; this repository does not provide a public tooling service.

Validate any subsequent change with a clean install, dependency-tree validation, lint, build/tests, package inspection, production and full audits, and a disposable n8n packed-install smoke test. Keep live provider/OAuth/S3 gaps in the [release checklist](release-and-verification.md) separate from dependency compatibility.

## Validation and focused review

After the final dependency change, a fresh `npm ci`, complete `npm ls --all`, lint, build and all **37 automated tests** passed under Node 24. The template suite includes **139 synthetic checks**; all ten local templates regenerated. Lint retained the two existing optional-JSON warnings and no errors. All **11 node execution tests** also passed against the older host workflow library 2.41.2 in a disposable directory.

The inspected package dry-run contained 12 expected files with no private QA files, test exports or development modules. A fresh normal community-package install of the packed candidate into disposable n8n 2.41.6 became healthy and registered `n8n-nodes-meetstream.meetStream`; the process and directory were removed afterward. No saved credentials were copied and no live destination writes were repeated. This is not npm provenance verification or completion of the remaining live integration tests.

Review covered `package.json`, every changed `package-lock.json` hunk, `test/dependency-security.test.mjs`, `.github/workflows/ci.yml`, `.github/workflows/publish.yml`, this document and `docs/release-and-verification.md`; non-generated changed files were read in full. No additional patch-specific bug was found. Injection/XSS checks cover unchanged command literals and passing compiler/scaffold regressions; no runtime rendering or input handler was added. Authentication, authorization/IDOR, CSRF, sessions, cryptography, shared-state races and meeting business logic were not modified. Lockfile registry integrity remains checked by the installer. Privacy scanning found no credentials or private QA payloads in the proposed public files. No public listener, unbounded retry or production resource-consumption path was added. The remaining upstream DoS/prototype-poisoning advisories are acknowledged above, not fixed or suppressed.

Limits: third-party implementation trees were not exhaustively audited, real provider writes were not repeated, and the tag-publish workflow was reviewed without publishing a package. Test success demonstrates the exercised compatibility cases, not a guarantee that every possible toolchain path is bug-free.
