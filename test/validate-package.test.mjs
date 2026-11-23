import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
const openAiResponse = (text) => ({
	output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text }] }],
});
const source = await readFile(
	new URL('../nodes/MeetStream/MeetStream.node.ts', import.meta.url),
	'utf8',
);

test('package metadata exposes the MeetStream node and credential', () => {
	assert.equal(pkg.name, 'n8n-nodes-meetstream');
	assert.deepEqual(pkg.publishConfig, { access: 'public' });
	assert.deepEqual(pkg.n8n.credentials, ['dist/credentials/MeetStreamApi.credentials.js']);
	assert.deepEqual(pkg.n8n.nodes, ['dist/nodes/MeetStream/MeetStream.node.js']);
	assert.equal(
		pkg.dependencies,
		undefined,
		'verified community packages must not ship runtime dependencies',
	);
	assert.equal(pkg.engines.node, '>=24');
});

test('local template generator adapts the package node type used by n8n-node dev', async () => {
	const script = await readFile(
		new URL('../scripts/prepare-local-templates.mjs', import.meta.url),
		'utf8',
	);
	assert.match(script, /n8n-nodes-meetstream\.meetStream/);
	assert.match(script, /CUSTOM\.meetStream/);
});

test('outbound API is pinned and meeting links require HTTPS', () => {
	assert.match(source, /https:\/\/api\.meetstream\.ai\/api\/v1/);
	assert.match(source, /allowedDomains: 'api\.meetstream\.ai'/);
	assert.match(source, /\.protocol === 'https:'/);
	assert.doesNotMatch(source, /process\.env|node:fs|node:child_process/);
});

test('workflow templates are complete, connected, and use concrete integrations', async () => {
	const names = (await readdir(new URL('../templates/', import.meta.url)))
		.filter((name) => name.endsWith('.json'))
		.sort();
	assert.equal(names.length, 10);
	const requiredTypes = {
		'01-calendar-auto-join.json': ['n8n-nodes-base.googleCalendarTrigger', 'n8n-nodes-base.code'],
		'02-transcript-to-crm.json': ['n8n-nodes-base.webhook', 'n8n-nodes-base.hubspot'],
		'03-live-transcript-llm.json': ['n8n-nodes-base.webhook', '@n8n/n8n-nodes-langchain.openAi'],
		'04-post-meeting-recap.json': [
			'n8n-nodes-base.webhook',
			'@n8n/n8n-nodes-langchain.openAi',
			'n8n-nodes-base.gmail',
		],
		'05-recording-to-storage.json': [
			'n8n-nodes-base.webhook',
			'n8n-nodes-base.httpRequest',
			'n8n-nodes-base.awsS3',
		],
		'06-bot-failure-email-alert.json': ['n8n-nodes-base.webhook', 'n8n-nodes-base.gmail'],
		'07-action-items-to-clickup.json': [
			'n8n-nodes-base.webhook',
			'@n8n/n8n-nodes-langchain.openAi',
			'n8n-nodes-base.clickUp',
		],
		'08-sales-follow-up-to-hubspot.json': [
			'n8n-nodes-base.webhook',
			'@n8n/n8n-nodes-langchain.openAi',
			'n8n-nodes-base.hubspot',
		],
		'09-meeting-knowledge-base-notion.json': [
			'n8n-nodes-base.webhook',
			'@n8n/n8n-nodes-langchain.openAi',
			'n8n-nodes-base.notion',
		],
		'10-customer-insights-to-google-sheets.json': [
			'n8n-nodes-base.webhook',
			'@n8n/n8n-nodes-langchain.openAi',
			'n8n-nodes-base.googleSheets',
		],
	};
	const webhookPaths = new Set();

	for (const name of names) {
		const workflow = JSON.parse(await readFile(new URL(`../templates/${name}`, import.meta.url)));
		const nodeNames = new Set(workflow.nodes.map((node) => node.name));
		const nodeTypes = new Set(workflow.nodes.map((node) => node.type));
		const setupNote = workflow.nodes.find((node) => node.type === 'n8n-nodes-base.stickyNote');
		assert.equal(workflow.settings?.executionOrder, 'v1');
		assert.ok(
			workflow.nodes.some((node) => node.type === 'n8n-nodes-meetstream.meetStream'),
			`${name} must demonstrate the MeetStream node`,
		);
		assert.ok(
			workflow.nodes.some((node) => node.type === 'n8n-nodes-base.stickyNote'),
			`${name} must explain setup inside the imported workflow`,
		);
		assert.match(setupNote.parameters.content, /saved \*\*MeetStream account\*\*/);
		assert.doesNotMatch(setupNote.parameters.content, /Create New Credential/);
		assert.ok(
			!nodeTypes.has('n8n-nodes-base.noOp'),
			`${name} must not contain placeholder No Operation nodes`,
		);
		for (const type of requiredTypes[name])
			assert.ok(nodeTypes.has(type), `${name} must contain ${type}`);
		for (const node of workflow.nodes) {
			assert.ok(node.id, `${name}: ${node.name} must have a stable ID`);
			if (node.type === 'n8n-nodes-base.webhook') {
				assert.equal(node.parameters.httpMethod, 'POST');
				assert.equal(
					node.parameters.responseMode,
					'onReceived',
					`${name} must acknowledge webhooks immediately`,
				);
				assert.ok(!webhookPaths.has(node.parameters.path), 'webhook paths must be unique');
				webhookPaths.add(node.parameters.path);
			}
			if (
				node.type === 'n8n-nodes-meetstream.meetStream' &&
				node.parameters.operation !== 'createBot'
			) {
				assert.equal(
					node.retryOnFail,
					true,
					`${name}: artifact reads must retry transient/rate-limit failures`,
				);
			}
		}
		for (const targets of Object.values(workflow.connections)) {
			for (const output of targets.main ?? []) {
				for (const connection of output)
					assert.ok(nodeNames.has(connection.node), `${name} has a connection to a missing node`);
			}
		}
	}
});

