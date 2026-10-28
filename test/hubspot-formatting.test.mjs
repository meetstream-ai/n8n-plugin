import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

test('HubSpot bodies preserve line breaks and render untrusted text literally', () => {
	for (const file of ['02-transcript-to-crm.json', '08-sales-follow-up-to-hubspot.json']) {
		const flow = JSON.parse(readFileSync(new URL(`../templates/${file}`, import.meta.url), 'utf8'));
		const node = flow.nodes.find(n => n.type === 'n8n-nodes-base.hubspot');
		for (const field of ['body', 'internalMeetingNotes']) {
			const expression = node.parameters.metadata[field];
			assert.ok(expression.startsWith('={{ ') && expression.endsWith(' }}'));
			const render = text => runInNewContext(expression.slice(3, -2), {
				$json: { transcript: text, body: text },
			});
			assert.equal(render('Alex: One\nMira: Two'), 'Alex: One<br>Mira: Two');
			assert.equal(render('A\r\nB\rC\nD'), 'A<br>B<br>C<br>D');
			assert.equal(render('<img src="x"> & <script>bad()</script>'), '&lt;img src="x"&gt; &amp; &lt;script&gt;bad()&lt;/script&gt;');
			assert.equal(render('&lt;tag&gt;'), '&amp;lt;tag&amp;gt;');
			assert.equal(render(''), '');
			assert.equal(render('Mira: café — 🙂 {{ $secrets }}'), 'Mira: café — 🙂 {{ $secrets }}');
		}
	}
});
