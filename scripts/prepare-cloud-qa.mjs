import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const templateDirectory = new URL('../templates/', import.meta.url);
const response = text => ({ output: [{ type: 'message', content: [{ type: 'output_text', text }] }] });

// Inline the actual template source: the Cloud sandbox must execute it without eval,
// require, network access, credentials, or Node-only globals such as URL.
export async function buildTemplateQa() {
	const workflows = await Promise.all((await readdir(templateDirectory)).filter(f => f.endsWith('.json'))
		.map(async file => ({ file, ...JSON.parse(await readFile(new URL(file, templateDirectory), 'utf8')) })));
	const blocks = [];
	let checkCount = 0;
	for (const w of workflows) for (const n of w.nodes.filter(n => n.type === 'n8n-nodes-base.code')) {
		const source = n.parameters.jsCode;
		const cases = [];
		const add = (label, json, count, options = {}) => cases.push({ label, json, count, ...options });
		if (n.name === 'Extract meeting details') {
			const event = { id: 'qa-event', start: { dateTime: '2026-10-20T10:00:00Z' }, hangoutLink: 'https://meet.google.com/abc-defg-hij' };
			add('mixed batch', {}, 2, { items: [event, { ...event, id: 'qa-two', hangoutLink: 'https://company.zoom.us/j/123' }, { ...event, status: 'cancelled' }, { id: 'reminder' }] });
			for (const link of ['https://meet.google.com.evil.example/test', 'http://zoom.us/j/123', 'https://user@zoom.us/j/123', 'https://zoom.us:444/j/123']) add('ignore unsafe URL: ' + link, {}, 0, { items: [{ ...event, hangoutLink: link }] });
			add('missing deduplication ID', {}, 0, { items: [{ ...event, id: undefined }], error: true });
		} else if (source.includes('const event = payload.bot_event')) {
			const event = { bot_event: n.name.includes('failures') ? 'bot.failed' : n.name.includes('video') ? 'video.processed' : 'transcription.processed', bot_id: 'qa-bot', transcript_status: 'Success', video_status: 'Success', custom_attributes: { hubspot_contact_id: 'qa-contact' } };
			add('direct event', event, 1);
			add('wrapped event', { body: event }, 1);
			add('unrelated event', { ...event, bot_event: 'unrelated' }, 0);
			add('missing bot ID', { ...event, bot_id: undefined }, 0, { error: true });
			if (source.includes('const contactId')) add('missing CRM correlation', { ...event, custom_attributes: {} }, 0, { error: true });
		} else if (n.name === 'Select latest successful transcript') {
			const runs = [null, { status: 'Failed', transcript_id: 'failed' }, { status: 'Success', transcript_id: 'old', created_at: '2026-10-01' }, { status: 'Success', transcript_id: 'newest', created_at: '2026-10-02' }];
			add('wrapped runs', { data: runs }, 1, { contains: 'newest' });
			add('named runs', { transcriptions: runs }, 1, { contains: 'newest' });
			add('no completed runs', { data: [null, { status: 'Pending' }] }, 0, { error: true });
			add('timezone offsets sort chronologically', { data: [{ status: 'Success', transcript_id: 'older', created_at: '2026-10-20T10:00:00+05:30' }, { status: 'Success', transcript_id: 'newest', created_at: '2026-10-20T06:00:00Z' }] }, 1, { contains: 'newest' });
			add('invalid date does not displace a known date', { data: [{ status: 'Success', transcript_id: 'invalid', created_at: 'not-a-date' }, { status: 'Success', transcript_id: 'newest', created_at: '2026-10-20T06:00:00Z' }] }, 1, { contains: 'newest' });
			add('missing date remains usable when it is the only result', { data: [{ status: 'Success', transcript_id: 'undated' }] }, 1, { contains: 'undated' });
		} else if (source.includes('const segments =')) {
			add('mixed transcript segments', { data: [null, {}, { transcript: 'Hello world' }, { transcript: 42 }] }, 1, { contains: 'Hello world' });
			add('participant and timed words from live API', { data: [null, { participant: { name: 'Alex' }, words: [null, {}, { text: 42 }, { text: 'Launch', start_timestamp: { relative: 1 } }, { text: 'Friday.' }] }] }, 1, { contains: 'Alex: Launch Friday.' });
			add('empty timed words', { data: [{ words: [null, {}, { text: ' ' }] }] }, 0, { error: true });
			add('empty speech', { data: [null, { transcript: '  ' }] }, 0, { error: true });
			add('large transcript', { data: [{ transcript: '' }] }, 1, { maxText: 60200, largeTranscript: true });
		} else if (n.name === 'Keep final speaker turns') {
			add('final turn', { body: { bot_id: 'qa-bot', end_of_turn: true, utterance: 'Hello world' } }, 1, { contains: 'Hello world' });
			add('partial turn', { bot_id: 'qa-bot', end_of_turn: false, utterance: 'Hello' }, 0);
			add('empty final turn', { bot_id: 'qa-bot', end_of_turn: true }, 0);
			add('blank utterance falls back to transcript', { bot_id: 'qa-bot', end_of_turn: true, utterance: '  ', transcript: 'Fallback speech' }, 1, { contains: 'Fallback speech' });
			add('malformed text is not coerced into speech', { bot_id: 'qa-bot', end_of_turn: true, utterance: {}, transcript: [], new_text: 42 }, 0);
			add('alternate speaker label', { bot_id: 'qa-bot', end_of_turn: true, utterance: 'Speech', speakerName: '  ', speaker: 'Mira' }, 1, { contains: 'Mira' });
			add('malformed bot ID', { bot_id: {}, end_of_turn: true, utterance: 'Speech' }, 0);
		} else if (n.name === 'Validate live summary') {
			add('complete live summary', response('Mira will review the documentation tomorrow.'), 1, { contains: 'Mira will review' });
			add('short fragment stays verbatim', response('The meeting will be finalized on Friday.'), 1, { refs: { text: 'on Friday' }, summary: 'on Friday' });
			add('numeric fragment stays verbatim', response('The launch budget is fifty dollars.'), 1, { refs: { text: 'Fifty dollars.' }, summary: 'Fifty dollars.' });
			add('group decision is not reassigned to the speaker', response('Arjun decided to launch on Friday.'), 1, { refs: { text: 'We decided to launch the sample project on Friday.' }, summary: 'We decided to launch the sample project on Friday.' });
			for (const json of [{}, { output: {} }, { output: [null, { content: [null] }] }, response('null'), response(''), { output: [{ content: [{ type: 'refusal' }] }] }]) add('reject empty or malformed summary', json, 0, { error: true });
			add('reject oversized summary', response('word '.repeat(66)), 0, { error: true });
		} else if (n.name === 'Require recording URL') {
			add('ready recording', { video_url: 'https://storage.example.test/recording.mp4' }, 1);
			add('video not requested', { video_status: 'NotRequested' }, 0, { error: true });
			add('empty URL', { video_url: '' }, 0, { error: true });
			add('unsafe URL scheme', { video_url: 'http://storage.example.test/recording.mp4' }, 0, { error: true });
		} else if (n.name === 'Prepare failure alert') {
			add('missing API failure message', {}, 1, { contains: 'MeetStream needs attention' });
			add('wrapped bot details meeting link', { bot_details: { MeetingLink: 'https://meet.google.com/abc-defg-hij' } }, 1, { contains: 'https://meet.google.com/abc-defg-hij' });
		} else if (n.name === 'Validate and split action items') {
			add('fenced action JSON', response('```json\n{"items":[{"task":" Send estimate ","evidence":"Send estimate."},null,{}]}\n```'), 1, { contains: 'Send estimate' });
			add('reject invented action evidence', response('{"items":[{"task":"Send estimate","evidence":"Invented quote"}]}'), 0, { error: true });
			add('no action items', response('{"items":[]}'), 0);
			add('invalid JSON', response('not JSON'), 0, { error: true });
			add('null model output', response('null'), 0, { error: true });
			add('refusal', { output: [{ type: 'message', content: [{ type: 'refusal' }] }] }, 0, { error: true });
		} else if (n.name === 'Validate and format sales insights') {
			add('sales analysis', response('{"summary":"Follow up next week"}'), 1, { contains: 'Follow up next week' });
			add('task owner is not a decision maker', response('{"decision_makers":"Meera"}'), 1, { contains: 'Decision makers: Not stated' });
			const role = 'Meera is the final decision maker for this purchase.';
			add('explicit named role quote', response(JSON.stringify({decision_makers:'Meera',decision_makers_evidence:role})), 1, {refs:{transcript:role},contains:'Decision makers: Meera'});
			const selfRole = 'I am the final decision maker for this purchase.';
			add('explicit self-role at start of named speaker turn', response(JSON.stringify({decision_makers:'Meera',decision_makers_evidence:selfRole})), 1, {refs:{transcript:'Meera: '+selfRole},contains:'Decision makers: Meera'});
			add('fabricated role quote', response(JSON.stringify({decision_makers:'Meera',decision_makers_evidence:role})), 1, {contains:'Decision makers: Not stated'});
			const negativeRole = 'Meera is not the decision maker.';
			add('negated role quote', response(JSON.stringify({decision_makers:'Meera',decision_makers_evidence:negativeRole})), 1, {refs:{transcript:negativeRole},contains:'Decision makers: Not stated'});
			for (const text of ['null', '[]', 'not JSON']) add('invalid sales output: ' + text, response(text), 0, { error: true });
		} else if (n.name === 'Validate Notion content') {
			add('note', response('Meeting decisions'), 1, { contains: 'Meeting decisions' });
			add('large note', response(''), 1, { maxText: 1900, largeNote: true });
			add('empty model output', { output: [] }, 0, { error: true });
		} else if (n.name === 'Validate and split insights') {
			add('invalid category defaults', response('{"insights":[{"insight":"Needs export","customer_quote":"Needs export.","category":"unexpected"},null]}'), 1, { contains: 'question' });
			add('reject invented customer quote', response('{"insights":[{"insight":"Needs export","customer_quote":"Invented quote"}]}'), 0, { error: true });
			add('no insights', response('{"insights":[]}'), 0);
			for (const text of ['null', 'not JSON']) add('invalid insight output: ' + text, response(text), 0, { error: true });
		} else throw new Error('No Cloud fixture coverage for ' + w.file + ': ' + n.name);
		const refs = { bot_id: 'qa-bot', hubspot_contact_id: 'qa-contact', bot_event: 'bot.failed', timestamp: '2026-10-19T10:00:00Z', transcript: 'Send estimate. Needs export.', text: 'Mira will review the integration documentation tomorrow before the project launch.', speaker: 'Mira' };
		blocks.push(`{ const run = function($json, $, $input) {\n${source}\n};\nfor (const test of ${JSON.stringify(cases)}) {\nif (test.largeTranscript) test.json.data[0].transcript = 'x'.repeat(61000);\nif (test.largeNote) test.json.output[0].content[0].text = 'x'.repeat(3000);\nconst reference = {json:{...${JSON.stringify(refs)},...test.refs}};\ncheck(${JSON.stringify(w.file + ': ' + n.name)} + ' / ' + test.label, () => run(test.json, () => ({item:reference,first:() => reference}), {all:() => (test.items ?? [test.json]).map(json => ({json}))}), test);\n} }`);
		checkCount += cases.length;
	}
	const email = workflows.find(w => w.file.startsWith('04-')).nodes.find(n => n.type === 'n8n-nodes-base.gmail');
	blocks.push(`{const render = function($json) { return (${email.parameters.message.slice(3, -2)}); }; check('04 recap email / Responses text', () => [{json:{text:render(${JSON.stringify(response('Synthetic meeting recap'))})}}], {count:1,contains:'Synthetic meeting recap'}); check('04 recap email / refusal', () => render({output:[]}), {error:true});}`);
	checkCount += 2;
	const jsCode = `const results = [];\nfunction check(name, execute, expected) {\n let rows;\n try { rows = execute(); } catch(error) { results.push({name,passed:!!expected.error,detail:expected.error?'rejected as expected':error.message}); return; }\n const serialized = JSON.stringify(rows);\n const passed = !expected.error && rows.length === expected.count && (!expected.contains || serialized.includes(expected.contains)) && (expected.summary === undefined || rows[0]?.json.summary === expected.summary) && (!expected.maxText || rows.every(item => (item.json.transcript ?? item.json.note ?? '').length <= expected.maxText));\n results.push({name,passed});\n}\n${blocks.join('\n')}\nconst failures=results.filter(r=>!r.passed);\nif(failures.length) throw new Error(JSON.stringify(failures));\nreturn [{json:{passed:true,templates:${workflows.length},checks:results.length,results}}];`;
	const start = { id: 'qa-start', name: 'Start QA', type: 'n8n-nodes-base.manualTrigger', typeVersion: 1, parameters: {}, position: [0, 0] };
	const suite = { id: 'qa-suite', name: 'Run template fixtures', type: 'n8n-nodes-base.code', typeVersion: 2, parameters: { mode: 'runOnceForAllItems', jsCode }, position: [250, 0] };
	const workflow = { name: 'MeetStream QA — Template checks (synthetic)', nodes: [start, suite], connections: { 'Start QA': { main: [[{ node: suite.name, type: 'main', index: 0 }]] } }, settings: { executionOrder: 'v1' } };
	const sdk = `const start = trigger(${JSON.stringify({ type: start.type, version: 1, config: { name: start.name, parameters: {} } })});\nconst suite = node(${JSON.stringify({ type: suite.type, version: 2, config: { name: suite.name, parameters: suite.parameters } })});\nexport default workflow('meetstream-template-qa','MeetStream QA — Template checks (synthetic)').add(start).to(suite);\n`;
	return { jsCode, workflow, sdk, checkCount };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const qa = await buildTemplateQa();
	const output = new URL('../.local/qa/', import.meta.url);
	await mkdir(output, { recursive: true });
	await writeFile(new URL('template-checks.json', output), JSON.stringify(qa.workflow, null, 2) + '\n');
	await writeFile(new URL('template-checks.sdk.ts', output), qa.sdk);
	console.log(`Generated ${qa.checkCount} synthetic checks across 10 templates in .local/qa/. No credentials or external requests.`);
}