test('template code parses and public workflow files contain no credentials', async () => {
	const names = (await readdir(new URL('../templates/', import.meta.url))).filter((name) =>
		name.endsWith('.json'),
	);
	for (const name of names) {
		const workflow = JSON.parse(await readFile(new URL(`../templates/${name}`, import.meta.url)));
		for (const node of workflow.nodes) {
			assert.equal(node.credentials, undefined, `${name}: ${node.name} must not embed credentials`);
			if (node.type === 'n8n-nodes-base.code') {
				assert.doesNotThrow(
					() => new Function(node.parameters.jsCode),
					`${name}: ${node.name} must contain valid JavaScript`,
				);
			}
		}
	}
});

test('new template filters and AI-output validators handle edge cases', async () => {
	const loadWorkflow = async (name) =>
		JSON.parse(await readFile(new URL(`../templates/${name}`, import.meta.url)));
	const runCode = (workflow, nodeName, json, references = {}) => {
		const code = workflow.nodes.find((node) => node.name === nodeName).parameters.jsCode;
		const getNode = (name) => ({ item: { json: references[name] ?? {} } });
		return new Function('$json', '$', '$input', code)(json, getNode, { all: () => [{ json }] });
	};

	const failures = await loadWorkflow('06-bot-failure-email-alert.json');
	assert.deepEqual(
		runCode(failures, 'Keep actionable failures', { body: { bot_event: 'bot.inmeeting' } }),
		[],
	);
	assert.equal(
		runCode(failures, 'Keep actionable failures', {
			body: { bot_event: 'bot.failed', bot_id: 42 },
		})[0].json.bot_id,
		'42',
	);

	const actionItems = await loadWorkflow('07-action-items-to-clickup.json');
	const actionRefs = { 'Accept successful transcript event': { bot_id: 'bot-1' }, 'Prepare transcript': { transcript: 'Call customer.' } };
	assert.deepEqual(
		runCode(
			actionItems,
			'Validate and split action items',
			openAiResponse('{"items":[]}'),
			actionRefs,
		),
		[],
	);
	assert.equal(
		runCode(
			actionItems,
			'Validate and split action items',
			openAiResponse('```json\n{"items":[{"task":" Call customer ","evidence":"Call customer."}]}\n```'),
			actionRefs,
		)[0].json.task,
		'Call customer',
	);
	assert.throws(
		() =>
			runCode(actionItems, 'Validate and split action items', openAiResponse('not JSON'), actionRefs),
		/OpenAI did not return valid action-item JSON/,
	);

	const insights = await loadWorkflow('10-customer-insights-to-google-sheets.json');
	const insightRows = runCode(
		insights,
		'Validate and split insights',
		openAiResponse('{"insights":[{"category":"unexpected","insight":"Needs exports","customer_quote":"Needs exports.","sentiment":"mixed","urgency":"now"}]}'),
		{ 'Accept successful transcript event': { bot_id: 'bot-2' }, 'Prepare interview transcript': { transcript: 'Needs exports.' } },
	);
	assert.equal(insightRows[0].json.category, 'question');
	assert.equal(insightRows[0].json.sentiment, 'neutral');
	assert.equal(insightRows[0].json.urgency, 'medium');
});

