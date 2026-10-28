import { readFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
const match = /^https:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/.exec(pkg.repository?.url ?? '');
const repository = process.env.GITHUB_REPOSITORY;
if (!match || !repository || match[1].toLowerCase() !== repository.toLowerCase()) {
	console.error('Release blocked: GITHUB_REPOSITORY must match the public GitHub repository in package.json. Staging is not a release source.');
	process.exit(1);
}
