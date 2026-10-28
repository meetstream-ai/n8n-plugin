import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const pkg = JSON.parse(await readFile(new URL('package.json', root)));
const lock = JSON.parse(await readFile(new URL('package-lock.json', root)));
const cliRoot = new URL('node_modules/@n8n/node-cli/', root);
const cliRequire = createRequire(new URL('package.json', cliRoot));
const handlebars = cliRequire('handlebars');

test('security CLI is exactly pinned and every locked Handlebars copy is patched', () => {
	assert.equal(pkg.devDependencies['@n8n/node-cli'], '0.54.3');
	assert.equal(lock.packages['node_modules/@n8n/node-cli'].version, '0.54.3');
	assert.equal(pkg.overrides, undefined, 'n8n verification forbids dependency overrides');
	assert.equal(pkg.dependencies, undefined, 'the security fix must stay development-only');
	const copies = Object.entries(lock.packages).filter(([path]) => path.endsWith('/node_modules/handlebars') || path === 'node_modules/handlebars');
	assert.ok(copies.length > 0);
	for (const [path, entry] of copies) assert.equal(entry.version, '4.7.10', path);
	assert.equal(handlebars.VERSION, '4.7.10', 'check the engine actually resolved by the CLI');
});

test('patched compiler rejects type-confused ASTs in compile and precompile', () => {
	const ast = handlebars.parse('{{#if enabled}}ok{{/if}}');
	// Harmless malformed input exercises GHSA-8r5x-fm3f-whwj without executing code.
	ast.body[0].program.blockParams = { length: '0' };
	assert.throws(() => handlebars.compile(ast)({ enabled: true }), /Invalid AST.*blockParams/);
	assert.throws(() => handlebars.precompile(ast), /Invalid AST.*blockParams/);
});

test('patched lookup blocks the own-property constructor bypass', () => {
	// GHSA-p8wg-vrv2-v86f: inspect access only; do not supply code to a constructor.
	const render = handlebars.compile('{{#if (lookup target "constructor")}}unsafe{{else}}blocked{{/if}}');
	assert.equal(render({ target: Function.prototype }, { allowProtoMethodsByDefault: true }), 'blocked');
});

test('patched compiler still renders the official CLI release scaffold correctly', async () => {
	const template = await readFile(new URL('dist/template/templates/shared/default/.github/workflows/publish.yml', cliRoot), 'utf8');
	const rendered = handlebars.compile(template, { noEscape: true })({ packageManager: { name: 'npm', installCommand: 'ci' } });
	assert.match(rendered, /run: 'npm ci'/);
	assert.match(rendered, /npm run release/);
	assert.match(rendered, /\$\{\{ secrets\.NPM_TOKEN \}\}/);
	assert.doesNotMatch(rendered, /\{\{packageManager\./);
});