test('template code safely handles malformed events, wrapped API arrays, and oversized artifacts', async () => {
	const loadWorkflow = async (name) =>
		JSON.parse(await readFile(new URL(`../templates/${name}`, import.meta.url)));
	const runCode = (workflow, nodeName, json, references = {}) => {
		const code = workflow.nodes.find((node) => node.name === nodeName).parameters.jsCode;
		const getNode = (name) => ({ item: { json: references[name] ?? {} } });
		return new Function('$json', '$', '$input', code)(json, getNode, { all: () => [{ json }] });
	};
	const successfulRuns = [
		null,
		{ status: 'Failed', transcript_id: 'failed', created_at: '2026-01-03' },
		{ status: 'Success', transcript_id: '', created_at: '2026-01-02' },
		{ status: 'Success', transcript_id: 'older', created_at: '2026-01-01' },
		{ status: 'Success', transcript_id: 'latest', created_at: '2026-01-04' },
	];

	for (const name of [
		'02-transcript-to-crm.json',
		'04-post-meeting-recap.json',
		'07-action-items-to-clickup.json',
		'08-sales-follow-up-to-hubspot.json',
		'09-meeting-knowledge-base-notion.json',
		'10-customer-insights-to-google-sheets.json',
	]) {
		const workflow = await loadWorkflow(name);
		assert.equal(
			runCode(workflow, 'Select latest successful transcript', { data: successfulRuns })[0].json
				.transcript_id,
			'latest',
			`${name} must accept the node's wrapped array response and choose the newest completed run`,
		);
		assert.throws(
			() => runCode(workflow, 'Select latest successful transcript', { data: [{ status: 'Failed' }] }),
			/No successful post-call transcription run/,
			`${name} must fail safely when no usable artifact exists`,
		);
	}

	const calendar = await loadWorkflow('01-calendar-auto-join.json');
	assert.equal(
		runCode(calendar, 'Extract meeting details', {
			id: 'event-1',
			start: { dateTime: '2026-01-01T12:00:00Z' },
			description: 'Join https://us02web.zoom.us/j/12345?pwd=secret',
		})[0].json.meetingLink,
		'https://us02web.zoom.us/j/12345?pwd=secret',
	);
	assert.deepEqual(
		runCode(calendar, 'Extract meeting details', { id: 'event-2', location: 'no conference' }),
		[],
	);

	const live = await loadWorkflow('03-live-transcript-llm.json');
	assert.deepEqual(runCode(live, 'Keep final speaker turns', { bot_id: 'bot-1', utterance: 'draft' }), []);
	assert.deepEqual(
		runCode(live, 'Keep final speaker turns', { end_of_turn: true, bot_id: 'bot-1', utterance: '   ' }),
		[],
	);
	assert.equal(
		runCode(live, 'Keep final speaker turns', {
			end_of_turn: true,
			bot_id: 7,
			transcript: 'final words',
		})[0].json.bot_id,
		'7',
	);

	const crm = await loadWorkflow('02-transcript-to-crm.json');
	const crmEvent = { 'Accept successful transcript event': { bot_id: 'bot-3', hubspot_contact_id: '42' } };
	assert.throws(
		() => runCode(crm, 'Format transcript for CRM', { data: [] }, crmEvent),
		/empty transcript/,
	);
	const oversizedTranscript = runCode(
		crm,
		'Format transcript for CRM',
		{ data: [{ speaker: 'A', transcript: 'x'.repeat(70000) }] },
		crmEvent,
	)[0].json.transcript;
	assert.ok(oversizedTranscript.length <= 60050);
	assert.match(oversizedTranscript, /Transcript truncated/);
});

