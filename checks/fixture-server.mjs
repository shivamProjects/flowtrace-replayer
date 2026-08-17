/**
 * Static server for the check fixtures, run as its OWN process.
 *
 * It was originally in the runner process. That looked fine once the runner
 * moved off spawnSync, but it still produced intermittent 60s navigation
 * timeouts: the runner is draining two stdio pipes from a Playwright child
 * while Chromium is asking this server for the page, and any stall in that loop
 * stalls the response the browser is blocked on. A separate process cannot be
 * starved by the runner no matter what it is doing.
 *
 * Prints `PORT=<n>` on stdout once listening, then serves checks/pages.
 */

import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PAGES = join(dirname(fileURLToPath(import.meta.url)), 'pages');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
};

const server = createServer((req, res) => {
  // basename() confines this to checks/pages. Only ever reached from loopback,
  // but a path-traversal hole in a harness is still a hole.
  const name = basename(decodeURIComponent((req.url || '').split('?')[0]));
  const file = join(PAGES, name);
  if (!name || !existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/plain', connection: 'close' });
    return res.end('no such fixture');
  }
  res.writeHead(200, {
    'content-type': TYPES[name.slice(name.lastIndexOf('.'))] || 'application/octet-stream',
    // No keep-alive: each case is a fresh browser, and a socket held open from a
    // previous one is pure downside here.
    connection: 'close',
    'cache-control': 'no-store',
  });
  res.end(readFileSync(file));
});

server.listen(0, '127.0.0.1', () => {
  console.log(`PORT=${server.address().port}`);
});
