/**
 * Checks for report branding resolution.
 *
 * Separate from run.mjs because these need no browser — they are plain unit
 * checks over src/reporting/branding.js. `npm run checks` runs both files.
 *
 * Worth pinning because the failure mode here is silent by design:
 * `drawPageHeader` guards every logo with `fs.existsSync`, so a logo path that
 * resolves to nothing produces a report that looks fine and is missing customer
 * branding. That is exactly how the API report shipped for months pointing at an
 * `assets/logo.png` that has never existed in this repository.
 */

import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const { PRODUCT_LOGO, PARTNER_LOGO, resolveCustomerLogo } = require(join(HERE, '..', 'src', 'reporting', 'branding.js'));

const failures = [];
const check = async (name, fn) => {
  try {
    await fn();
    console.log(`pass  ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
    console.log(`FAIL  ${name}\n        ${e.message}`);
  }
};

const eq = (actual, expected, what) => {
  if (actual !== expected) throw new Error(`${what}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
};

// Shipped assets must exist. If one is renamed or dropped, every report quietly
// loses that mark — no error, no log line.
await check('assets/shipped-logos-exist', () => {
  for (const [name, p] of [['PRODUCT_LOGO', PRODUCT_LOGO], ['PARTNER_LOGO', PARTNER_LOGO]]) {
    if (!existsSync(p)) throw new Error(`${name} does not exist: ${p}`);
  }
});

await check('branding/no-logo-configured-resolves-to-null', async () => {
  const never = async () => { throw new Error('S3 must not be called when there is no logo path'); };
  eq(await resolveCustomerLogo(null, HERE, never), null, 'null path');
  eq(await resolveCustomerLogo(undefined, HERE, never), null, 'undefined path');
  eq(await resolveCustomerLogo('', HERE, never), null, 'empty path');
});

await check('branding/s3-copy-is-used-when-it-lands', async () => {
  const downloaded = PRODUCT_LOGO; // stand-in for a real download, and it exists
  eq(await resolveCustomerLogo('acme.png', HERE, async () => downloaded), downloaded, 'downloaded path');
});

// The one that matters: a missing file must not be handed to the PDF builder as
// though it were there.
await check('branding/s3-miss-with-no-local-copy-resolves-to-null', async () => {
  eq(await resolveCustomerLogo('acme.png', HERE, async () => null), null, 'S3 returned null');
  eq(await resolveCustomerLogo('acme.png', HERE, async () => '/no/such/file.png'), null, 'S3 returned a dead path');
});

await check('branding/s3-failure-is-not-fatal', async () => {
  eq(await resolveCustomerLogo('acme.png', HERE, async () => { throw new Error('network down'); }), null, 'S3 threw');
});

console.log(`\n${failures.length ? `${failures.length} FAILED` : 'all branding checks passed'}`);
process.exit(failures.length ? 1 : 0);