test('templates model MeetStream event and artifact semantics correctly', async () => {
	const calendar = JSON.parse(
		await readFile(new URL('../templates/01-calendar-auto-join.json', import.meta.url)),
	);
	const createCalendarBot = calendar.nodes.find(
		(node) => node.type === 'n8n-nodes-meetstream.meetStream',
	);
	assert.equal(createCalendarBot.parameters.operation, 'createBot');
	assert.equal(createCalendarBot.parameters.transcriptionMode, 'postCall');
	assert.match(createCalendarBot.parameters.deduplicationKey, /deduplicationKey/);

	const crm = await readFile(
		new URL('../templates/02-transcript-to-crm.json', import.meta.url),
		'utf8',
	);
	assert.match(crm, /transcription\.processed/);
	assert.match(crm, /hubspot_contact_id/);
	assert.match(crm, /status === 'Success'/);
	assert.match(crm, /transcript_status !== 'Success'/);

	const live = JSON.parse(
		await readFile(new URL('../templates/03-live-transcript-llm.json', import.meta.url)),
	);
	const createLiveBot = live.nodes.find((node) => node.name === 'Create live transcription bot');
	assert.equal(createLiveBot.parameters.transcriptionMode, 'live');
	assert.equal(createLiveBot.parameters.liveProvider, 'deepgram_streaming');
	assert.match(createLiveBot.parameters.idempotencyKey, /\$execution\.id/);
	assert.equal(createLiveBot.retryOnFail, true);
	assert.match(JSON.stringify(live), /end_of_turn/);

	const recap = await readFile(
		new URL('../templates/04-post-meeting-recap.json', import.meta.url),
		'utf8',
	);
	const recapWorkflow = JSON.parse(recap);
	const emailNode = recapWorkflow.nodes.find((node) => node.type === 'n8n-nodes-base.gmail');
	assert.match(recap, /transcription\.processed/);
	assert.match(recap, /Get transcript/);
	assert.match(recap, /Summarize completed meeting/);
	assert.match(recap, /Email meeting recap/);
	assert.doesNotMatch(recap, /Slack|n8n-nodes-base\.slack/i);
	assert.doesNotMatch(recap, /getSummary/);
	assert.equal(emailNode.parameters.operation, 'send');
	assert.equal(emailNode.parameters.emailType, 'text');

	const storage = await readFile(
		new URL('../templates/05-recording-to-storage.json', import.meta.url),
		'utf8',
	);
	assert.match(storage, /video\.processed/);
	assert.match(storage, /video_status !== 'Success'/);
	assert.match(storage, /responseFormat[^}]*file/);

	const failures = await readFile(
		new URL('../templates/06-bot-failure-email-alert.json', import.meta.url),
		'utf8',
	);
	assert.match(failures, /bot\.denied/);
	assert.match(failures, /bot\.notallowed/);
	assert.match(failures, /bot\.failed/);
	assert.match(failures, /bot\.recording_permission_denied/);

	const actionItems = await readFile(
		new URL('../templates/07-action-items-to-clickup.json', import.meta.url),
		'utf8',
	);
	assert.match(actionItems, /explicitly agreed action items/i);
	assert.match(actionItems, /OpenAI response is missing the items array/);

	const sales = await readFile(
		new URL('../templates/08-sales-follow-up-to-hubspot.json', import.meta.url),
		'utf8',
	);
	assert.match(sales, /hubspot_contact_id/);
	assert.match(sales, /REVIEW BEFORE SENDING/);

	const notion = JSON.parse(
		await readFile(new URL('../templates/09-meeting-knowledge-base-notion.json', import.meta.url)),
	);
	const notionNode = notion.nodes.find((node) => node.type === 'n8n-nodes-base.notion');
	assert.equal(notionNode.parameters.resource, 'page');
	assert.equal(notionNode.parameters.operation, 'create');
	assert.ok(notionNode.parameters.blockUi.blockValues.length > 0);

	const insights = JSON.parse(
		await readFile(
			new URL('../templates/10-customer-insights-to-google-sheets.json', import.meta.url),
		),
	);
	const sheetsNode = insights.nodes.find((node) => node.type === 'n8n-nodes-base.googleSheets');
	assert.equal(sheetsNode.parameters.operation, 'append');
	assert.equal(sheetsNode.parameters.columns.mappingMode, 'autoMapInputData');
});
